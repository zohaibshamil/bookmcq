// pre-render-math.js - COMPLETE CLEAN VERSION
const fs = require('fs');
const path = require('path');
const katex = require('katex');

// ===== HELPER FUNCTIONS =====

function hasRenderedMath(text) {
    return text.includes('class="katex"') || 
           text.includes('katex-html') ||
           /class="[^"]*katex[^"]*"/.test(text);
}

function hasRawMath(text) {
    if (hasRenderedMath(text)) return false;
    return text.includes('$') || 
           text.includes('\\(') || 
           text.includes('\\[') ||
           /\\begin\{.*?\}/.test(text);
}

function decodeHtmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// ===== CRITICAL: COMPLETE CLEANUP =====
function cleanKatexOutput(html) {
    // Remove ALL annotation tags with raw LaTeX
    html = html.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '');
    
    // Remove ALL math tags (MathML)
    html = html.replace(/<math[^>]*>[\s\S]*?<\/math>/g, '');
    
    // Remove empty katex-mathml spans
    html = html.replace(/<span class="katex-mathml"><\/span>/g, '');
    
    // Remove any remaining text that looks like LaTeX
    html = html.replace(/encoding="application\/x-tex"/g, '');
    
    // Clean up extra whitespace
    html = html.replace(/\s+/g, ' ').trim();
    
    return html;
}

// Render math with complete cleanup
function renderMathToHTML(text, displayMode = false) {
    if (!text) return text;
    
    // If already rendered, just clean it
    if (hasRenderedMath(text)) {
        return cleanKatexOutput(text);
    }
    
    let decodedText = decodeHtmlEntities(text);
    
    if (!hasRawMath(decodedText)) return text;
    
    try {
        let processed = decodedText;
        
        // Process display math: $$...$$
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, {
                    throwOnError: false,
                    displayMode: true,
                    trust: true,
                    output: 'html', // Force HTML output (not MathML)
                    macros: {
                        "\\R": "\\mathbb{R}",
                        "\\N": "\\mathbb{N}",
                        "\\Z": "\\mathbb{Z}",
                        "\\Q": "\\mathbb{Q}",
                        "\\C": "\\mathbb{C}"
                    }
                });
                // COMPLETE CLEANUP - remove all traces of original LaTeX
                return cleanKatexOutput(rendered);
            } catch (e) {
                return match;
            }
        });
        
        // Process inline math: $...$
        processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, {
                    throwOnError: false,
                    displayMode: false,
                    trust: true,
                    output: 'html',
                    macros: {
                        "\\R": "\\mathbb{R}",
                        "\\N": "\\mathbb{N}",
                        "\\Z": "\\mathbb{Z}",
                        "\\Q": "\\mathbb{Q}",
                        "\\C": "\\mathbb{C}"
                    }
                });
                return cleanKatexOutput(rendered);
            } catch (e) {
                return match;
            }
        });
        
        // Process \(...\)
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, {
                    throwOnError: false,
                    displayMode: false,
                    trust: true,
                    output: 'html',
                    macros: {
                        "\\R": "\\mathbb{R}",
                        "\\N": "\\mathbb{N}",
                        "\\Z": "\\mathbb{Z}",
                        "\\Q": "\\mathbb{Q}",
                        "\\C": "\\mathbb{C}"
                    }
                });
                return cleanKatexOutput(rendered);
            } catch (e) {
                return match;
            }
        });
        
        // Process \[...\]
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, {
                    throwOnError: false,
                    displayMode: true,
                    trust: true,
                    output: 'html',
                    macros: {
                        "\\R": "\\mathbb{R}",
                        "\\N": "\\mathbb{N}",
                        "\\Z": "\\mathbb{Z}",
                        "\\Q": "\\mathbb{Q}",
                        "\\C": "\\mathbb{C}"
                    }
                });
                return cleanKatexOutput(rendered);
            } catch (e) {
                return match;
            }
        });
        
        return processed;
    } catch (e) {
        return text;
    }
}

// ===== FILE PROCESSING =====

