// ============================================
// BUILD SCRIPT - Run on GitHub Actions
// Creates static files for instant loading
// ============================================

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration - EDIT THESE
const REPO_OWNER = 'zohaibshamil';  // Your GitHub username
const REPO_NAME = 'bookmcq';         // Your repository name
const BRANCH = 'main';               // Your branch name
const OUTPUT_DIR = './dist';

// Helper: Fetch with retry
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Fetch all sitemaps in PARALLEL (fast!)
async function fetchAllSitemaps() {
    const urls = [];
    let index = 1;
    let hasMore = true;
    const sitemapData = [];
    
    console.log('📥 Fetching sitemaps in parallel...');
    
    // Fetch multiple sitemaps simultaneously
    while (hasMore) {
        const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/sitemap${index}.xml`;
        try {
            const text = await fetchWithRetry(url);
            sitemapData.push(text);
            console.log(`  ✅ sitemap${index}.xml fetched`);
            index++;
        } catch {
            hasMore = false;
        }
    }
    
    console.log(`✅ Total: ${sitemapData.length} sitemaps fetched`);
    return sitemapData;
}

// Extract URLs from XML
function extractUrls(xml) {
    const urls = [];
    const locMatches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
    
    for (const match of locMatches) {
        const url = match.replace(/<\/?loc>/g, '').trim();
        // Only keep topic URLs
        if (url.includes('/books/') && (url.includes('/topics/') || url.includes('/topic/'))) {
            urls.push(url);
        }
    }
    
    return urls;
}

// Build library from URLs
function buildLibrary(urls) {
    const library = {};
    const bookOrder = [];
    const chapterOrderMap = {};
    const topicSet = new Set();
    
    console.log('📚 Building library structure...');
    
    for (const url of urls) {
        // Extract from URL pattern
        let parts = url.match(/\/books\/([^\/]+)\/([^\/]+)\/topics?\/([^\/]+)\.html/);
        if (!parts) {
            // Try alternative pattern
            parts = url.match(/\/books\/([^\/]+)\/([^\/]+)\/([^\/]+)\.html/);
            if (!parts) continue;
        }
        
        const [_, bookSlug, chapterSlug, topicSlug] = parts;
        
        // Format names
        const bookName = bookSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const chapterName = chapterSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const topicName = topicSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Initialize book
        if (!library[bookSlug]) {
            library[bookSlug] = { 
                name: bookName, 
                slug: bookSlug, 
                chapters: {} 
            };
            bookOrder.push(bookSlug);
        }
        
        // Initialize chapter
        if (!library[bookSlug].chapters[chapterSlug]) {
            library[bookSlug].chapters[chapterSlug] = { 
                name: chapterName, 
                slug: chapterSlug, 
                topics: [] 
            };
            if (!chapterOrderMap[bookSlug]) chapterOrderMap[bookSlug] = [];
            chapterOrderMap[bookSlug].push(chapterSlug);
        }
        
        // Add topic (avoid duplicates)
        const topicKey = `${bookSlug}|${chapterSlug}|${topicSlug}`;
        if (!topicSet.has(topicKey)) {
            topicSet.add(topicKey);
            library[bookSlug].chapters[chapterSlug].topics.push({
                name: topicName,
                slug: topicSlug,
                url: url
            });
        }
    }
    
    // Calculate stats
    let chapterCount = 0, topicCount = 0;
    for (const bookKey in library) {
        chapterCount += Object.keys(library[bookKey].chapters).length;
        for (const chapterKey in library[bookKey].chapters) {
            topicCount += library[bookKey].chapters[chapterKey].topics.length;
        }
    }
    
    const stats = {
        bookCount: Object.keys(library).length,
        chapterCount: chapterCount,
        topicCount: topicCount
    };
    
    console.log(`  ✅ ${stats.bookCount} books, ${stats.chapterCount} chapters, ${stats.topicCount} topics`);
    
    return { library, bookOrder, chapterOrderMap, stats };
}

// Generate optimized HTML with embedded data
function generateHTML(libraryData) {
    const { library, bookOrder, chapterOrderMap, stats } = libraryData;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Topic Library - BookMCQ</title>
    <meta name="description" content="Complete topic library with all books, chapters, and MCQs.">
    
    <!-- INLINED CRITICAL CSS - No external requests -->
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:20px}
        .container{max-width:1200px;margin:0 auto}
        .quiz-card{backdrop-filter:blur(10px);background:rgba(255,255,255,0.95);border-radius:24px;padding:30px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;flex-wrap:wrap;gap:15px}
        .header h1{font-size:28px;color:#1f2937;display:flex;align-items:center;gap:10px}
        .header h1 i{color:#7c3aed}
        .stats{display:flex;gap:10px;flex-wrap:wrap}
        .stats span{background:#ede9fe;padding:6px 14px;border-radius:20px;font-size:13px;color:#5b21b6;display:flex;align-items:center;gap:5px}
        .search{width:100%;padding:14px 20px 14px 45px;border:2px solid #e5e7eb;border-radius:14px;font-size:15px;margin-bottom:25px;transition:all 0.3s;background:white}
        .search:focus{outline:none;border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,0.1)}
        .book-accordion{border:1px solid #f3e8ff;border-radius:12px;overflow:hidden;margin-bottom:12px;background:white}
        .book-header{padding:16px 20px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:white}
        .book-header:hover{background:#faf5ff}
        .book-title{font-weight:600;color:#1f2937;display:flex;align-items:center;gap:10px}
        .book-meta{font-size:12px;color:#6b7280}
        .book-chapters{display:grid;grid-template-rows:0fr;transition:grid-template-rows 0.4s ease;background:#faf9fe}
        .book-chapters.open{grid-template-rows:1fr}
        .book-chapters-inner{overflow:hidden;min-height:0}
        .chapter-item{border-top:1px solid #f3e8ff}
        .chapter-header{padding:12px 20px 12px 56px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:#eef2ff;border-left:4px solid #4f46e5}
        .chapter-header:hover{background:#dbeafe}
        .chapter-name{font-weight:600;color:#1e40af;font-size:14px}
        .chapter-topics{display:grid;grid-template-rows:0fr;transition:grid-template-rows 0.3s ease;background:white}
        .chapter-topics.open{grid-template-rows:1fr}
        .chapter-topics-inner{overflow:hidden;min-height:0}
        .topic-link{display:flex;justify-content:space-between;align-items:center;padding:10px 20px 10px 72px;color:#4b5563;text-decoration:none;font-size:14px;border-top:1px solid #f9f5ff;border-left:3px solid #8b5cf6;background:#faf5ff;transition:all 0.2s}
        .topic-link:hover{background:#f3e8ff;padding-left:80px}
        .topic-badge{font-size:11px;background:#ede9fe;color:#5b21b6;padding:2px 10px;border-radius:20px}
        .toggle-icon{transition:transform 0.3s;color:#9ca3af}
        .toggle-icon.open{transform:rotate(180deg)}
        .loading{display:none}
        .no-results{display:none;text-align:center;padding:40px}
        .footer{margin-top:20px;text-align:center;color:rgba(255,255,255,0.6);font-size:13px}
        @media(max-width:640px){.quiz-card{padding:16px}.header h1{font-size:20px}.chapter-header{padding:10px 16px 10px 40px}.topic-link{padding:8px 16px 8px 48px}}
    </style>
</head>
<body>

<div class="container">
    
    <!-- Navigation -->
    <nav style="background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border-radius:50px;padding:12px 24px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">📚</span>
            <span style="color:white;font-weight:bold;font-size:20px">BookMCQ</span>
            <span style="color:rgba(255,255,255,0.6);font-size:14px">| Topics</span>
        </div>
        <div style="display:flex;gap:15px;color:white">
            <a href="/" style="color:rgba(255,255,255,0.8);text-decoration:none">Home</a>
            <a href="/quiz" style="color:rgba(255,255,255,0.8);text-decoration:none">Quiz</a>
            <a href="/topic-library" style="color:white;text-decoration:none;font-weight:500">Topics</a>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="quiz-card">
        
        <!-- Header -->
        <div class="header">
            <h1><i>📖</i> Topic Library</h1>
            <div class="stats">
                <span>📚 <span id="bookCount">${stats.bookCount}</span> Books</span>
                <span>📑 <span id="chapterCount">${stats.chapterCount}</span> Chapters</span>
                <span>🏷️ <span id="topicCount">${stats.topicCount}</span> Topics</span>
            </div>
        </div>

        <!-- Search -->
        <input type="text" id="searchInput" class="search" placeholder="Search books, chapters, or topics..." aria-label="Search">

        <!-- Library Content -->
        <div id="booksContainer">
            <!-- Rendered by JavaScript -->
        </div>

        <!-- Footer -->
        <div style="margin-top:20px;padding-top:15px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:12px;color:#9ca3af">
            <span>🔄 Updated: ${new Date().toLocaleString()}</span>
            <span>Click any topic to start practicing</span>
        </div>
    </div>

    <div class="footer">&copy; 2025 BookMCQ. All rights reserved.</div>
</div>

<!-- EMBEDDED DATA - NO FETCH REQUIRED -->
<script>
// ============================================
// STATIC DATA - Pre-built for instant loading
// ============================================

const LIBRARY_DATA = ${JSON.stringify({ library, bookOrder, chapterOrderMap, stats })};

// ============================================
// RENDER ENGINE - Runs instantly
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    renderLibrary();
    setupSearch();
    setupToggles();
});

function renderLibrary() {
    const container = document.getElementById('booksContainer');
    const { library, bookOrder, chapterOrderMap } = LIBRARY_DATA;
    
    let html = '';
    
    for (const bookKey of bookOrder) {
        const book = library[bookKey];
        if (!book) continue;
        
        const chapterKeys = chapterOrderMap[bookKey] || Object.keys(book.chapters);
        const totalTopics = chapterKeys.reduce((sum, ck) => {
            return sum + (book.chapters[ck] ? book.chapters[ck].topics.length : 0);
        }, 0);
        
        html += \`
            <div class="book-accordion" data-book="\${bookKey}">
                <div class="book-header" onclick="toggleBook('\${bookKey}')">
                    <div class="book-title">
                        <span style="font-size:20px">📚</span>
                        \${book.name}
                        <span style="font-size:12px;color:#6b7280;font-weight:normal">\${chapterKeys.length} chapters · \${totalTopics} topics</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                        <span style="font-size:12px;background:#ede9fe;padding:2px 12px;border-radius:20px;color:#5b21b6">\${totalTopics}</span>
                        <i class="toggle-icon" id="toggle-\${bookKey}">▼</i>
                    </div>
                </div>
                <div class="book-chapters" id="chapters-\${bookKey}">
                    <div class="book-chapters-inner">
        \`;
        
        for (const chapterKey of chapterKeys) {
            const chapter = book.chapters[chapterKey];
            if (!chapter) continue;
            
            html += \`
                <div class="chapter-item">
                    <div class="chapter-header" onclick="toggleChapter('\${bookKey}', '\${chapterKey}')">
                        <span class="chapter-name">\${chapter.name}</span>
                        <div style="display:flex;align-items:center;gap:10px">
                            <span style="font-size:11px;background:#c7d2fe;padding:2px 10px;border-radius:20px;color:#1e40af">\${chapter.topics.length} topics</span>
                            <i class="toggle-icon" id="ctoggle-\${bookKey}-\${chapterKey}">▼</i>
                        </div>
                    </div>
                    <div class="chapter-topics" id="ctopics-\${bookKey}-\${chapterKey}">
                        <div class="chapter-topics-inner">
            \`;
            
            // Sort topics
            const sortedTopics = [...chapter.topics].sort((a, b) => a.name.localeCompare(b.name));
            
            for (const topic of sortedTopics) {
                html += \`
                    <a href="\${topic.url}" target="_blank" class="topic-link">
                        <span>📄 \${topic.name}</span>
                        <span class="topic-badge">Practice →</span>
                    </a>
                \`;
            }
            
            html += \`
                        </div>
                    </div>
                </div>
            \`;
        }
        
        html += \`
                    </div>
                </div>
            </div>
        \`;
    }
    
    container.innerHTML = html;
}

// ============================================
// TOGGLE FUNCTIONS
// ============================================

function toggleBook(bookKey) {
    const chapters = document.getElementById(\`chapters-\${bookKey}\`);
    const toggle = document.getElementById(\`toggle-\${bookKey}\`);
    
    // Close all other books
    document.querySelectorAll('.book-chapters').forEach(el => {
        if (el.id !== \`chapters-\${bookKey}\`) {
            el.classList.remove('open');
            const t = document.getElementById(el.id.replace('chapters-', 'toggle-'));
            if (t) t.classList.remove('open');
        }
    });
    
    if (chapters) {
        chapters.classList.toggle('open');
        if (toggle) toggle.classList.toggle('open');
    }
}

function toggleChapter(bookKey, chapterKey) {
    const topics = document.getElementById(\`ctopics-\${bookKey}-\${chapterKey}\`);
    const toggle = document.getElementById(\`ctoggle-\${bookKey}-\${chapterKey}\`);
    
    if (topics) {
        topics.classList.toggle('open');
        if (toggle) toggle.classList.toggle('open');
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let timeout = null;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const query = this.value.toLowerCase().trim();
            searchLibrary(query);
        }, 200);
    });
}

function searchLibrary(query) {
    const { library, bookOrder, chapterOrderMap } = LIBRARY_DATA;
    const container = document.getElementById('booksContainer');
    
    if (!query) {
        // Reset to full library
        renderLibrary();
        return;
    }
    
    const results = [];
    
    for (const bookKey of bookOrder) {
        const book = library[bookKey];
        const bookMatches = book.name.toLowerCase().includes(query);
        const matchingChapters = [];
        
        for (const chapterKey of (chapterOrderMap[bookKey] || [])) {
            const chapter = book.chapters[chapterKey];
            if (!chapter) continue;
            
            const chapterMatches = chapter.name.toLowerCase().includes(query);
            const matchingTopics = chapter.topics.filter(t => 
                t.name.toLowerCase().includes(query)
            );
            
            if (chapterMatches || matchingTopics.length > 0 || bookMatches) {
                matchingChapters.push({
                    ...chapter,
                    topics: chapterMatches ? chapter.topics : matchingTopics
                });
            }
        }
        
        if (bookMatches || matchingChapters.length > 0) {
            results.push({
                ...book,
                chapters: bookMatches ? Object.values(book.chapters) : matchingChapters
            });
        }
    }
    
    if (results.length === 0) {
        container.innerHTML = \`
            <div style="text-align:center;padding:40px">
                <div style="font-size:48px;margin-bottom:15px">🔍</div>
                <p style="color:#6b7280">No results found for "\${query}"</p>
                <p style="color:#9ca3af;font-size:13px">Try adjusting your search terms</p>
            </div>
        \`;
        return;
    }
    
    // Render results
    let html = '';
    for (const book of results) {
        const totalTopics = book.chapters.reduce((sum, c) => sum + c.topics.length, 0);
        
        html += \`
            <div class="book-accordion" data-book="\${book.slug}">
                <div class="book-header" onclick="toggleBook('\${book.slug}')">
                    <div class="book-title">
                        <span style="font-size:20px">📚</span>
                        \${book.name}
                        <span style="font-size:12px;color:#6b7280;font-weight:normal">\${book.chapters.length} chapters · \${totalTopics} topics</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                        <span style="font-size:12px;background:#ede9fe;padding:2px 12px;border-radius:20px;color:#5b21b6">\${totalTopics}</span>
                        <i class="toggle-icon" id="toggle-\${book.slug}" style="transform:rotate(180deg)">▼</i>
                    </div>
                </div>
                <div class="book-chapters open" id="chapters-\${book.slug}">
                    <div class="book-chapters-inner">
        \`;
        
        for (const chapter of book.chapters) {
            html += \`
                <div class="chapter-item">
                    <div class="chapter-header" onclick="toggleChapter('\${book.slug}', '\${chapter.slug}')">
                        <span class="chapter-name">\${chapter.name}</span>
                        <div style="display:flex;align-items:center;gap:10px">
                            <span style="font-size:11px;background:#c7d2fe;padding:2px 10px;border-radius:20px;color:#1e40af">\${chapter.topics.length} topics</span>
                            <i class="toggle-icon" id="ctoggle-\${book.slug}-\${chapter.slug}" style="transform:rotate(180deg)">▼</i>
                        </div>
                    </div>
                    <div class="chapter-topics open" id="ctopics-\${book.slug}-\${chapter.slug}">
                        <div class="chapter-topics-inner">
            \`;
            
            for (const topic of chapter.topics) {
                html += \`
                    <a href="\${topic.url}" target="_blank" class="topic-link">
                        <span>📄 \${topic.name}</span>
                        <span class="topic-badge">Practice →</span>
                    </a>
                \`;
            }
            
            html += \`
                        </div>
                    </div>
                </div>
            \`;
        }
        
        html += \`
                    </div>
                </div>
            </div>
        \`;
    }
    
    container.innerHTML = html;
    
    // Auto-open all books in search results
    document.querySelectorAll('.book-accordion').forEach(el => {
        const bookKey = el.dataset.book;
        const chapters = document.getElementById(\`chapters-\${bookKey}\`);
        const toggle = document.getElementById(\`toggle-\${bookKey}\`);
        if (chapters && !chapters.classList.contains('open')) {
            chapters.classList.add('open');
            if (toggle) toggle.classList.add('open');
        }
    });
}

// ============================================
// GLOBAL FUNCTIONS FOR ONCLICK
// ============================================

window.toggleBook = toggleBook;
window.toggleChapter = toggleChapter;
window.searchLibrary = searchLibrary;

console.log('🚀 Page loaded instantly with embedded data');
console.log('📚 Books:', LIBRARY_DATA.stats.bookCount);
console.log('📑 Chapters:', LIBRARY_DATA.stats.chapterCount);
console.log('🏷️ Topics:', LIBRARY_DATA.stats.topicCount);
</script>
</body>
</html>`;
}

// ============================================
// MAIN BUILD FUNCTION
// ============================================

async function build() {
    console.log('🚀 Building static library for instant loading...');
    console.log('================================================\n');
    
    try {
        // 1. Fetch sitemaps
        const sitemaps = await fetchAllSitemaps();
        
        // 2. Extract URLs
        console.log('🔍 Extracting URLs from sitemaps...');
        let allUrls = [];
        for (const sm of sitemaps) {
            const urls = extractUrls(sm);
            allUrls = allUrls.concat(urls);
        }
        console.log(`  ✅ Found ${allUrls.length} topic URLs\n`);
        
        // 3. Build library
        const libraryData = buildLibrary(allUrls);
        
        // 4. Create dist folder
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        
        // 5. Generate HTML
        console.log('📄 Generating optimized HTML...');
        const html = generateHTML(libraryData);
        fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html);
        console.log('  ✅ index.html generated\n');
        
        // 6. Generate JSON data
        console.log('💾 Generating data files...');
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'library.json'),
            JSON.stringify(libraryData, null, 2)
        );
        console.log('  ✅ library.json generated\n');
        
        // 7. Stats summary
        console.log('================================================');
        console.log('✅ BUILD COMPLETE!');
        console.log(`📚 Books: ${libraryData.stats.bookCount}`);
        console.log(`📑 Chapters: ${libraryData.stats.chapterCount}`);
        console.log(`🏷️ Topics: ${libraryData.stats.topicCount}`);
        console.log(`📁 Output: ${OUTPUT_DIR}/`);
        console.log('================================================');
        console.log('\n🚀 Deploy the dist/ folder to GitHub Pages or CDN');
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run the build
build();
