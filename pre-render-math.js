// pre-render-math.js
const fs = require('fs');
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

// Helper to render math synchronously
function renderMath(math, display = false) {
    let result = math;
    mjAPI.typeset({
        math: math,
        format: 'TeX',
        svg: true,
        speakText: false,
        ex: 6,
        width: 1000,
        display: display
    }, function(data) {
        if (!data.errors) {
            result = data.svg;
        } else {
            console.log('MathJax error for:', math, data.errors);
        }
    });
    return result;
}

function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Process inline math: $...$
        let processed = text.replace(/\$(.+?)\$/g, function(match, math) {
            return '<span class="math-inline">' + renderMath(math, false) + '</span>';
        });
        
        // Process display math: $$...$$
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            return '<div class="math-display">' + renderMath(math, true) + '</div>';
        });
        
        // Process \(...\) style
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            return '<span class="math-inline">' + renderMath(math, false) + '</span>';
        });
        
        // Process \[...\] style
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            return '<div class="math-display">' + renderMath(math, true) + '</div>';
        });
        
        return processed;
    } catch (e) {
        console.log('Math rendering error:', e);
        return text;
    }
}

// Process HTML files
async function processHTMLFiles(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and .git
            if (file !== 'node_modules' && file !== '.git' && file !== '.github') {
                processHTMLFiles(filePath);
            }
        } else if (file.endsWith('.html') || file.endsWith('.htm')) {
            // Skip files that are already rendered
            if (file.includes('-rendered')) continue;
            
            console.log('Processing:', filePath);
            
            try {
                let content = fs.readFileSync(filePath, 'utf-8');
                
                // Check if file contains math
                if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) {
                    // Process content in specific sections
                    // Look for content within math class elements
                    
                    // Find all .math content
                    content = content.replace(/<p[^>]*class="[^"]*math[^"]*"[^>]*>([\s\S]*?)<\/p>/g, function(match, text) {
                        if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
                            return match.replace(text, renderMathToHTML(text));
                        }
                        return match;
                    });
                    
                    // Find all .q-text content
                    content = content.replace(/<p[^>]*class="[^"]*q-text[^"]*"[^>]*>([\s\S]*?)<\/p>/g, function(match, text) {
                        if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
                            return match.replace(text, renderMathToHTML(text));
                        }
                        return match;
                    });
                    
                    // Find all .explanation content
                    content = content.replace(/<div[^>]*class="[^"]*explanation[^"]*"[^>]*>([\s\S]*?)<\/div>/g, function(match, text) {
                        if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
                            return match.replace(text, renderMathToHTML(text));
                        }
                        return match;
                    });
                    
                    // Write back only if changed
                    if (content.includes('math-inline') || content.includes('math-display')) {
                        const outputPath = filePath.replace('.html', '-rendered.html');
                        fs.writeFileSync(outputPath, content, 'utf-8');
                        console.log('  ✓ Rendered math saved to:', path.basename(outputPath));
                        
                        // Optionally replace original
                        fs.writeFileSync(filePath, content, 'utf-8');
                        console.log('  ✓ Updated original file:', path.basename(filePath));
                    }
                }
            } catch (error) {
                console.error('Error processing:', filePath, error);
            }
        }
    }
}

// Main function
function main() {
    console.log('🚀 Starting math pre-rendering...');
    console.log('📁 Processing all HTML files...');
    
    try {
        processHTMLFiles('./');
        console.log('✅ Math pre-rendering complete!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
