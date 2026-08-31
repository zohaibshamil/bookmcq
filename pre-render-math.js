// pre-render-math.js - MathJax Node for server-side rendering
const fs = require('fs');
const path = require('path');
const mjAPI = require('mathjax-node');

// Configure MathJax
mjAPI.config({
    MathJax: {
        SVG: {
            fontCache: 'global'
        }
    }
});
mjAPI.start();

console.log('🚀 Starting math pre-rendering with MathJax (server-side)...');
console.log('📁 ONLY processing files in the "books" folder...');
console.log('📌 All other folders will be ignored.\n');

// Helper to render math synchronously
function renderMath(math, display = false) {
    let result = math;
    let completed = false;
    
    mjAPI.typeset({
        math: math,
        format: 'TeX',
        svg: true,
        speakText: false,
        ex: 6,
        width: 1000,
        display: display
    }, function(data) {
        if (data.errors) {
            console.log('  ⚠️ MathJax error:', data.errors);
        } else {
            result = data.svg;
        }
        completed = true;
    });
    
    // Wait for completion (simple polling)
    let attempts = 0;
    while (!completed && attempts < 50) {
        attempts++;
        // This is a synchronous wait - MathJax Node should be synchronous
    }
    
    return result;
}

function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Process \(...\) style
        let processed = text.replace(/\\\((.+?)\\\)/g, function(match, math) {
            try {
                const rendered = renderMath(math, false);
                if (rendered && rendered !== math) {
                    return rendered;
                }
                return match;
            } catch (e) {
                return match;
            }
        });
        
        // Process $...$ style
        processed = processed.replace(/\$(.+?)\$/g, function(match, math) {
            try {
                const rendered = renderMath(math, false);
                if (rendered && rendered !== math) {
                    return rendered;
                }
                return match;
            } catch (e) {
                return match;
            }
        });
        
        // Process \[...\] style (display math)
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            try {
                const rendered = renderMath(math, true);
                if (rendered && rendered !== math) {
                    return rendered;
                }
                return match;
            } catch (e) {
                return match;
            }
        });
        
        // Process $$...$$ style (display math)
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            try {
                const rendered = renderMath(math, true);
                if (rendered && rendered !== math) {
                    return rendered;
                }
                return match;
            } catch (e) {
                return match;
            }
        });
        
        return processed;
    } catch (e) {
        console.log('  ⚠️ Rendering error:', e);
        return text;
    }
}

function processBooksFolder() {
    const booksDir = './books';
    let processedCount = 0;
    let filesWithMath = 0;
    
    if (!fs.existsSync(booksDir)) {
        console.log('❌ Books folder not found!');
        return 0;
    }
    
    console.log(`📂 Processing ONLY: ${booksDir}\n`);
    
    function processDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                processDirectory(filePath);
            } else if (file.endsWith('.html')) {
                try {
                    let content = fs.readFileSync(filePath, 'utf-8');
                    let originalContent = content;
                    
                    if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) {
                        filesWithMath++;
                        let modified = false;
                        
                        // Process math in ALL text content
                        // Method 1: Process inside HTML elements
                        const elementPatterns = [
                            /<p[^>]*>([\s\S]*?)<\/p>/g,
                            /<div[^>]*class="[^"]*(?:explanation|definition|q-text|math|diff-tag)[^"]*"[^>]*>([\s\S]*?)<\/div>/g,
                            /<span[^>]*class="[^"]*(?:math|q-text)[^"]*"[^>]*>([\s\S]*?)<\/span>/g,
                            /<li[^>]*>([\s\S]*?)<\/li>/g,
                            /<strong[^>]*>([\s\S]*?)<\/strong>/g,
                            /<em[^>]*>([\s\S]*?)<\/em>/g
                        ];
                        
                        for (const pattern of elementPatterns) {
                            content = content.replace(pattern, function(match, text) {
                                if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                    const rendered = renderMathToHTML(text);
                                    if (rendered !== text) {
                                        modified = true;
                                        return match.replace(text, rendered);
                                    }
                                }
                                return match;
                            });
                        }
                        
                        // Method 2: Process ANY text between tags
                        content = content.replace(/>([^<]*?)</g, function(match, text) {
                            if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                const rendered = renderMathToHTML(text);
                                if (rendered !== text) {
                                    modified = true;
                                    return '>' + rendered + '<';
                                }
                            }
                            return match;
                        });
                        
                        // Method 3: Process option text
                        content = content.replace(/- ([^<]*?)(?=<|$)/g, function(match, text) {
                            if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                const rendered = renderMathToHTML(text);
                                if (rendered !== text) {
                                    modified = true;
                                    return '- ' + rendered;
                                }
                            }
                            return match;
                        });
                        
                        if (modified) {
                            fs.writeFileSync(filePath, content, 'utf-8');
                            processedCount++;
                            const relativePath = path.relative(booksDir, filePath);
                            console.log(`  ✓ Processed: books/${relativePath}`);
                        }
                    }
                } catch (error) {
                    console.error(`  ✗ Error processing: ${filePath}`, error.message);
                }
            }
        }
    }
    
    processDirectory(booksDir);
    console.log(`\n📊 Found ${filesWithMath} files with math content.`);
    return processedCount;
}

// Wait for MathJax to be ready before processing
console.log('⏳ Initializing MathJax...');

// Give MathJax a moment to initialize
setTimeout(() => {
    try {
        const count = processBooksFolder();
        console.log('\n' + '='.repeat(50));
        if (count > 0) {
            console.log(`✅ SUCCESS: ${count} files processed in the books folder.`);
            console.log('📌 ONLY the books folder was modified.');
        } else {
            console.log('ℹ️ No files needed processing in the books folder.');
        }
        console.log('='.repeat(50));
        
        // Don't call quit() - it doesn't exist in this version
        // mjAPI.quit(); // REMOVED - causes error
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}, 1000);
