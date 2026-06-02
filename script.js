// ============================================
// BOOKMCQ - OOP ENCAPSULATED WITH CACHE SYSTEM
// ============================================

// Security Manager - Handles all security features
class SecurityManager {
    #isDevMode = false;
    
    constructor() {
        this.#initSecurity();
    }
    
    #initSecurity() {
        // Disable right-click
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Disable keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const forbidden = [
                'PrintScreen', 'F12', 'F5', 'F11',
                (e.ctrlKey && e.shiftKey && e.key === 'I'),
                (e.ctrlKey && e.shiftKey && e.key === 'C'),
                (e.ctrlKey && e.key === 'u'),
                (e.ctrlKey && e.key === 's'),
                (e.ctrlKey && e.key === 'p')
            ];
            
            if (forbidden.includes(e.key) || forbidden.some(cond => cond === true)) {
                e.preventDefault();
                return false;
            }
        });
        
        // Disable drag and drop
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Disable text selection
        document.addEventListener('selectstart', (e) => {
            if (!e.target.closest('input') && !e.target.closest('textarea')) {
                e.preventDefault();
                return false;
            }
        });
        
        // Disable copy on images
        document.querySelectorAll('img').forEach(img => {
            img.style.pointerEvents = 'none';
        });
    }
    
    // Anti-debugging
    enableAntiDebug() {
        setInterval(() => {
            debugger;
        }, 100);
        
        const devToolsCheck = () => {
            const threshold = 160;
            if (window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold) {
                document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1>Developer Tools Detected</h1><p>Please close developer tools to continue.</p></div>';
            }
        };
        
        setInterval(devToolsCheck, 1000);
    }
}

// Cache Manager - Handles local caching for performance
class CacheManager {
    #cachePrefix = 'bookmcq_';
    #ttl = 3600000; // 1 hour default
    
    set(key, data, ttl = this.#ttl) {
        try {
            const item = {
                data: data,
                timestamp: Date.now(),
                ttl: ttl
            };
            localStorage.setItem(this.#cachePrefix + key, JSON.stringify(item));
            return true;
        } catch(e) {
            return false;
        }
    }
    
    get(key) {
        try {
            const item = localStorage.getItem(this.#cachePrefix + key);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            if (Date.now() - parsed.timestamp > parsed.ttl) {
                this.remove(key);
                return null;
            }
            
            return parsed.data;
        } catch(e) {
            return null;
        }
    }
    
    remove(key) {
        localStorage.removeItem(this.#cachePrefix + key);
    }
    
    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.#cachePrefix)) {
                localStorage.removeItem(key);
            }
        });
    }
}

// Supabase Service - Handles all database operations
class SupabaseService {
    #supabase;
    #cache;
    #url = 'https://wnsuuazwcxmuwqyphvse.supabase.co';
    #key = 'sb_publishable_qsQzf3RycZtO8Uj1hd3mcg_jaX6iQ9C';
    
    constructor() {
        this.#cache = new CacheManager();
        this.#supabase = window.supabase.createClient(this.#url, this.#key);
    }
    
    async getBooks() {
        const cached = this.#cache.get('books');
        if (cached) return cached;
        
        const { data, error } = await this.#supabase
            .from('books')
            .select('id, title, author')
            .order('title');
        
        if (error) throw error;
        
        this.#cache.set('books', data);
        return data;
    }
    
    async getTopics(bookId) {
        const cached = this.#cache.get(`topics_${bookId}`);
        if (cached) return cached;
        
        const { data, error } = await this.#supabase
            .from('topics')
            .select('id, name, chapter_number')
            .eq('book_id', bookId)
            .order('chapter_number');
        
        if (error) throw error;
        
        this.#cache.set(`topics_${bookId}`, data);
        return data;
    }
    
    async getQuestions(topicId, difficulty, limit = 15) {
        const cacheKey = `questions_${topicId}_${difficulty}`;
        const cached = this.#cache.get(cacheKey);
        if (cached) return cached;
        
        let query = this.#supabase
            .from('questions')
            .select(`
                id,
                question_text,
                difficulty,
                correct_answer,
                explanation,
                options (option_text, option_index)
            `)
            .eq('topic_id', topicId)
            .eq('difficulty', difficulty)
            .limit(limit);
        
        const { data, error } = await query;
        if (error) throw error;
        
        const formatted = (data || []).map(q => ({
            id: q.id,
            text: q.question_text,
            options: (q.options || []).sort((a,b) => a.option_index - b.option_index).map(o => o.option_text),
            correct: q.correct_answer,
            explanation: q.explanation || 'No explanation available',
            difficulty: q.difficulty
        }));
        
        this.#cache.set(cacheKey, formatted);
        return formatted;
    }
    
