// pre-render-math.js
const fs = require('fs-extra');
const path = require('path');
const mjAPI = require('mathjax-node');

// Configure MathJax
mjAPI.config({
    MathJax: {
        svg: {
            fontCache: 'global'
        }
    }
});
mjAPI.start();

// Function to render math to SVG
function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Process inline math: $...$
        let processed = text.replace(/\$(.+?)\$/g, function(match, math) {
            let result = '';
            mjAPI.typeset({
                math: math,
                format: 'TeX',
                svg: true,
                speakText: false,
                ex: 6,
                width: 1000
            }, function(data) {
                result = data.errors ? math : data.svg;
            });
            return '<span class="math-inline">' + result + '</span>';
        });
        
        // Process display math: $$...$$
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            let result = '';
            mjAPI.typeset({
                math: math,
                format: 'TeX',
                svg: true,
                speakText: false,
                ex: 6,
                width: 1000,
                display: true
            }, function(data) {
                result = data.errors ? math : data.svg;
            });
            return '<div class="math-display">' + result + '</div>';
        });
        
        // Process \(...\) style
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            let result = '';
            mjAPI.typeset({
                math: math,
                format: 'TeX',
                svg: true,
                speakText: false,
                ex: 6,
                width: 1000
            }, function(data) {
                result = data.errors ? math : data.svg;
            });
            return '<span class="math-inline">' + result + '</span>';
        });
        
        // Process \[...\] style
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            let result = '';
            mjAPI.typeset({
                math: math,
                format: 'TeX',
                svg: true,
                speakText: false,
                ex: 6,
                width: 1000,
                display: true
            }, function(data) {
                result = data.errors ? math : data.svg;
            });
            return '<div class="math-display">' + result + '</div>';
        });
        
        return processed;
    } catch (e) {
        console.log('Math rendering error:', e);
        return text;
    }
}

// Function to process all HTML files
async function processHTMLFiles(dir) {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
            // Recursively process subdirectories
            await processHTMLFiles(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.htm')) {
            console.log('Processing:', filePath);
            
            // Read file
            let content = await fs.readFile(filePath, 'utf-8');
            
            // Check if file contains math
            if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) {
                // Extract and render math in specific sections
                // This is a simplified version - you may need to adjust based on your structure
                
                // Process all math content
                content = content.replace(/>([^<]*?)</g, function(match, text) {
                    if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
                        return '>' + renderMathToHTML(text) + '<';
                    }
                    return match;
                });
                
                // Write back
                await fs.writeFile(filePath, content, 'utf-8');
                console.log('  ✓ Rendered math in:', filePath);
            }
        }
    }
}

// Main execution
async function main() {
    try {
        console.log('Starting math pre-rendering...');
        await processHTMLFiles('./'); // Process all HTML files in current directory
        console.log('✅ Math pre-rendering complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
