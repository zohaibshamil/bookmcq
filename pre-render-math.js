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
        // Process math expressions sequentially
        let processed = text;
        
        // Find all math expressions and render them
        const matches = [];
        
        // Process \(...\) style - FIXED: proper escaping
        const regex1 = /\\\((.+?)\\\)/g;
        let match;
        while ((match = regex1.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: match[1],
                index: match.index,
                display: false
            });
        }
        
        // Process $...$ style
        const regex2 = /\$(.+?)\$/g;
        while ((match = regex2.exec(text)) !== null) {
            // Skip if it's $$...$$ (display math)
            if (text[match.index - 1] !== '$' && text[match.index + match[0].length] !== '$') {
                matches.push({
                    full: match[0],
                    math: match[1],
                    index: match.index,
                    display: false
                });
            }
        }
        
        // Process \[...\] style - FIXED: proper escaping
        const regex3 = /\\\[(.+?)\\\]/g;
        while ((match = regex3.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: match[1],
                index: match.index,
                display: true
            });
        }
        
        // Process $$...$$ style
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
                console.log(`  Error: ${e}`);
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
                        console.log(`📄 Found math in: ${path.relative(booksDir, filePath)}`);
                        
                        // Process ALL math in the content at once
                        // We need to process the entire content, not piece by piece
                        let newContent = await renderMathToHTML(content);
                        
                        if (newContent !== content) {
                            // Check if math was actually rendered
                            if (newContent.includes('<svg')) {
                                fs.writeFileSync(filePath, newContent, 'utf-8');
                                processedCount++;
                                const relativePath = path.relative(booksDir, filePath);
                                console.log(`  ✓ Processed: books/${relativePath} (${newContent.match(/<svg/g)?.length || 0} formulas rendered)`);
                            } else {
                                console.log(`  ⚠️ Math found but not rendered in: ${path.basename(filePath)}`);
                                // Check what math patterns are present
                                const mathMatches = newContent.match(/\\\([^\\]+\\\)|\\\[[^\\]+\\\]|\$\$[^$]+\$\$|\$[^$]+\$/g);
                                if (mathMatches) {
                                    console.log(`    Found ${mathMatches.length} math expressions in this file`);
                                    console.log(`    First few: ${mathMatches.slice(0, 3).join(', ')}`);
                                }
                            }
                        } else {
                            console.log(`  ⚠️ No changes made to: ${path.basename(filePath)}`);
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