    async getPaginatedQuestions(topicId, page = 1, pageSize = 20) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const cacheKey = `questions_page_${topicId}_${page}`;
        const cached = this.#cache.get(cacheKey);
        if (cached) return cached;
        
        const { data, error, count } = await this.#supabase
            .from('questions')
            .select(`
                id,
                question_text,
                difficulty,
                correct_answer,
                explanation,
                options (option_text, option_index)
            `, { count: 'exact' })
            .eq('topic_id', topicId)
            .range(from, to)
            .order('id');
        
        if (error) throw error;
        
        const formatted = (data || []).map(q => ({
            id: q.id,
            text: q.question_text,
            options: (q.options || []).sort((a,b) => a.option_index - b.option_index).map(o => o.option_text),
            correct: q.correct_answer,
            explanation: q.explanation || 'No explanation available',
            difficulty: q.difficulty
        }));
        
        const result = { questions: formatted, total: count || 0 };
        this.#cache.set(cacheKey, result);
        return result;
    }
    
    async saveProgress(userId, questionId, isCorrect) {
        const { error } = await this.#supabase
            .from('user_progress')
            .insert([{ user_id: userId, question_id: questionId, is_correct: isCorrect }]);
        
        if (error) throw error;
    }
    
    async getStats() {
        const cached = this.#cache.get('stats');
        if (cached) return cached;
        
        const { count: booksCount } = await this.#supabase.from('books').select('*', { count: 'exact', head: true });
        const { count: questionsCount } = await this.#supabase.from('questions').select('*', { count: 'exact', head: true });
        
        const stats = { books: booksCount || 0, questions: questionsCount || 0 };
        this.#cache.set('stats', stats);
        return stats;
    }
}

// Quiz Manager - Handles quiz logic
class QuizManager {
    #questions = [];
    #currentIndex = 0;
    #score = 0;
    #answerLocked = false;
    #startTime = null;
    
    setQuestions(questions) {
        this.#questions = [...questions];
        this.#currentIndex = 0;
        this.#score = 0;
        this.#answerLocked = false;
        this.#startTime = Date.now();
    }
    
