// pre-render-math.js - KaTeX for proper math rendering
const fs = require('fs');
const path = require('path');
const katex = require('katex');

console.log('🚀 Starting math pre-rendering with KaTeX...');
console.log('📁 ONLY processing files in the "books" folder...');
console.log('📌 All other folders will be ignored.\n');

function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Process \(...\) style - THIS IS WHAT'S IN YOUR CONTENT
        let processed = text.replace(/\\\((.+?)\\\)/g, function(match, math) {
            try {
                return katex.renderToString(math.trim(), {
                    throwOnError: false,
                    displayMode: false,
                    trust: true
                });
            } catch (e) {
                console.log('  ⚠️ KaTeX error on:', math.substring(0, 50) + '...');
                return match;
            }
        });
        
        // Process inline math: $...$
        processed = processed.replace(/\$(.+?)\$/g, function(match, math) {
            try {
                return katex.renderToString(math.trim(), {
                    throwOnError: false,
                    displayMode: false,
                    trust: true
                });
            } catch (e) {
                return match;
            }
        });
        
        // Process display math: $$...$$
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            try {
                return katex.renderToString(math.trim(), {
                    throwOnError: false,
                    displayMode: true,
                    trust: true
                });
            } catch (e) {
                return match;
            }
        });
        
        // Process \[...\] style
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            try {
                return katex.renderToString(math.trim(), {
                    throwOnError: false,
                    displayMode: true,
                    trust: true
                });
            } catch (e) {
                return match;
            }
        });
        
        return processed;
    } catch (e) {
        return text;
    }
}

function processBooksFolder() {
    const booksDir = './books';
    let processedCount = 0;
    
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
                    
                    // Check if file contains math delimiters
                    if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) {
                        let modified = false;
                        
                        // Process ALL text content, not just specific elements
                        // First, process math in paragraphs
                        content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, function(match, text) {
                            if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                const rendered = renderMathToHTML(text);
                                if (rendered !== text) {
                                    modified = true;
                                    return match.replace(text, rendered);
                                }
                            }
                            return match;
                        });
                        
                        // Process math in divs with specific classes
                        const classPatterns = ['explanation', 'definition', 'q-text', 'math', 'diff-tag'];
                        for (const className of classPatterns) {
                            content = content.replace(new RegExp('<div[^>]*class="[^"]*' + className + '[^"]*"[^>]*>([\\s\\S]*?)<\\/div>', 'g'), function(match, text) {
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
                        
                        // Process math in spans
                        content = content.replace(/<span[^>]*>([\s\S]*?)<\/span>/g, function(match, text) {
                            if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                const rendered = renderMathToHTML(text);
                                if (rendered !== text) {
                                    modified = true;
                                    return match.replace(text, rendered);
                                }
                            }
                            return match;
                        });
                        
                        // Process any remaining text that might contain math
                        // This handles text that's not inside specific tags
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
                        
                        if (modified) {
                            fs.writeFileSync(filePath, content, 'utf-8');
                            processedCount++;
                            const relativePath = path.relative(booksDir, filePath);
                            console.log(`  ✓ Processed: books/${relativePath}`);
                        } else {
                            // Check if there's math that wasn't processed
                            if (content.includes('\\(') || content.includes('\\[')) {
                                console.log(`  ⚠️ Found math in ${path.basename(filePath)} but couldn't process.`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`  ✗ Error processing: ${filePath}`, error.message);
                }
            }
        }
    }
    
    processDirectory(booksDir);
    return processedCount;
}

try {
    const count = processBooksFolder();
    console.log('\n' + '='.repeat(50));
    if (count > 0) {
        console.log(`✅ SUCCESS: ${count} files processed in the books folder.`);
        console.log('📌 ONLY the books folder was modified.');
    } else {
        console.log('ℹ️ No files needed processing in the books folder.');
        console.log('💡 Tip: Make sure your HTML files contain math delimiters like $...$ or \\(...\\)');
    }
    console.log('='.repeat(50));
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