function processHTMLFile(filePath) {
    console.log('  Processing:', path.basename(filePath));
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // Check if file has any math
        if (!hasRawMath(content) && !content.includes('class="katex"')) {
            console.log('    ℹ️ No math found - skipping');
            return false;
        }
        
        // ===== PROCESS ALL TAGS =====
        
        // Process <p> tags
        content = content.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/g, function(match, openTag, text, closeTag) {
            if (hasRawMath(text) || text.includes('class="katex"')) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process <div> tags
        content = content.replace(/(<div[^>]*>)([\s\S]*?)(<\/div>)/g, function(match, openTag, text, closeTag) {
            if (hasRawMath(text) || text.includes('class="katex"')) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process <span> tags
        content = content.replace(/(<span[^>]*>)([\s\S]*?)(<\/span>)/g, function(match, openTag, text, closeTag) {
            if (hasRawMath(text) || text.includes('class="katex"')) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process <h1>-<h6> tags
        content = content.replace(/(<h[1-6][^>]*>)([\s\S]*?)(<\/h[1-6]>)/g, function(match, openTag, text, closeTag) {
            if (hasRawMath(text) || text.includes('class="katex"')) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process <li> tags
        content = content.replace(/(<li[^>]*>)([\s\S]*?)(<\/li>)/g, function(match, openTag, text, closeTag) {
            if (hasRawMath(text) || text.includes('class="katex"')) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process text nodes
        const textNodesRegex = /([^<>\n]*)(?=<|$)/g;
        content = content.replace(textNodesRegex, function(match) {
            if (!match || match.trim() === '') return match;
            if (match.includes('class="katex"')) {
                const rendered = renderMathToHTML(match);
                if (rendered !== match) {
                    modified = true;
                    return rendered;
                }
                return match;
            }
            if (!hasRawMath(match)) return match;
            const rendered = renderMathToHTML(match);
            if (rendered !== match) {
                modified = true;
                return rendered;
            }
            return match;
        });
        
        // FINAL CLEANUP PASS
        if (modified || content.includes('<annotation') || content.includes('<math')) {
            // Remove ALL annotation tags
            content = content.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '');
            
            // Remove ALL math tags
            content = content.replace(/<math[^>]*>[\s\S]*?<\/math>/g, '');
            
            // Remove empty spans
            content = content.replace(/<span class="katex-mathml"><\/span>/g, '');
            
            // Remove any stray LaTeX text
            content = content.replace(/encoding="application\/x-tex"/g, '');
            
            // Clean up multiple spaces
            content = content.replace(/\s{2,}/g, ' ');
            
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log('    ✅ Updated (cleaned)');
            return true;
        } else {
            console.log('    ℹ️ No changes made');
            return false;
        }
    } catch (error) {
        console.error('    ❌ Error:', error.message);
        return false;
    }
}

// Recursively process all HTML files
function processHTMLFiles(dir) {
    console.log(`📁 Scanning: ${dir}`);
    
    const entries = fs.readdirSync(dir);
    let processedCount = 0;
    let modifiedCount = 0;
    let skippedCount = 0;
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!['node_modules', '.git', '.github'].includes(entry)) {
                const result = processHTMLFiles(fullPath);
                processedCount += result.processed;
                modifiedCount += result.modified;
                skippedCount += result.skipped || 0;
            }
        } else if (entry.endsWith('.html') || entry.endsWith('.htm')) {
            processedCount++;
            
            try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                if (!hasRawMath(content) && !content.includes('class="katex"')) {
                    console.log(`  ℹ️ Skipping ${entry} (no math)`);
                    skippedCount++;
                    continue;
                }
            } catch (e) {
                console.error(`  ❌ Error reading ${entry}:`, e.message);
                continue;
            }
            
            const modified = processHTMLFile(fullPath);
            if (modified) modifiedCount++;
        }
    }
    
    return { processed: processedCount, modified: modifiedCount, skipped: skippedCount };
}

// ===== MAIN =====

function main() {
    console.log('🚀 Starting math pre-rendering with KaTeX');
    console.log(`📦 KaTeX version: ${katex.version}`);
    console.log('📁 Processing all HTML files...\n');
    
    try {
        const result = processHTMLFiles('./');
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Math pre-rendering complete!');
        console.log('='.repeat(50));
        console.log(`📊 Total files processed: ${result.processed}`);
        console.log(`📝 Files modified: ${result.modified}`);
        console.log(`⏭️ Files skipped: ${result.skipped}`);
        console.log('='.repeat(50));
        console.log('✨ All math is now fully static HTML/CSS');
        console.log('📝 No JavaScript or LaTeX remains in the HTML');
        console.log('='.repeat(50));
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();
