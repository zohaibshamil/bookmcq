// pre-render-math.js - MathJax Node for server-side rendering (FIXED)
const fs = require('fs');
const path = require('path');
const mjAPI = require('mathjax-node');

// Configure MathJax - FIXED configuration
mjAPI.config({
    MathJax: {
        SVG: {
            fontCache: 'global',
            scale: 100,
            minScaleAdjust: 50
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
                // Ensure we have valid SVG
                if (data.svg && data.svg.trim().length > 0) {
                    resolve(data.svg);
                } else {
                    reject(new Error('Empty SVG output'));
                }
            }
        });
    });
}

// Helper function to find math expressions with proper handling of braces
function findMathExpressions(text) {
    const matches = [];
    let index = 0;
    
    // Process \(...\) style - handle nested braces
    let match;
    const regex1 = /\\\(/g;
    while ((match = regex1.exec(text)) !== null) {
        const start = match.index + 2;
        let braceCount = 0;
        let end = start;
        let found = false;
        
        for (let i = start; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') braceCount--;
            else if (text[i] === '\\' && text[i+1] === ')') {
                if (braceCount === 0) {
                    end = i;
                    found = true;
                    break;
                }
            }
        }
        
        if (found) {
            const math = text.substring(start, end);
            matches.push({
                full: text.substring(match.index, end + 2),
                math: math,
                index: match.index,
                display: false
            });
        }
    }
    
    // Process \[...\] style
    const regex2 = /\\\[/g;
    while ((match = regex2.exec(text)) !== null) {
        const start = match.index + 2;
        let braceCount = 0;
        let end = start;
        let found = false;
        
        for (let i = start; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') braceCount--;
            else if (text[i] === '\\' && text[i+1] === ']') {
                if (braceCount === 0) {
                    end = i;
                    found = true;
                    break;
                }
            }
        }
        
        if (found) {
            const math = text.substring(start, end);
            matches.push({
                full: text.substring(match.index, end + 2),
                math: math,
                index: match.index,
                display: true
            });
        }
    }
    
    // Process $...$ style (inline)
    const regex3 = /\$(?!\$)/g;
    while ((match = regex3.exec(text)) !== null) {
        const start = match.index + 1;
        let braceCount = 0;
        let end = start;
        let found = false;
        
        for (let i = start; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') braceCount--;
            else if (text[i] === '$') {
                if (braceCount === 0 && text[i-1] !== '\\') {
                    end = i;
                    found = true;
                    break;
                }
            }
        }
        
        if (found && end > start) {
            const math = text.substring(start, end);
            // Skip if it looks like a display math $$...$$
            if (!math.includes('$')) {
                matches.push({
                    full: text.substring(match.index, end + 1),
                    math: math,
                    index: match.index,
                    display: false
                });
            }
        }
    }
    
    // Process $$...$$ style (display)
    const regex4 = /\$\$/g;
    while ((match = regex4.exec(text)) !== null) {
        const start = match.index + 2;
        let braceCount = 0;
        let end = start;
        let found = false;
        
        for (let i = start; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') braceCount--;
            else if (text[i] === '$' && text[i+1] === '$') {
                if (braceCount === 0 && text[i-1] !== '\\') {
                    end = i;
                    found = true;
                    break;
                }
            }
        }
        
        if (found && end > start) {
            const math = text.substring(start, end);
            matches.push({
                full: text.substring(match.index, end + 2),
                math: math,
                index: match.index,
                display: true
            });
        }
    }
    
    // Sort by index
    matches.sort((a, b) => a.index - b.index);
    
    // Remove overlapping matches
    const uniqueMatches = [];
    let lastEnd = -1;
    for (const m of matches) {
        const end = m.index + m.full.length;
        if (m.index >= lastEnd) {
            uniqueMatches.push(m);
            lastEnd = end;
        }
    }
    
    return uniqueMatches;
}

// Async function to render math to HTML
async function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Find all math expressions
        const matches = findMathExpressions(text);
        
        if (matches.length === 0) {
            return text;
        }
        
        console.log(`  Found ${matches.length} math expressions to render`);
        
        // Render each math expression
        let result = '';
        let lastIndex = 0;
        let successCount = 0;
        
        for (const item of matches) {
            // Add text before this match
            result += text.substring(lastIndex, item.index);
            
            try {
                // Render the math with retry
                let rendered = null;
                let attempts = 0;
                while (attempts < 2 && !rendered) {
                    try {
                        rendered = await renderMathPromise(item.math, item.display);
                    } catch (e) {
                        attempts++;
                        if (attempts === 2) throw e;
                    }
                }
                
                if (rendered) {
                    result += rendered;
                    successCount++;
                } else {
                    result += item.full;
                }
            } catch (e) {
                console.log(`  ⚠️ MathJax error for: ${item.math.substring(0, 50)}...`);
                console.log(`  Error: ${e.message || e}`);
                result += item.full; // Keep original if error
            }
            
            lastIndex = item.index + item.full.length;
        }
        
        // Add remaining text
        result += text.substring(lastIndex);
        
        if (successCount > 0) {
            console.log(`  ✓ Rendered ${successCount}/${matches.length} formulas`);
        }
        
        return result;
    } catch (e) {
        console.log('  ⚠️ Rendering error:', e.message || e);
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
                        console.log(`\n📄 Processing: ${path.relative(booksDir, filePath)}`);
                        
                        // Process math in the content
                        let newContent = await renderMathToHTML(content);
                        
                        // Check if content changed
                        if (newContent !== content) {
                            // Check if math was actually rendered (contains SVG)
                            const svgCount = (newContent.match(/<svg/g) || []).length;
                            const oldSvgCount = (content.match(/<svg/g) || []).length;
                            
                            if (svgCount > oldSvgCount) {
                                fs.writeFileSync(filePath, newContent, 'utf-8');
                                processedCount++;
                                const relativePath = path.relative(booksDir, filePath);
                                console.log(`  ✅ Updated: books/${relativePath} (${svgCount - oldSvgCount} new SVG renders)`);
                            } else {
                                console.log(`  ⚠️ No new SVG renders in: ${path.basename(filePath)}`);
                            }
                        } else {
                            console.log(`  ℹ️ No changes needed for: ${path.basename(filePath)}`);
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