    getCurrentQuestion() {
        if (this.#currentIndex >= this.#questions.length) return null;
        return this.#questions[this.#currentIndex];
    }
    
    checkAnswer(selectedIndex) {
        const currentQ = this.getCurrentQuestion();
        const isCorrect = (selectedIndex === currentQ.correct);
        
        if (isCorrect) this.#score++;
        this.#answerLocked = true;
        
        return {
            isCorrect,
            correctAnswer: currentQ.correct,
            explanation: currentQ.explanation,
            correctText: currentQ.options[currentQ.correct]
        };
    }
    
    nextQuestion() {
        if (!this.#answerLocked) return false;
        this.#currentIndex++;
        this.#answerLocked = false;
        return this.#currentIndex < this.#questions.length;
    }
    
    isComplete() {
        return this.#currentIndex >= this.#questions.length;
    }
    
    getScore() { return this.#score; }
    getTotalQuestions() { return this.#questions.length; }
    getCurrentIndex() { return this.#currentIndex + 1; }
    getProgress() { return (this.#currentIndex / this.#questions.length) * 100; }
    canAnswer() { return !this.#answerLocked; }
    getTimeTaken() { return Math.floor((Date.now() - this.#startTime) / 1000); }
}

// Navigation Manager
class NavigationManager {
    #currentPage = 'home';
    #pages = ['home', 'quiz', 'practice', 'about', 'contact', 'privacy'];
    
    showPage(pageName) {
        this.#pages.forEach(page => {
            const element = document.getElementById(`${page}Page`);
            if (element) element.classList.add('hidden');
        });
        
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) targetPage.classList.remove('hidden');
        
        this.#currentPage = pageName;
        
        // Update navigation active states
        const navLinks = ['Home', 'Quiz', 'Practice', 'About', 'Contact', 'Privacy'];
        navLinks.forEach(link => {
            const navElement = document.getElementById(`nav${link}`);
            if (navElement) {
                if (link.toLowerCase() === pageName.toLowerCase()) {
                    navElement.classList.add('active');
                } else {
                    navElement.classList.remove('active');
                }
            }
        });
        
        // Close mobile menu
        const dropdown = document.getElementById('mobileDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Trigger page-specific loads
        if (pageName === 'quiz') {
            window.dispatchEvent(new Event('quizPageShown'));
        }
        if (pageName === 'practice') {
            window.dispatchEvent(new Event('practicePageShown'));
        }
    }
    
    getCurrentPage() { return this.#currentPage; }
}

// UI Manager - Handles all UI updates
class UIManager {
    #toastTimeout = null;
    
    showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.style.background = isError ? '#ef4444' : '#1f2937';
        toast.classList.remove('hidden');
        
        if (this.#toastTimeout) clearTimeout(this.#toastTimeout);
        this.#toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    showSkeleton(containerId, count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = Array(count).fill(0).map(() => `
            <div class="skeleton h-32 w-full mb-4"></div>
        `).join('');
    }
    
    hideSkeleton(containerId) {
        // Skeleton is replaced by actual content
    }
    
    renderQuestion(question, index, total, score, progress) {
        document.getElementById('questionText').textContent = question.text;
        document.getElementById('questionCounter').textContent = `Question ${index} / ${total}`;
        document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
        document.getElementById('progressFill').style.width = `${progress}%`;
        
        const container = document.getElementById('optionsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        question.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.textContent = `${String.fromCharCode(65+idx)}. ${opt}`;
            btn.className = `option-btn w-full text-left p-3 rounded-xl bg-white text-gray-800 font-medium transition`;
            btn.dataset.index = idx;
            container.appendChild(btn);
        });
        
        document.getElementById('feedbackMessage').classList.add('hidden');
        document.getElementById('nextBtn').disabled = true;
    }
    
    showResult(score, total) {
        document.getElementById('quizArea').classList.add('hidden');
        document.getElementById('resultsArea').classList.remove('hidden');
        document.getElementById('finalScore').textContent = score;
        document.getElementById('totalQuestions').textContent = total;
        document.getElementById('resultProgress').style.width = `${(score / total) * 100}%`;
    }
    
    resetQuizUI() {
        document.getElementById('quizArea').classList.remove('hidden');
        document.getElementById('resultsArea').classList.add('hidden');
    }
    
    showFeedback(isCorrect, explanation, correctLetter, correctText) {
        const feedbackDiv = document.getElementById('feedbackMessage');
        
        if (isCorrect) {
            feedbackDiv.className = "correct-feedback p-4 rounded-xl text-white font-semibold mb-6";
            feedbackDiv.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ✅ Correct! ${explanation || ''}`;
        } else {
            feedbackDiv.className = "wrong-feedback p-4 rounded-xl text-white font-semibold mb-6";
            feedbackDiv.innerHTML = `<i class="fas fa-times-circle mr-2"></i> ❌ Wrong! Correct answer: ${correctLetter}. "${correctText}" ${explanation || ''}`;
        }
        
        feedbackDiv.classList.remove('hidden');
    }
    
    enableNextButton() {
        document.getElementById('nextBtn').disabled = false;
    }
    
    disableNextButton() {
        document.getElementById('nextBtn').disabled = true;
    }
    
    lockOptions() {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
        });
    }
    
    highlightSelectedOption(selectedIdx) {
        document.querySelectorAll('.option-btn').forEach((btn, idx) => {
            btn.classList.remove('selected-option');
            if (idx === selectedIdx) btn.classList.add('selected-option');
        });
    }
}

// Practice Manager - Handles practice page logic
class PracticeManager {
    #supabaseService;
    #uiManager;
    #currentPage = 1;
    #totalPages = 0;
    #currentTopicId = null;
    #questionsCache = new Map();
    
    constructor(supabaseService, uiManager) {
        this.#supabaseService = supabaseService;
        this.#uiManager = uiManager;
    }
    
    async loadBooks(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Loading books...</option>';
        
        try {
            const books = await this.#supabaseService.getBooks();
            
            if (!books || books.length === 0) {
                select.innerHTML = '<option value="">No books available</option>';
                return;
            }
            
            select.innerHTML = '<option value="">-- Select a Book --</option>';
            books.forEach(book => {
                select.innerHTML += `<option value="${book.id}">${this.#escapeHtml(book.title)}</option>`;
            });
        } catch(e) {
            select.innerHTML = '<option value="">Error loading books</option>';
            this.#uiManager.showToast('Error loading books', true);
        }
    }
    
    async loadTopics(bookId, selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        if (!bookId) {
            select.innerHTML = '<option value="">Select a book first</option>';
            select.disabled = true;
            return;
        }
        
        select.innerHTML = '<option value="">Loading topics...</option>';
        select.disabled = false;
        
        try {
            const topics = await this.#supabaseService.getTopics(bookId);
            
            if (!topics || topics.length === 0) {
                select.innerHTML = '<option value="">No topics available</option>';
                return;
            }
            
            select.innerHTML = '<option value="">-- Select a Topic --</option>';
            topics.forEach(topic => {
                const display = topic.chapter_number ? `Ch ${topic.chapter_number}: ${topic.name}` : topic.name;
                select.innerHTML += `<option value="${topic.id}">${this.#escapeHtml(display)}</option>`;
            });
        } catch(e) {
            select.innerHTML = '<option value="">Error loading topics</option>';
        }
    }
    
    async loadQuestions(topicId, containerId, paginationId, page = 1) {
        if (!topicId) return;
        
        this.#currentTopicId = topicId;
        this.#currentPage = page;
        
        this.#uiManager.showSkeleton(containerId, 5);
        
        try {
            const cacheKey = `${topicId}_${page}`;
            let result;
            
            if (this.#questionsCache.has(cacheKey)) {
                result = this.#questionsCache.get(cacheKey);
            } else {
                result = await this.#supabaseService.getPaginatedQuestions(topicId, page, 10);
                this.#questionsCache.set(cacheKey, result);
            }
            
            this.#totalPages = Math.ceil(result.total / 10);
            this.#renderPagination(paginationId);
            
            if (!result.questions || result.questions.length === 0) {
                document.getElementById(containerId).innerHTML = '<div class="text-center py-8 text-gray-500">No questions found for this topic</div>';
                return;
            }
            
            document.getElementById(containerId).innerHTML = result.questions.map((q, idx) => {
                const globalNumber = (page - 1) * 10 + idx + 1;
                const difficultyColor = q.difficulty === 'easy' ? 'text-green-600 bg-green-50' : 
                                      q.difficulty === 'medium' ? 'text-yellow-600 bg-yellow-50' : 
                                      'text-red-600 bg-red-50';
                return `
                    <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 practice-card">
                        <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
                            <span class="font-bold text-purple-600 text-sm">Q${globalNumber}</span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${difficultyColor}">${q.difficulty.toUpperCase()}</span>
                        </div>
                        <p class="font-medium text-gray-800 mb-4">${this.#escapeHtml(q.text)}</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                            ${q.options.map((opt, optIdx) => `
                                <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg ${optIdx === q.correct ? 'border-l-4 border-green-500' : ''}">
                                    <span class="font-semibold text-gray-600 w-6">${String.fromCharCode(65+optIdx)}.</span>
                                    <span class="text-gray-700 text-sm">${this.#escapeHtml(opt)}</span>
                                    ${optIdx === q.correct ? '<i class="fas fa-check-circle text-green-500 ml-auto"></i>' : ''}
                                </div>
                            `).join('')}
                        </div>
                        ${q.explanation ? `<div class="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-gray-600"><i class="fas fa-info-circle text-blue-500 mr-2"></i>${this.#escapeHtml(q.explanation)}</div>` : ''}
                    </div>
                `;
            }).join('');
        } catch(e) {
            document.getElementById(containerId).innerHTML = '<div class="text-center py-8 text-red-500">Error loading questions</div>';
            this.#uiManager.showToast('Error loading questions', true);
        }
    }
    
    #renderPagination(paginationId) {
        const container = document.getElementById(paginationId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex justify-between items-center">
                <button id="practicePrevBtn" class="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:opacity-50" ${this.#currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span class="text-sm">Page ${this.#currentPage} of ${this.#totalPages || 1}</span>
                <button id="practiceNextBtn" class="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:opacity-50" ${this.#currentPage >= this.#totalPages ? 'disabled' : ''}>Next</button>
            </div>
        `;
        
        const prevBtn = document.getElementById('practicePrevBtn');
        const nextBtn = document.getElementById('practiceNextBtn');
        
        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.#currentPage > 1) {
                    this.loadQuestions(this.#currentTopicId, 'practiceQuestionsContainer', 'practicePagination', this.#currentPage - 1);
                }
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.#currentPage < this.#totalPages) {
                    this.loadQuestions(this.#currentTopicId, 'practiceQuestionsContainer', 'practicePagination', this.#currentPage + 1);
                }
            };
        }
    }
    
    #escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    resetPage() {
        this.#currentPage = 1;
        this.#currentTopicId = null;
    }
}

// Category Manager - Handles clickable stats (500+ books, etc.)
class CategoryManager {
    #supabaseService;
    
    constructor(supabaseService) {
        this.#supabaseService = supabaseService;
    }
    
    async init() {
        const stats = await this.#supabaseService.getStats();
        
        document.getElementById('statBooks').textContent = `${stats.books}+ Books`;
        document.getElementById('statMcqs').textContent = `${stats.questions}+ MCQs`;
    }
    
    setupClickHandlers() {
        const categoryBooks = document.getElementById('categoryBooks');
        const categoryMcqs = document.getElementById('categoryMcqs');
        const categoryProgress = document.getElementById('categoryProgress');
        
        if (categoryBooks) {
            categoryBooks.onclick = () => window.navigation.showPage('practice');
        }
        
        if (categoryMcqs) {
            categoryMcqs.onclick = () => window.navigation.showPage('quiz');
        }
        
        if (categoryProgress) {
            categoryProgress.onclick = () => this.#showProgress();
        }
    }
    
    #showProgress() {
        // Show progress modal or navigate to progress page
        window.navigation.showPage('quiz');
    }
}

// Mobile Menu Manager
class MobileMenuManager {
    #dropdownId = 'mobileDropdown';
    #isOpen = false;
    
    toggle() {
        const dropdown = document.getElementById(this.#dropdownId);
        if (dropdown) {
            this.#isOpen = !this.#isOpen;
            dropdown.classList.toggle('hidden');
        }
    }
    
    close() {
        const dropdown = document.getElementById(this.#dropdownId);
        if (dropdown) {
            dropdown.classList.add('hidden');
            this.#isOpen = false;
        }
    }
}

// Main Application Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize all services
    const security = new SecurityManager();
    const supabaseService = new SupabaseService();
    const uiManager = new UIManager();
    const navigation = new NavigationManager();
    const quiz = new QuizManager();
    const practiceManager = new PracticeManager(supabaseService, uiManager);
    const categoryManager = new CategoryManager(supabaseService);
    const mobileMenu = new MobileMenuManager();
    
    // Make global for onclick handlers
    window.navigation = navigation;
    window.mobileMenu = mobileMenu;
    window.quizManager = quiz;
    window.uiManager = uiManager;
    window.practiceManager = practiceManager;
    
    // Category stats click handler
    categoryManager.setupClickHandlers();
    await categoryManager.init();
    
    // Quiz page load handler
    window.addEventListener('quizPageShown', async () => {
        const books = await supabaseService.getBooks();
        const bookSelect = document.getElementById('bookSelect');
        
        if (books && books.length > 0) {
            bookSelect.innerHTML = '<option value="">-- Select a Book --</option>';
            books.forEach(book => {
                bookSelect.innerHTML += `<option value="${book.id}">${book.title}</option>`;
            });
        }
    });
    
    // Practice page load handler
    window.addEventListener('practicePageShown', async () => {
        practiceManager.resetPage();
        await practiceManager.loadBooks('practiceBookSelect');
    });
    
    // Quiz filter handlers
    document.getElementById('bookSelect')?.addEventListener('change', async (e) => {
        const topics = await supabaseService.getTopics(e.target.value);
        const topicSelect = document.getElementById('topicSelect');
        
        if (topics && topics.length > 0) {
            topicSelect.disabled = false;
            topicSelect.innerHTML = '<option value="">-- Select a Topic --</option>';
            topics.forEach(topic => {
                const display = topic.chapter_number ? `Ch ${topic.chapter_number}: ${topic.name}` : topic.name;
                topicSelect.innerHTML += `<option value="${topic.id}">${display}</option>`;
            });
        } else {
            topicSelect.disabled = true;
            topicSelect.innerHTML = '<option value="">No topics available</option>';
        }
    });
    
    // Practice filters
    document.getElementById('practiceBookSelect')?.addEventListener('change', async (e) => {
        await practiceManager.loadTopics(e.target.value, 'practiceTopicSelect');
        document.getElementById('practiceQuestionsContainer').innerHTML = '<div class="text-center py-8 text-gray-500">Select a topic to view questions</div>';
    });
    
    document.getElementById('practiceTopicSelect')?.addEventListener('change', async (e) => {
        if (e.target.value) {
            await practiceManager.loadQuestions(e.target.value, 'practiceQuestionsContainer', 'practicePagination');
        }
    });
    
    // Start quiz button
    document.getElementById('startQuizBtn')?.addEventListener('click', async () => {
        const bookId = document.getElementById('bookSelect').value;
        const topicId = document.getElementById('topicSelect').value;
        const difficulty = document.getElementById('difficultySelect').value;
        
        if (!bookId || !topicId) {
            uiManager.showToast('Please select both a book and a topic', true);
            return;
        }
        
        uiManager.showToast('Loading questions...');
        
        try {
            const questions = await supabaseService.getQuestions(topicId, difficulty, 15);
            
            if (!questions || questions.length === 0) {
                uiManager.showToast('No questions found. Try different options!', true);
                return;
            }
            
            quiz.setQuestions(questions);
            const currentQ = quiz.getCurrentQuestion();
            
            uiManager.resetQuizUI();
            uiManager.renderQuestion(
                currentQ,
                quiz.getCurrentIndex(),
                quiz.getTotalQuestions(),
                quiz.getScore(),
                quiz.getProgress()
            );
            
            // Setup option click handlers
            document.querySelectorAll('.option-btn').forEach((btn, idx) => {
                btn.onclick = () => {
                    if (!quiz.canAnswer()) return;
                    
                    const result = quiz.checkAnswer(idx);
                    uiManager.highlightSelectedOption(idx);
                    
                    const correctLetter = String.fromCharCode(65 + result.correctAnswer);
                    uiManager.showFeedback(result.isCorrect, result.explanation, correctLetter, result.correctText);
                    uiManager.enableNextButton();
                    uiManager.lockOptions();
                    
                    // Save progress (if user logged in)
                    // await supabaseService.saveProgress(userId, currentQ.id, result.isCorrect);
                };
            });
        } catch(e) {
            uiManager.showToast('Error loading questions', true);
        }
    });
    
    // Next question button
    document.getElementById('nextBtn')?.addEventListener('click', () => {
        const hasNext = quiz.nextQuestion();
        
        if (hasNext) {
            const currentQ = quiz.getCurrentQuestion();
            uiManager.renderQuestion(
                currentQ,
                quiz.getCurrentIndex(),
                quiz.getTotalQuestions(),
                quiz.getScore(),
                quiz.getProgress()
            );
            
            // Reattach option handlers
            document.querySelectorAll('.option-btn').forEach((btn, idx) => {
                btn.onclick = () => {
                    if (!quiz.canAnswer()) return;
                    
                    const result = quiz.checkAnswer(idx);
                    uiManager.highlightSelectedOption(idx);
                    
                    const correctLetter = String.fromCharCode(65 + result.correctAnswer);
                    uiManager.showFeedback(result.isCorrect, result.explanation, correctLetter, result.correctText);
                    uiManager.enableNextButton();
                    uiManager.lockOptions();
                };
            });
        } else {
            uiManager.showResult(quiz.getScore(), quiz.getTotalQuestions());
        }
    });
    
    // Restart button
    document.getElementById('restartBtn')?.addEventListener('click', async () => {
        const bookId = document.getElementById('bookSelect').value;
        const topicId = document.getElementById('topicSelect').value;
        const difficulty = document.getElementById('difficultySelect').value;
        
        if (bookId && topicId) {
            const questions = await supabaseService.getQuestions(topicId, difficulty, 15);
            if (questions && questions.length > 0) {
                quiz.setQuestions(questions);
                const currentQ = quiz.getCurrentQuestion();
                uiManager.resetQuizUI();
                uiManager.renderQuestion(
                    currentQ,
                    quiz.getCurrentIndex(),
                    quiz.getTotalQuestions(),
                    quiz.getScore(),
                    quiz.getProgress()
                );
                
                document.querySelectorAll('.option-btn').forEach((btn, idx) => {
                    btn.onclick = () => {
                        if (!quiz.canAnswer()) return;
                        
                        const result = quiz.checkAnswer(idx);
                        uiManager.highlightSelectedOption(idx);
                        
                        const correctLetter = String.fromCharCode(65 + result.correctAnswer);
                        uiManager.showFeedback(result.isCorrect, result.explanation, correctLetter, result.correctText);
                        uiManager.enableNextButton();
                        uiManager.lockOptions();
                    };
                });
            }
        }
    });
    
    // Contact form handler
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        uiManager.showToast('Thank you for your message! We\'ll get back to you soon.');
        e.target.reset();
    });
    
    // Set initial page
    navigation.showPage('home');
    
    // Hide loading states
    document.body.classList.add('loaded');
});
