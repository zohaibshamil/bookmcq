// pre-render-math.js
const fs = require('fs');
const path = require('path');
const katex = require('katex');

// Helper to render math using KaTeX
function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Process inline math: $...$
        let processed = text.replace(/\$(.+?)\$/g, function(match, math) {
            try {
                return katex.renderToString(math, {
                    throwOnError: false,
                    displayMode: false
                });
            } catch (e) {
                return '<span class="math-inline">' + math + '</span>';
            }
        });
        
        // Process display math: $$...$$
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            try {
                return katex.renderToString(math, {
                    throwOnError: false,
                    displayMode: true
                });
            } catch (e) {
                return '<div class="math-display">' + math + '</div>';
            }
        });
        
        // Process \(...\) style
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            try {
                return katex.renderToString(math, {
                    throwOnError: false,
                    displayMode: false
                });
            } catch (e) {
                return '<span class="math-inline">' + math + '</span>';
            }
        });
        
        // Process \[...\] style
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            try {
                return katex.renderToString(math, {
                    throwOnError: false,
                    displayMode: true
                });
            } catch (e) {
                return '<div class="math-display">' + math + '</div>';
            }
        });
        
        return processed;
    } catch (e) {
        console.log('Math rendering error:', e);
        return text;
    }
}

// Process HTML files
function processHTMLFiles(dir) {
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
            console.log('Processing:', filePath);
            
            try {
                let content = fs.readFileSync(filePath, 'utf-8');
                
                // Check if file contains math
                if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) {
                    let modified = false;
                    
                    // Process content in math class elements
                    // Look for content within any element that might contain math
                    content = content.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/g, function(match, openTag, text, closeTag) {
                        if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
                            const rendered = renderMathToHTML(text);
                            if (rendered !== text) {
                                modified = true;
                                return openTag + rendered + closeTag;
                            }
                        }
                        return match;
                    });
                    
                    // Also process div content
                    content = content.replace(/(<div[^>]*>)([\s\S]*?)(<\/div>)/g, function(match, openTag, text, closeTag) {
                        if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
                            const rendered = renderMathToHTML(text);
                            if (rendered !== text) {
                                modified = true;
                                return openTag + rendered + closeTag;
                            }
                        }
                        return match;
                    });
                    
                    // Process span content
                    content = content.replace(/(<span[^>]*>)([\s\S]*?)(<\/span>)/g, function(match, openTag, text, closeTag) {
                        if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
                            const rendered = renderMathToHTML(text);
                            if (rendered !== text) {
                                modified = true;
                                return openTag + rendered + closeTag;
                            }
                        }
                        return match;
                    });
                    
                    if (modified) {
                        fs.writeFileSync(filePath, content, 'utf-8');
                        console.log('  ✓ Updated:', path.basename(filePath));
                    } else {
                        console.log('  - No changes needed:', path.basename(filePath));
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
    console.log('🚀 Starting math pre-rendering with KaTeX...');
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
