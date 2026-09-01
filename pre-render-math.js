// pre-render-math.js - MathJax v3.2 for server-side rendering
const fs = require('fs');
const path = require('path');
const { init } = require('mathjax');

console.log('🚀 Starting math pre-rendering with MathJax v3.2...');
console.log('📁 ONLY processing files in the "books" folder...');
console.log('📌 All other folders will be ignored.\n');

// MathJax v3 state
let mathjax = null;

// Initialize MathJax v3 once - FIXED CONFIGURATION
async function initMathJax() {
    if (!mathjax) {
        console.log('⏳ Initializing MathJax v3.2...');
        try {
            mathjax = await init({
                loader: {
                    load: ['input/tex', 'output/svg']
                },
                tex: {
                    inlineMath: [
                        ['\\(', '\\)'],
                        ['$', '$']
                    ],
                    displayMath: [
                        ['\\[', '\\]'],
                        ['$$', '$$']
                    ],
                    processEscapes: true,
                    packages: ['base', 'ams', 'noerrors', 'noundefined']
                },
                svg: {
                    fontCache: 'global'
                }
                // REMOVED: ex, display, skipHtmlTypes, enableMenu, skip, include
                // These options don't exist in MathJax v3
            });
            console.log('✅ MathJax v3.2 initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize MathJax v3.2:', error);
            throw error;
        }
    }
    return mathjax;
}

// Render math using MathJax v3.2
async function renderMath(math, display = false) {
    try {
        const mathjaxInstance = await initMathJax();
        
        // Clean up the math expression
        let cleanedMath = math
            .replace(/<br\s*\/?>/gi, ' ')  // Remove line breaks
            .replace(/\n/g, ' ')            // Remove newlines
            .trim();
        
        // Render with MathJax v3
        const result = await mathjaxInstance.tex2svg(cleanedMath, {
            display: display,
            em: 6,      // em value for font size
            ex: 6,      // ex value for font size  
            containerWidth: 1000
        });
        
        // Get the SVG content
        let svgContent = result.outerHTML || result.innerHTML || '';
        
        // If we got a full HTML document, extract just the SVG
        if (svgContent.includes('<svg')) {
            const svgMatch = svgContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
            if (svgMatch) {
                return svgMatch[0];
            }
        }
        
        // If no SVG found, return empty string
        console.log(`  ⚠️ No SVG output for: ${math.substring(0, 40)}...`);
        return '';
        
    } catch (error) {
        console.log(`  ❌ MathJax v3.2 error for: ${math.substring(0, 40)}...`);
        console.log(`  Error: ${error.message || error}`);
        return null;
    }
}

// Clean up math expression for better rendering
function cleanMathExpression(math) {
    return math
        .replace(/\\,/g, '\\,')  // Preserve spacing
        .replace(/\\:/g, '\\:')  // Preserve spacing
        .replace(/\\;/g, '\\;')  // Preserve spacing
        .replace(/<br\s*\/?>/gi, ' ')  // Remove line breaks
        .replace(/\n/g, ' ')  // Remove newlines
        .trim();
}

