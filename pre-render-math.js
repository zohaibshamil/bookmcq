// pre-render-math.js
const fs = require('fs');
const path = require('path');
const katex = require('katex');

// ===== HELPER FUNCTIONS =====

// Check if content already has rendered math (MORE THOROUGH)
function hasRenderedMath(text) {
    // Check for multiple KaTeX indicators
    return text.includes('class="katex"') || 
           text.includes('class="katex-mathml"') ||
           text.includes('katex-html') ||
           text.includes('katex-error') ||
           text.includes('data-katex') ||
           text.includes('application/x-tex') ||  // CRITICAL: catches rendered math
           text.includes('<math xmlns="http://www.w3.org/1998/Math/MathML"') ||
           // Check if it has KaTeX CSS classes
           /class="[^"]*katex[^"]*"/.test(text);
}

// Check if text contains raw math delimiters (NOT rendered)
function hasRawMath(text) {
    // Check for raw math delimiters that haven't been rendered
    // Make sure they're not inside KaTeX annotations
    if (hasRenderedMath(text)) return false;
    
    // Check for math delimiters
    return text.includes('$') || 
           text.includes('\\(') || 
           text.includes('\\[') ||
           /\\begin\{.*?\}/.test(text);
}

// Check if text is inside a KaTeX annotation (skip it)
function isInKatexAnnotation(text, match) {
    // If the match is inside a KaTeX annotation, skip it
    return text.includes('<annotation') && text.includes('</annotation>');
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

// Render math using KaTeX
function renderMathToHTML(text) {
    if (!text) return text;
    
    // Skip if already rendered
    if (hasRenderedMath(text)) {
        return text;
    }
    
    // Decode HTML entities
    let decodedText = decodeHtmlEntities(text);
    
    // Check if contains raw math
    if (!hasRawMath(decodedText)) return text;
    
    try {
        let processed = decodedText;
        
        // Process display math: $$...$$
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            // Skip if this match is inside KaTeX annotation
            if (isInKatexAnnotation(decodedText, match)) return match;
            
            try {
                const cleanMath = math.trim();
                return katex.renderToString(cleanMath, {
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
            } catch (e) {
                return match;
            }
        });
        
        // Process inline math: $...$
        processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function(match, math) {
            // Skip if this match is inside KaTeX annotation
            if (isInKatexAnnotation(decodedText, match)) return match;
            
            try {
                const cleanMath = math.trim();
                return katex.renderToString(cleanMath, {
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
            } catch (e) {
                return match;
            }
        });
        
        // Process \(...\)
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            if (isInKatexAnnotation(decodedText, match)) return match;
            
            try {
                const cleanMath = math.trim();
                return katex.renderToString(cleanMath, {
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
            } catch (e) {
                return match;
            }
        });
        
        // Process \[...\]
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            if (isInKatexAnnotation(decodedText, match)) return match;
            
            try {
                const cleanMath = math.trim();
                return katex.renderToString(cleanMath, {
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

// Process HTML file with enhanced detection
function processHTMLFile(filePath) {
    console.log('  Processing:', path.basename(filePath));
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // ===== ENHANCED SKIP LOGIC =====
        
        // 1. Check if the entire file already has rendered math
        if (hasRenderedMath(content)) {
            console.log('    ⏭️ Already rendered - skipping file');
            return false;
        }
        
        // 2. Check if file has NO raw math at all
        if (!hasRawMath(content)) {
            console.log('    ℹ️ No raw math found - skipping');
            return false;
        }
        
        // ===== PROCESSING =====
        
        // Process within <p> tags
        content = content.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/g, function(match, openTag, text, closeTag) {
            if (hasRawMath(text) && !hasRenderedMath(text)) {
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
            if (text.includes('class="math') || hasRenderedMath(text)) return match;
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
            if (hasRenderedMath(text)) return match;
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
            if (hasRawMath(text) && !hasRenderedMath(text)) {
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
            if (hasRawMath(text) && !hasRenderedMath(text)) {
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
            if (hasRenderedMath(match)) return match;
            if (!hasRawMath(match)) return match;
            
            // Skip if this text is inside a KaTeX annotation
            if (match.includes('<annotation') || match.includes('</annotation>')) return match;
            
            const rendered = renderMathToHTML(match);
            if (rendered !== match) {
                modified = true;
                return rendered;
            }
            return match;
        });
        
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
            
            // Quick file check before processing
            try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                
                // Skip if already fully rendered
                if (hasRenderedMath(content)) {
                    console.log(`  ⏭️ Skipping ${entry} (already rendered)`);
                    skippedCount++;
                    continue;
                }
                
                // Skip if no raw math
                if (!hasRawMath(content)) {
                    console.log(`  ℹ️ Skipping ${entry} (no raw math)`);
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
