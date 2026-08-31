// pre-render-math.js - MathJax Node for server-side rendering (FIXED)
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

// PROMISE-BASED render function - waits for MathJax to complete
function renderMathPromise(math, display = false) {
    return new Promise((resolve, reject) => {
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
                reject(data.errors);
            } else {
                resolve(data.svg);
            }
        });
    });
}

// Async function to render math to HTML
async function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Process \(...\) style
        let processed = text;
        
        // Find all math expressions and render them
        const matches = [];
        const regex = /\\\((.+?)\\\)/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: match[1],
                index: match.index,
                display: false
            });
        }
        
        // Also find $...$ style
        const regex2 = /\$(.+?)\$/g;
        while ((match = regex2.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: match[1],
                index: match.index,
                display: false
            });
        }
        
        // Find display math: \[...\]
        const regex3 = /\\\[(.+?)\\\]/g;
        while ((match = regex3.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: match[1],
                index: match.index,
                display: true
            });
        }
        
        // Find display math: $$...$$
        const regex4 = /\$\$(.+?)\$\$/g;
        while ((match = regex4.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: match[1],
                index: match.index,
                display: true
            });
        }
        
        // Sort by index (to process in order)
        matches.sort((a, b) => a.index - b.index);
        
        // Render each math expression
        let result = '';
        let lastIndex = 0;
        
        for (const item of matches) {
            // Add text before this match
            result += text.substring(lastIndex, item.index);
            
            try {
                // Render the math
                const rendered = await renderMathPromise(item.math, item.display);
                result += rendered;
            } catch (e) {
                console.log(`  ⚠️ MathJax error for: ${item.math.substring(0, 30)}...`);
                result += item.full; // Keep original if error
            }
            
            lastIndex = item.index + item.full.length;
        }
        
        // Add remaining text
        result += text.substring(lastIndex);
        
        return result;
    } catch (e) {
        console.log('  ⚠️ Rendering error:', e);
        return text;
    }
}

async function processBooksFolder() {
    const booksDir = './books';
    let processedCount = 0;
    let filesWithMath = 0;
    
    if (!fs.existsSync(booksDir)) {
        console.log('❌ Books folder not found!');
        return 0;
    }
    
    console.log(`📂 Processing ONLY: ${booksDir}\n`);
    
    async function processDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                await processDirectory(filePath);
            } else if (file.endsWith('.html')) {
                try {
                    let content = fs.readFileSync(filePath, 'utf-8');
                    
                    if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) {
                        filesWithMath++;
                        let modified = false;
                        let newContent = content;
                        
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
                            newContent = newContent.replace(pattern, async function(match, text) {
                                if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                    const rendered = await renderMathToHTML(text);
                                    if (rendered !== text) {
                                        modified = true;
                                        return match.replace(text, rendered);
                                    }
                                }
                                return match;
                            });
                        }
                        
                        // Method 2: Process ANY text between tags
                        newContent = newContent.replace(/>([^<]*?)</g, async function(match, text) {
                            if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                const rendered = await renderMathToHTML(text);
                                if (rendered !== text) {
                                    modified = true;
                                    return '>' + rendered + '<';
                                }
                            }
                            return match;
                        });
                        
                        if (modified) {
                            fs.writeFileSync(filePath, newContent, 'utf-8');
                            processedCount++;
                            const relativePath = path.relative(booksDir, filePath);
                            console.log(`  ✓ Processed: books/${relativePath}`);
                        } else {
                            // Check if there's still unprocessed math
                            if (newContent.includes('\\(') || newContent.includes('\\[') || newContent.includes('$')) {
                                console.log(`  ⚠️ Math found but not processed in: ${path.basename(filePath)}`);
                                // Try one more time with a different approach
                                let finalContent = newContent;
                                const simpleMatches = newContent.match(/\\\([^\\]+\\\)/g);
                                if (simpleMatches) {
                                    console.log(`    Found ${simpleMatches.length} math expressions in this file`);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`  ✗ Error processing: ${filePath}`, error.message);
                }
            }
        }
    }
    
    await processDirectory(booksDir);
    console.log(`\n📊 Found ${filesWithMath} files with math content.`);
    return processedCount;
}

// Main execution
console.log('⏳ Initializing MathJax...');

// Give MathJax time to initialize
setTimeout(async () => {
    try {
        const count = await processBooksFolder();
        console.log('\n' + '='.repeat(50));
        if (count > 0) {
            console.log(`✅ SUCCESS: ${count} files processed in the books folder.`);
            console.log('📌 ONLY the books folder was modified.');
        } else {
            console.log('ℹ️ No files were modified.');
            console.log('💡 Check that your HTML files contain math delimiters like:');
            console.log('   - \\( ... \\) for inline math');
            console.log('   - \\[ ... \\] for display math');
            console.log('   - $ ... $ for inline math');
            console.log('   - $$ ... $$ for display math');
        }
        console.log('='.repeat(50));
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}, 1000);
