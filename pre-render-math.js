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

// ===== GET KATEX CSS WITH SYSTEM FONTS =====
function getKatexCSSWithSystemFonts() {
    try {
        const cssPath = path.join(__dirname, 'node_modules', 'katex', 'dist', 'katex.min.css');
        if (!fs.existsSync(cssPath)) {
            console.warn('⚠️ KaTeX CSS not found in node_modules!');
            return '';
        }
        
        let css = fs.readFileSync(cssPath, 'utf-8');
        
        // Remove ALL @font-face declarations (no font downloads!)
        css = css.replace(/@font-face\s*\{[^}]*\}/g, '');
        
        // Replace font-family with system fonts
        css = css.replace(/font-family:\s*['"]KaTeX_([^'"]+)['"]/g, function(match, fontName) {
            // Map KaTeX fonts to system fonts
            const systemFonts = {
                'Main': '"Times New Roman", "STIX", "MathJax_Main", serif',
                'Math': '"Times New Roman", "STIX", "MathJax_Main", "Cambria Math", serif',
                'Size1': '"Times New Roman", "STIX", "MathJax_Size1", serif',
                'Size2': '"Times New Roman", "STIX", "MathJax_Size2", serif',
                'Size3': '"Times New Roman", "STIX", "MathJax_Size3", serif',
                'Size4': '"Times New Roman", "STIX", "MathJax_Size4", serif',
                'Caligraphic': '"Brush Script MT", "Lucida Calligraphy", cursive',
                'Fraktur': '"Lucida Blackletter", "Old English Text MT", serif',
                'SansSerif': 'Arial, "Helvetica Neue", Helvetica, sans-serif',
                'Script': '"Brush Script MT", "Lucida Calligraphy", cursive',
                'Typewriter': '"Courier New", "Consolas", monospace'
            };
            
            const systemFont = systemFonts[fontName] || '"Times New Roman", serif';
            return `font-family: ${systemFont}`;
        });
        
        // Also handle the fallback fonts
        css = css.replace(/font-family:\s*KaTeX_([^,]+),/g, function(match, fontName) {
            const systemFonts = {
                'Main': '"Times New Roman", "STIX", "MathJax_Main", serif',
                'Math': '"Times New Roman", "STIX", "MathJax_Main", "Cambria Math", serif',
                'Size1': '"Times New Roman", "STIX", "MathJax_Size1", serif',
                'Size2': '"Times New Roman", "STIX", "MathJax_Size2", serif',
                'Size3': '"Times New Roman", "STIX", "MathJax_Size3", serif',
                'Size4': '"Times New Roman", "STIX", "MathJax_Size4", serif',
                'Caligraphic': '"Brush Script MT", "Lucida Calligraphy", cursive',
                'Fraktur': '"Lucida Blackletter", "Old English Text MT", serif',
                'SansSerif': 'Arial, "Helvetica Neue", Helvetica, sans-serif',
                'Script': '"Brush Script MT", "Lucida Calligraphy", cursive',
                'Typewriter': '"Courier New", "Consolas", monospace'
            };
            
            const systemFont = systemFonts[fontName] || '"Times New Roman", serif';
            return `font-family: ${systemFont},`;
        });
        
        return css;
    } catch (e) {
        console.warn('⚠️ Error processing KaTeX CSS:', e.message);
        return '';
    }
}

// ===== INJECT CSS INTO HTML HEAD =====
function injectKatexCSS(content) {
    const css = getKatexCSSWithSystemFonts();
    
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
        return styleTag + '\n' + content;
    }
}

// ===== KATEX 0.18+ TRUST OPTION HELPER =====
function createTrustOptions() {
    return function(context) {
        return true;
    };
}

// Render math using KaTeX with clean output
function renderMathToHTML(text, displayMode = false) {
    if (!text) return text;
    
    if (hasRenderedMath(text)) {
        return text;
    }
    
    let decodedText = decodeHtmlEntities(text);
    
    if (!hasRawMath(decodedText)) return text;
    
    const getRenderOptions = function(display) {
        return {
            throwOnError: false,
            displayMode: display,
            trust: createTrustOptions(),
            macros: {
                "\\R": "\\mathbb{R}",
                "\\N": "\\mathbb{N}",
                "\\Z": "\\mathbb{Z}",
                "\\Q": "\\mathbb{Q}",
                "\\C": "\\mathbb{C}"
            },
            minRuleThickness: -Infinity
        };
    };
    
    try {
        let processed = decodedText;
        
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, getRenderOptions(true));
                return rendered;
            } catch (e) {
                return match;
            }
        });
        
        processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, getRenderOptions(false));
                return rendered;
            } catch (e) {
                return match;
            }
        });
        
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                let rendered = katex.renderToString(cleanMath, getRenderOptions(false));
                return rendered;
            } catch (e) {
                return match;
            }
        });
        
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

function processHTMLFile(filePath) {
    console.log('  Processing:', path.basename(filePath));
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        if (!hasRawMath(content) && !content.includes('class="katex"')) {
            console.log('    ℹ️ No math found - skipping');
            return false;
        }
        
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
    console.log('🚀 Starting math pre-rendering with KaTeX (Catax)');
    console.log(`📦 KaTeX version: ${katex.version}`);
    console.log('📁 Processing HTML files in books/ folder only...\n');
    
    try {
        const booksDir = path.resolve(process.cwd(), 'books');
        
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
        console.log('💡 Fonts: System fonts only (no external downloads)');
        console.log('💡 CSS embedded: Fully self-contained');
        console.log('='.repeat(50));
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();
