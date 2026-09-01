// pre-render-math.js
const fs = require('fs');
const path = require('path');
const katex = require('katex');

// ===== HELPER FUNCTIONS =====

// Check if content already has rendered math
function hasRenderedMath(text) {
    return text.includes('class="katex"') || 
           text.includes('class="katex-mathml"') ||
           text.includes('katex-html') ||
           text.includes('data-katex') ||
           /class="[^"]*katex[^"]*"/.test(text);
}

// Check if text contains raw math delimiters
function hasRawMath(text) {
    if (hasRenderedMath(text)) return false;
    return text.includes('$') || 
           text.includes('\\(') || 
           text.includes('\\[') ||
           /\\begin\{.*?\}/.test(text);
}

// Decode HTML entities for KaTeX processing
function decodeHtmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// ===== CRITICAL NEW FUNCTION: Clean KaTeX output =====
function cleanKatexOutput(html) {
    // Remove annotation tags containing raw LaTeX
    html = html.replace(/<annotation[^>]*>.*?<\/annotation>/g, '');
    
    // Remove MathML if not needed (optional - keeps only HTML rendering)
    // html = html.replace(/<math[^>]*>.*?<\/math>/g, '');
    
    // Remove extra whitespace
    html = html.replace(/\s+/g, ' ').trim();
    
    return html;
}

// Render math using KaTeX with clean output
function renderMathToHTML(text, displayMode = false) {
    if (!text) return text;
    
    // Skip if already rendered
    if (hasRenderedMath(text)) {
        // Clean any remaining annotation tags
        return cleanKatexOutput(text);
    }
    
    // Decode HTML entities
    let decodedText = decodeHtmlEntities(text);
    
    // Check if contains raw math
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
                    macros: {
                        "\\R": "\\mathbb{R}",
                        "\\N": "\\mathbb{N}",
                        "\\Z": "\\mathbb{Z}",
                        "\\Q": "\\mathbb{Q}",
                        "\\C": "\\mathbb{C}"
                    }
                });
                // Clean the rendered output
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

// Process HTML file
function processHTMLFile(filePath) {
    console.log('  Processing:', path.basename(filePath));
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // Check if file has any math to process
        if (!hasRawMath(content) && !content.includes('class="katex"')) {
            console.log('    ℹ️ No math found - skipping');
            return false;
        }
        
        // ===== PROCESSING =====
        
        // Process within <p> tags
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
        
        // Process within <div> tags
        content = content.replace(/(<div[^>]*>)([\s\S]*?)(<\/div>)/g, function(match, openTag, text, closeTag) {
            if (text.includes('class="math') || text.includes('class="katex"')) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
                return match;
            }
            if (hasRawMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process within <span> tags
        content = content.replace(/(<span[^>]*>)([\s\S]*?)(<\/span>)/g, function(match, openTag, text, closeTag) {
            if (text.includes('class="katex"')) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
                return match;
            }
            if (hasRawMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process within <h1>-<h6> tags
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
        
        // Process within <li> tags
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
        
        // Process text nodes outside of tags
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
        
        // FINAL CLEANUP: Remove any remaining annotation tags
        if (modified || content.includes('<annotation')) {
            let cleaned = content;
            cleaned = cleaned.replace(/<annotation[^>]*>.*?<\/annotation>/g, '');
            // Also clean up any empty katex-mathml that might remain
            cleaned = cleaned.replace(/<span class="katex-mathml"><\/span>/g, '');
            
            if (cleaned !== content) {
                content = cleaned;
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log('    ✅ Updated');
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
                
                // Skip if no math at all
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
    console.log('🚀 Starting math pre-rendering with KaTeX (Catax)');
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
        console.log(`💡 Rendering engine: KaTeX v${katex.version} (Catax)`);
        console.log('='.repeat(50));
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
main();
