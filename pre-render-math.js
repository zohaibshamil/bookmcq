// pre-render-math.js - MathJax Node for server-side rendering (OPTIMIZED)
const fs = require('fs');
const path = require('path');
const mjAPI = require('mathjax-node');
const { optimize } = require('svgo');

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

// SVG Optimization function
function optimizeSVG(svgString) {
    try {
        const result = optimize(svgString, {
            plugins: [
                'removeDoctype',
                'removeXMLProcInst',
                'removeComments',
                'removeMetadata',
                'removeEditorsNSData',
                'cleanupAttrs',
                'inlineStyles',
                'minifyStyles',
                'convertStyleToAttrs',
                'cleanupIDs',
                'removeRasterImages',
                'removeUselessDefs',
                'cleanupNumericValues',
                'cleanupListOfValues',
                'convertColors',
                'removeUnknownsAndDefaults',
                'removeNonInheritableGroupAttrs',
                'removeUselessStrokeAndFill',
                'removeViewBox',
                'cleanupEnableBackground',
                'removeHiddenElems',
                'removeEmptyText',
                'convertShapeToPath',
                'moveElemsAttrsToGroup',
                'moveGroupAttrsToElems',
                'collapseGroups',
                'convertPathData',
                'convertTransform',
                'removeEmptyAttrs',
                'removeEmptyContainers',
                'mergePaths',
                'removeUnusedNS',
                'sortDefsChildren'
            ]
        });
        return result.data;
    } catch (e) {
        console.log('  ⚠️ SVG optimization error:', e.message);
        return svgString; // Return original if optimization fails
    }
}

// PROMISE-BASED render function with accessibility and optimization
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
                let svg = data.svg;
                
                // Step 1: Add aria-label for accessibility
                const cleanMath = math.replace(/\s+/g, ' ').trim();
                const shortMath = cleanMath.length > 100 ? cleanMath.substring(0, 100) + '...' : cleanMath;
                svg = svg.replace(
                    '<svg', 
                    `<svg aria-label="Math: ${shortMath}" role="img"`
                );
                
                // Step 2: Optimize SVG
                svg = optimizeSVG(svg);
                
                resolve(svg);
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
        // Find all math expressions
        const matches = [];
        
        // Process \(...\) style
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
        
        // Process $...$ style (but not $$...$$)
        const regex2 = /\$(.+?)\$/g;
        while ((match = regex2.exec(text)) !== null) {
            // Check if it's not $$...$$
            if (text[match.index - 1] !== '$' && text[match.index + match[0].length] !== '$') {
                matches.push({
                    full: match[0],
                    math: match[1],
                    index: match.index,
                    display: false
                });
            }
        }
        
        // Process \[...\] style
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
        
        // Sort by index
        matches.sort((a, b) => a.index - b.index);
        
        // Render each math expression
        let result = '';
        let lastIndex = 0;
        let renderedCount = 0;
        
        for (const item of matches) {
            result += text.substring(lastIndex, item.index);
            
            try {
                const rendered = await renderMathPromise(item.math, item.display);
                result += rendered;
                renderedCount++;
            } catch (e) {
                console.log(`  ⚠️ MathJax error: ${item.math.substring(0, 30)}...`);
                result += item.full;
            }
            
            lastIndex = item.index + item.full.length;
        }
        
        result += text.substring(lastIndex);
        
        if (renderedCount > 0) {
            // console.log(`  ✓ Rendered ${renderedCount} formulas`);
        }
        
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
    let totalFormulas = 0;
    
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
                        
                        // Process ALL math in the content
                        let newContent = await renderMathToHTML(content);
                        
                        if (newContent !== content) {
                            // Check if math was actually rendered
                            const svgCount = (newContent.match(/<svg/g) || []).length;
                            const originalSvgCount = (content.match(/<svg/g) || []).length;
                            
                            if (svgCount > 0) {
                                fs.writeFileSync(filePath, newContent, 'utf-8');
                                processedCount++;
                                totalFormulas += svgCount;
                                const relativePath = path.relative(booksDir, filePath);
                                console.log(`  ✓ Processed: ${relativePath} (${svgCount} formulas, ${originalSvgCount > 0 ? 're-optimized' : 'new'})`);
                            } else {
                                console.log(`  ⚠️ No SVG rendered in: ${path.basename(filePath)}`);
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
    console.log(`📊 Rendered ${totalFormulas} formulas total.`);
    return processedCount;
}

// Main execution
console.log('⏳ Initializing MathJax...');

setTimeout(async () => {
    try {
        const count = await processBooksFolder();
        console.log('\n' + '='.repeat(50));
        if (count > 0) {
            console.log(`✅ SUCCESS: ${count} files processed with optimized SVGs!`);
            console.log('📌 Added aria-label for accessibility and optimized SVG size.');
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
