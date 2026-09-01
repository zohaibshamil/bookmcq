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

// ===== READ KATEX CSS FROM NODE_MODULES =====
function getKatexCSS() {
    try {
        const cssPath = path.join(__dirname, 'node_modules', 'katex', 'dist', 'katex.min.css');
        if (fs.existsSync(cssPath)) {
            return fs.readFileSync(cssPath, 'utf-8');
        }
        console.warn('⚠️ KaTeX CSS not found in node_modules!');
        return '';
    } catch (e) {
        console.warn('⚠️ Error reading KaTeX CSS:', e.message);
        return '';
    }
}

// ===== INJECT CSS INTO HTML HEAD =====
function injectKatexCSS(content) {
    const css = getKatexCSS();
    
    if (!css) {
        console.warn('⚠️ No CSS to inject');
        return content;
    }
    
    // Check if already injected
    if (content.includes('katex.min.css') || content.includes('id="katex-styles"')) {
        return content;
    }
    
    // Create style tag with embedded CSS
    const styleTag = `<style id="katex-styles">\n${css}\n</style>`;
    
    // Inject into <head>
    if (content.includes('<head>')) {
        return content.replace(/<head>/i, `<head>\n    ${styleTag}`);
    } else if (content.includes('<html>')) {
        return content.replace(/<html>/i, `<html>\n<head>\n    ${styleTag}\n</head>`);
    } else {
        // If no head, add at the top
        return styleTag + '\n' + content;
    }
}

// ===== KATEX 0.18+ TRUST OPTION HELPER =====
// In v0.18.0+, `trust` must be a function or a boolean
function createTrustOptions() {
    // For full trust (like the old `trust: true`), return a function that always returns true
    return function(context) {
        // context contains: { command, url, protocol }
        // Return true to allow all commands and URLs
        return true;
    };
}

// Render math using KaTeX with clean output
function renderMathToHTML(text, displayMode = false) {
    if (!text) return text;
    
    // Skip if already rendered
    if (hasRenderedMath(text)) {
        return text;
    }
    
    // Decode HTML entities
    let decodedText = decodeHtmlEntities(text);
    
    // Check if contains raw math
    if (!hasRawMath(decodedText)) return text;
    
    // Common render options for KaTeX 0.18+
    const getRenderOptions = function(display) {
        return {
            throwOnError: false,
            displayMode: display,
            // In v0.18.0+, trust must be a function
            trust: createTrustOptions(),
            macros: {
                "\\R": "\\mathbb{R}",
                "\\N": "\\mathbb{N}",
                "\\Z": "\\mathbb{Z}",
                "\\Q": "\\mathbb{Q}",
                "\\C": "\\mathbb{C}"
            },
            // New in v0.18.0: stricter output by default
            // We disable minRuleThickness to keep compatibility
            minRuleThickness: -Infinity
        };
    };
    
    try {
        let processed = decodedText;
        
        // Process display math: $$...$$
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, getRenderOptions(true));
                return rendered;
            } catch (e) {
                return match;
            }
        });
        
        // Process inline math: $...$
        processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, getRenderOptions(false));
                return rendered;
            } catch (e) {
                return match;
            }
        });
        
        // Process \(...\)
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, getRenderOptions(false));
                return rendered;
            } catch (e) {
                return match;
            }
        });
        
        // Process \[...\]
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, getRenderOptions(true));
                return rendered;
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
        
        if (modified) {
            // Inject KaTeX CSS into head
            content = injectKatexCSS(content);
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
    console.log('📁 Processing HTML files in books/ folder only...\n');
    
    try {
        // Get the absolute path to the books folder
        const booksDir = path.resolve(process.cwd(), 'books');
        
        // Check if books folder exists
        if (!fs.existsSync(booksDir)) {
            console.log('❌ books/ folder not found!');
            console.log('📁 Current directory:', process.cwd());
            console.log('📁 Contents:', fs.readdirSync('./').join(', '));
            process.exit(1);
        }
        
        console.log(`📂 Target directory: ${booksDir}`);
        const result = processHTMLFiles(booksDir);
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Math pre-rendering complete!');
        console.log('='.repeat(50));
        console.log(`📊 Total files processed: ${result.processed}`);
        console.log(`📝 Files modified: ${result.modified}`);
        console.log(`⏭️ Files skipped: ${result.skipped}`);
        console.log(`💡 Rendering engine: KaTeX v${katex.version} (Catax)`);
        console.log('💡 CSS embedded: Fully self-contained (no CDN)');
        console.log('='.repeat(50));
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
main();
