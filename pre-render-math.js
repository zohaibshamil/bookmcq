// pre-render-math.js
const fs = require('fs');
const path = require('path');
const katex = require('katex');

console.log('🚀 Starting math pre-rendering...');
console.log('📁 ONLY processing files in the "books" folder...');

function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        let processed = text.replace(/\$(.+?)\$/g, function(match, math) {
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
    
    console.log(`📂 Processing ONLY: ${booksDir}`);
    console.log('📌 All other folders will be ignored.\n');
    
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
                    
                    if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) {
                        let modified = false;
                        
                        const patterns = [
                            /<p[^>]*>([\s\S]*?)<\/p>/g,
                            /<div[^>]*class="[^"]*(?:explanation|definition|q-text|math)[^"]*"[^>]*>([\s\S]*?)<\/div>/g,
                            /<span[^>]*class="[^"]*math[^"]*"[^>]*>([\s\S]*?)<\/span>/g
                        ];
                        
                        for (const pattern of patterns) {
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
    }
    console.log('='.repeat(50));
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
