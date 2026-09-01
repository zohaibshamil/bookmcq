// pre-render-math.js
const fs = require('fs');
const path = require('path');
const katex = require('katex');

// ===== HELPER FUNCTIONS (borrowed from generateTopicPage) =====

// Escape HTML but preserve math delimiters
function escapeHtmlPreserveMath(text) {
    if (!text) return text;
    
    // First, temporarily protect math delimiters with placeholders
    const placeholders = [];
    let protectedText = text;
    
    // Protect $...$ with placeholder
    protectedText = protectedText.replace(/\$(.+?)\$/g, function(match, math) {
        const placeholder = `<<<MATH_INLINE_${placeholders.length}>>>`;
        placeholders.push({ type: 'inline', math: math, original: match });
        return placeholder;
    });
    
    // Protect $$...$$ with placeholder
    protectedText = protectedText.replace(/\$\$(.+?)\$\$/g, function(match, math) {
        const placeholder = `<<<MATH_DISPLAY_${placeholders.length}>>>`;
        placeholders.push({ type: 'display', math: math, original: match });
        return placeholder;
    });
    
    // Protect \(...\) with placeholder
    protectedText = protectedText.replace(/\\\((.+?)\\\)/g, function(match, math) {
        const placeholder = `<<<MATH_PAREN_${placeholders.length}>>>`;
        placeholders.push({ type: 'paren', math: math, original: match });
        return placeholder;
    });
    
    // Protect \[...\] with placeholder
    protectedText = protectedText.replace(/\\\[(.+?)\\\]/g, function(match, math) {
        const placeholder = `<<<MATH_BRACKET_${placeholders.length}>>>`;
        placeholders.push({ type: 'bracket', math: math, original: match });
        return placeholder;
    });
    
    // Escape HTML (but don't escape our placeholders)
    let escaped = protectedText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    // Restore math placeholders
    placeholders.forEach((p, index) => {
        const placeholder = `<<<MATH_${p.type.toUpperCase()}_${index}>>>`;
        escaped = escaped.replace(placeholder, p.original);
    });
    
    return escaped;
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

// Check if text contains any math delimiters
function hasMath(text) {
    return text.includes('$') || text.includes('\\(') || text.includes('\\[');
}

// Render math using KaTeX (with proper handling)
function renderMathToHTML(text) {
    if (!text) return text;
    if (!hasMath(text)) return text;
    
    // First decode HTML entities
    let decodedText = decodeHtmlEntities(text);
    
    // Check again after decoding
    if (!hasMath(decodedText)) return text;
    
    try {
        let processed = decodedText;
        
        // Process display math: $$...$$ (must come before $...$)
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
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
                console.error('  ⚠️ Error rendering display math:', math.substring(0, 50) + '...', e.message);
                return match; // Return original on error
            }
        });
        
        // Process inline math: $...$ (but not $$...$$)
        processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function(match, math) {
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
                console.error('  ⚠️ Error rendering inline math:', math.substring(0, 50) + '...', e.message);
                return match;
            }
        });
        
        // Process \(...\) style
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
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
                console.error('  ⚠️ Error rendering \\( \\) math:', math.substring(0, 50) + '...', e.message);
                return match;
            }
        });
        
        // Process \[...\] style
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
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
                console.error('  ⚠️ Error rendering \\[ \\] math:', math.substring(0, 50) + '...', e.message);
                return match;
            }
        });
        
        return processed;
    } catch (e) {
        console.error('  ❌ Math rendering error:', e.message);
        return text;
    }
}

// ===== FILE PROCESSING =====

// Check if content already has rendered math
function hasRenderedMath(text) {
    return text.includes('class="katex"') || text.includes('<span class="katex-mathml">');
}

// Process HTML file
function processHTMLFile(filePath) {
    console.log('  Processing:', path.basename(filePath));
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // Skip if no math in the file
        if (!hasMath(content)) {
            console.log('    ℹ️ No math found, skipping');
            return false;
        }
        
        // Skip if already has rendered math (to avoid double-rendering)
        if (hasRenderedMath(content)) {
            console.log('    ℹ️ Already has rendered math, skipping');
            return false;
        }
        
        // Process text content - look for math in various HTML contexts
        
        // Process within <p> tags
        content = content.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/g, function(match, openTag, text, closeTag) {
            if (hasMath(text) && !hasRenderedMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process within <div> tags (for definitions and explanations)
        content = content.replace(/(<div[^>]*>)([\s\S]*?)(<\/div>)/g, function(match, openTag, text, closeTag) {
            // Skip if it's a math container or already has rendered math
            if (text.includes('class="math') || hasRenderedMath(text)) return match;
            
            if (hasMath(text)) {
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
            // Skip if it's already math rendered
            if (hasRenderedMath(text)) return match;
            
            if (hasMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process within <h2>, <h3>, etc.
        content = content.replace(/(<h[1-6][^>]*>)([\s\S]*?)(<\/h[1-6]>)/g, function(match, openTag, text, closeTag) {
            if (hasMath(text) && !hasRenderedMath(text)) {
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
            if (hasMath(text) && !hasRenderedMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    return openTag + rendered + closeTag;
                }
            }
            return match;
        });
        
        // Process text nodes outside of tags (fallback)
        // This is more complex and might need a proper HTML parser for production
        // But for now, we'll use a simple approach
        const textNodesRegex = /([^<>\n]*)(?=<|$)/g;
        content = content.replace(textNodesRegex, function(match) {
            if (!match || match.trim() === '') return match;
            if (hasRenderedMath(match)) return match;
            if (!hasMath(match)) return match;
            
            const rendered = renderMathToHTML(match);
            if (rendered !== match) {
                modified = true;
                return rendered;
            }
            return match;
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log('    ✅ Updated: math rendered successfully');
            return true;
        } else {
            console.log('    ℹ️ No changes made');
            return false;
        }
    } catch (error) {
        console.error('    ❌ Error processing:', error.message);
        return false;
    }
}

// Recursively process all HTML files in directory
function processHTMLFiles(dir) {
    console.log(`📁 Scanning directory: ${dir}`);
    
    const entries = fs.readdirSync(dir);
    let processedCount = 0;
    let modifiedCount = 0;
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Skip node_modules, .git, .github
            if (!['node_modules', '.git', '.github'].includes(entry)) {
                const result = processHTMLFiles(fullPath);
                processedCount += result.processed;
                modifiedCount += result.modified;
            }
        } else if (entry.endsWith('.html') || entry.endsWith('.htm')) {
            processedCount++;
            const modified = processHTMLFile(fullPath);
            if (modified) modifiedCount++;
        }
    }
    
    return { processed: processedCount, modified: modifiedCount };
}

// ===== MAIN =====

function main() {
    console.log('🚀 Starting math pre-rendering with KaTeX (Catax)');
    console.log(`📦 KaTeX version: ${katex.version}`);
    console.log('📁 Processing all HTML files in current directory...\n');
    
    try {
        const result = processHTMLFiles('./');
        
        console.log('\n✅ Math pre-rendering complete!');
        console.log(`📊 Processed: ${result.processed} HTML files`);
        console.log(`📝 Modified: ${result.modified} files`);
        console.log(`💡 KaTeX rendered math using Catax engine`);
    } catch (error) {
        console.error('\n❌ Error during processing:', error);
        process.exit(1);
    }
}

// Run the script
main();