// Async function to render math in HTML content
async function renderMathToHTML(text) {
    if (!text) return text;
    
    // Quick check if math is present
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Collect all matches with their positions
        const matches = [];
        let match;
        
        // 1. Process \(...\) style - inline math
        const regex1 = /\\\((.+?)\\\)/gs;
        while ((match = regex1.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: cleanMathExpression(match[1]),
                index: match.index,
                display: false,
                type: 'paren'
            });
        }
        
        // 2. Process $...$ style - inline math (skip $$...$$)
        const regex2 = /\$(.+?)\$/gs;
        while ((match = regex2.exec(text)) !== null) {
            const prevChar = text[match.index - 1] || '';
            const nextChar = text[match.index + match[0].length] || '';
            if (prevChar !== '$' && nextChar !== '$') {
                matches.push({
                    full: match[0],
                    math: cleanMathExpression(match[1]),
                    index: match.index,
                    display: false,
                    type: 'dollar'
                });
            }
        }
        
        // 3. Process \[...\] style - display math
        const regex3 = /\\\[(.+?)\\\]/gs;
        while ((match = regex3.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: cleanMathExpression(match[1]),
                index: match.index,
                display: true,
                type: 'bracket'
            });
        }
        
        // 4. Process $$...$$ style - display math
        const regex4 = /\$\$(.+?)\$\$/gs;
        while ((match = regex4.exec(text)) !== null) {
            matches.push({
                full: match[0],
                math: cleanMathExpression(match[1]),
                index: match.index,
                display: true,
                type: 'dollardollar'
            });
        }
        
        // Sort by index (process in order)
        matches.sort((a, b) => a.index - b.index);
        
        // Remove duplicate matches
        const uniqueMatches = [];
        const seen = new Set();
        for (const item of matches) {
            const key = `${item.math}-${item.display}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMatches.push(item);
            }
        }
        
        // Build result with rendered math
        let result = '';
        let lastIndex = 0;
        let renderedCount = 0;
        let skippedCount = 0;
        
        for (const item of uniqueMatches) {
            result += text.substring(lastIndex, item.index);
            
            try {
                const rendered = await renderMath(item.math, item.display);
                if (rendered && rendered.includes('<svg')) {
                    result += rendered;
                    renderedCount++;
                    console.log(`  ✓ Rendered [${item.type}]: ${item.math.substring(0, 50)}...`);
                } else {
                    console.log(`  ⚠️ Failed to render [${item.type}]: ${item.math.substring(0, 50)}...`);
                    result += item.full; // Keep original if error
                    skippedCount++;
                }
            } catch (e) {
                console.log(`  ⚠️ Error rendering [${item.type}]: ${item.math.substring(0, 30)}...`);
                result += item.full; // Keep original if error
                skippedCount++;
            }
            
            lastIndex = item.index + item.full.length;
        }
        
        result += text.substring(lastIndex);
        
        if (renderedCount > 0 || skippedCount > 0) {
            console.log(`  📊 Rendered: ${renderedCount}, Skipped: ${skippedCount}`);
        }
        
        return result;
        
    } catch (error) {
        console.log('  ❌ Rendering error:', error.message || error);
        return text;
    }
}

// Process all HTML files in the books folder
async function processBooksFolder() {
    const booksDir = './books';
    let processedCount = 0;
    let filesWithMath = 0;
    let totalRendered = 0;
    let totalSkipped = 0;
    
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
                    
                    // Check if math is present
                    const hasMath = content.includes('$') || 
                                   content.includes('\\(') || 
                                   content.includes('\\[');
                    
                    if (hasMath) {
                        filesWithMath++;
                        
                        // Count math expressions before processing
                        const parenCount = (content.match(/\\\([^)]+\\\)/g) || []).length;
                        const bracketCount = (content.match(/\\\[[^\]]+\\\]/g) || []).length;
                        const dollarCount = (content.match(/\$(?!\$)[^$]+\$(?!\$)/g) || []).length;
                        const dollarDollarCount = (content.match(/\$\$[^$]+\$\$/g) || []).length;
                        
                        const totalFound = parenCount + bracketCount + dollarCount + dollarDollarCount;
                        
                        console.log(`📄 Found ${totalFound} math expressions in: ${path.relative(booksDir, filePath)}`);
                        console.log(`   \\(...\\): ${parenCount}, \\[...\\]: ${bracketCount}, $...$: ${dollarCount}, $$...$$: ${dollarDollarCount}`);
                        
                        // Process math in the content
                        const newContent = await renderMathToHTML(content);
                        
                        if (newContent !== content) {
                            // Check if math was actually rendered
                            const svgCount = (newContent.match(/<svg/g) || []).length;
                            const originalSvgCount = (content.match(/<svg/g) || []).length;
                            
                            if (svgCount > originalSvgCount) {
                                fs.writeFileSync(filePath, newContent, 'utf-8');
                                processedCount++;
                                const newlyRendered = svgCount - originalSvgCount;
                                totalRendered += newlyRendered;
                                console.log(`  ✅ Processed: ${path.basename(filePath)} (${newlyRendered} new formulas rendered)`);
                            } else {
                                console.log(`  ⚠️ No new formulas rendered in: ${path.basename(filePath)}`);
                            }
                        } else {
                            console.log(`  ℹ️ No changes made to: ${path.basename(filePath)}`);
                        }
                    }
                } catch (error) {
                    console.error(`  ❌ Error processing: ${filePath}`, error.message || error);
                }
            }
        }
    }
    
    await processDirectory(booksDir);
    
    console.log(`\n📊 Found ${filesWithMath} files with math content.`);
    console.log(`📊 Total formulas rendered: ${totalRendered}`);
    console.log(`📊 Total formulas skipped: ${totalSkipped}`);
    
    return processedCount;
}

// Main execution
async function main() {
    try {
        // Initialize MathJax first
        await initMathJax();
        
        // Process all books
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
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the main function
main();
