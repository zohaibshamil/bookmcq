// pre-render-math.js
const fs = require('fs');
const path = require('path');
const mathjax = require('mathjax-full');
const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js');

// ===== HELPER FUNCTIONS =====

// Check if content already has rendered math
function hasRenderedMath(text) {
    return text.includes('class="mjx-"') || 
           text.includes('mathjax') ||
           text.includes('MJX') ||
           /data-mjx/.test(text);
}

// Check if text contains raw math delimiters
function hasRawMath(text) {
    if (hasRenderedMath(text)) return false;
    return text.includes('$') || 
           text.includes('\\(') || 
           text.includes('\\[') ||
           /\\begin\{.*?\}/.test(text);
}

// Decode HTML entities for MathJax processing
function decodeHtmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// ===== MATHJAX RENDERER =====

let mathjaxInstance = null;
let renderPromise = null;

async function initMathJax() {
    if (mathjaxInstance) return mathjaxInstance;
    
    try {
        const MathJax = await mathjax.init({
            loader: {
                load: ['input/tex-full', 'output/svg']
            },
            tex: {
                packages: AllPackages,
                inlineMath: [
                    ['$', '$'],
                    ['\\(', '\\)']
                ],
                displayMath: [
                    ['$$', '$$'],
                    ['\\[', '\\]']
                ],
                processEscapes: true,
                processEnvironments: true,
                macros: {
                    "R": "\\mathbb{R}",
                    "N": "\\mathbb{N}",
                    "Z": "\\mathbb{Z}",
                    "Q": "\\mathbb{Q}",
                    "C": "\\mathbb{C}"
                }
            },
            svg: {
                fontCache: 'global',
                scale: 1,
                minScale: 0.5,
                mtextInheritFont: false,
                merrorInheritFont: true,
                mathmlSpacing: false,
                skipAttributes: {},
                exFactor: 6,
                displayAlign: 'center',
                displayIndent: '0'
            },
            options: {
                skipHtmlTypes: 'script',
                ignoreHtmlClass: 'no-mathjax',
                processHtmlClass: 'mathjax'
            }
        });
        
        mathjaxInstance = MathJax;
        return MathJax;
    } catch (error) {
        console.error('Failed to initialize MathJax:', error);
        throw error;
    }
}

async function renderMathToHTML(text, displayMode = false) {
    if (!text) return text;
    
    // Skip if already rendered
    if (hasRenderedMath(text)) {
        return cleanMathJaxOutput(text);
    }
    
    // Decode HTML entities
    let decodedText = decodeHtmlEntities(text);
    
    // Check if contains raw math
    if (!hasRawMath(decodedText)) return text;
    
    try {
        const mathjax = await initMathJax();
        let processed = decodedText;
        
        // Process display math: $$...$$
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                // Wrap in display math delimiters
                const tex = '\\[' + cleanMath + '\\]';
                const rendered = mathjax.tex2svg(tex);
                // Extract HTML from SVG
                const svgHtml = extractSvgContent(rendered);
                return cleanMathJaxOutput(svgHtml);
            } catch (e) {
                return match;
            }
        });
        
        // Process inline math: $...$
        processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                const tex = '\\(' + cleanMath + '\\)';
                const rendered = mathjax.tex2svg(tex);
                const svgHtml = extractSvgContent(rendered);
                return cleanMathJaxOutput(svgHtml);
            } catch (e) {
                return match;
            }
        });
        
        // Process \(...\)
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                const tex = '\\(' + cleanMath + '\\)';
                const rendered = mathjax.tex2svg(tex);
                const svgHtml = extractSvgContent(rendered);
                return cleanMathJaxOutput(svgHtml);
            } catch (e) {
                return match;
            }
        });
        
        // Process \[...\]
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                const tex = '\\[' + cleanMath + '\\]';
                const rendered = mathjax.tex2svg(tex);
                const svgHtml = extractSvgContent(rendered);
                return cleanMathJaxOutput(svgHtml);
            } catch (e) {
                return match;
            }
        });
        
        // Process environments \begin{...}...\end{...}
        processed = processed.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, function(match, env, content) {
            try {
                const tex = '\\begin{' + env + '}' + content + '\\end{' + env + '}';
                const rendered = mathjax.tex2svg(tex);
                const svgHtml = extractSvgContent(rendered);
                return cleanMathJaxOutput(svgHtml);
            } catch (e) {
                return match;
            }
        });
        
        return processed;
    } catch (e) {
        console.error('MathJax rendering error:', e);
        return text;
    }
}

function extractSvgContent(rendered) {
    // Convert the SVG element to a string
    if (typeof rendered === 'string') {
        return rendered;
    }
    
    // If it's a DOM element
    if (rendered && rendered.outerHTML) {
        return rendered.outerHTML;
    }
    
    // If it's a node with toString method
    if (rendered && rendered.toString) {
        const str = rendered.toString();
        if (str.includes('<svg')) {
            return str;
        }
    }
    
    // Fallback: try to convert to string
    return String(rendered);
}

function cleanMathJaxOutput(html) {
    if (!html) return '';
    
    // Remove extra whitespace
    html = html.replace(/\s+/g, ' ').trim();
    
    // Ensure SVG has proper styling
    if (html.includes('<svg')) {
        // Add standard MathJax classes if missing
        if (!html.includes('class="mjx-')) {
            html = html.replace('<svg', '<svg class="mjx-svg"');
        }
    }
    
    return html;
}

// ===== FILE PROCESSING =====

// Process HTML file
function processHTMLFile(filePath) {
    console.log('  Processing:', path.basename(filePath));
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // Check if file has any math to process
        if (!hasRawMath(content) && !hasRenderedMath(content)) {
            console.log('    ℹ️ No math found - skipping');
            return false;
        }
        
        // ===== PROCESSING =====
        
        // Process within <p> tags
        content = content.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/g, function(match, openTag, text, closeTag) {
            if (hasRawMath(text) || hasRenderedMath(text)) {
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
            if (text.includes('class="math') || hasRenderedMath(text)) {
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
            if (hasRenderedMath(text)) {
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
            if (hasRawMath(text) || hasRenderedMath(text)) {
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
            if (hasRawMath(text) || hasRenderedMath(text)) {
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
            if (hasRenderedMath(match)) {
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
                if (!hasRawMath(content) && !hasRenderedMath(content)) {
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

async function main() {
    console.log('🚀 Starting math pre-rendering with MathJax v3.2');
    console.log('📁 Processing all HTML files...\n');
    
    try {
        // Initialize MathJax first
        console.log('⚙️ Initializing MathJax...');
        await initMathJax();
        
        const result = await processHTMLFiles('./');
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Math pre-rendering complete!');
        console.log('='.repeat(50));
        console.log(`📊 Total files processed: ${result.processed}`);
        console.log(`📝 Files modified: ${result.modified}`);
        console.log(`⏭️ Files skipped: ${result.skipped}`);
        console.log(`💡 Rendering engine: MathJax v3.2`);
        console.log('='.repeat(50));
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
main();
