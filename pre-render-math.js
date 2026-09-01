// pre-render-math.js
const fs = require('fs');
const path = require('path');
const katex = require('katex');

// ===== HELPER FUNCTIONS =====

// Check if content already has rendered math
function hasRenderedMath(text) {
    return text.includes('class="katex"') || 
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

// Decode HTML entities for math processing
function decodeHtmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// ===== MATH RENDERER =====

function renderMathToHTML(text, displayMode = false) {
    if (!text) return text;
    
    // Skip if already rendered
    if (hasRenderedMath(text)) {
        return cleanMathOutput(text);
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
                return katex.renderToString(cleanMath, {
                    displayMode: true,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                console.error('Error rendering display math:', e.message);
                return match;
            }
        });
        
        // Process inline math: $...$
        processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                return katex.renderToString(cleanMath, {
                    displayMode: false,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                return match;
            }
        });
        
        // Process \(...\)
        processed = processed.replace(/\\\((.+?)\\\)/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                return katex.renderToString(cleanMath, {
                    displayMode: false,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                return match;
            }
        });
        
        // Process \[...\]
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            try {
                const cleanMath = math.trim();
                return katex.renderToString(cleanMath, {
                    displayMode: true,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                return match;
            }
        });
        
        return processed;
    } catch (e) {
        console.error('Math rendering error:', e);
        return text;
    }
}

function cleanMathOutput(html) {
    if (!html) return '';
    return html.replace(/\s+/g, ' ').trim();
}

// ===== FILE PROCESSING =====

// Process HTML file
async function processHTMLFile(filePath) {
    console.log('  Processing:', path.basename(filePath));
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // Check if file has any math to process
        if (!hasRawMath(content) && !hasRenderedMath(content)) {
            console.log('    ℹ️ No math found - skipping');
            return false;
        }
        
        // Process within <p> tags
        const pTagRegex = /(<p[^>]*>)([\s\S]*?)(<\/p>)/g;
        let match;
        let newContent = '';
        let lastIndex = 0;
        
        while ((match = pTagRegex.exec(content)) !== null) {
            const [fullMatch, openTag, text, closeTag] = match;
            const startIndex = match.index;
            const endIndex = startIndex + fullMatch.length;
            
            newContent += content.substring(lastIndex, startIndex);
            
            if (hasRawMath(text) || hasRenderedMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    newContent += openTag + rendered + closeTag;
                } else {
                    newContent += fullMatch;
                }
            } else {
                newContent += fullMatch;
            }
            
            lastIndex = endIndex;
        }
        newContent += content.substring(lastIndex);
        if (modified) content = newContent;
        
        // Process within <div> tags
        const divTagRegex = /(<div[^>]*>)([\s\S]*?)(<\/div>)/g;
        let divMatch;
        let divNewContent = '';
        let divLastIndex = 0;
        
        while ((divMatch = divTagRegex.exec(content)) !== null) {
            const [fullMatch, openTag, text, closeTag] = divMatch;
            const startIndex = divMatch.index;
            const endIndex = startIndex + fullMatch.length;
            
            divNewContent += content.substring(divLastIndex, startIndex);
            
            if (text.includes('class="math') || hasRenderedMath(text) || hasRawMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    divNewContent += openTag + rendered + closeTag;
                } else {
                    divNewContent += fullMatch;
                }
            } else {
                divNewContent += fullMatch;
            }
            
            divLastIndex = endIndex;
        }
        divNewContent += content.substring(divLastIndex);
        if (modified) content = divNewContent;
        
        // Process within <span> tags
        const spanTagRegex = /(<span[^>]*>)([\s\S]*?)(<\/span>)/g;
        let spanMatch;
        let spanNewContent = '';
        let spanLastIndex = 0;
        
        while ((spanMatch = spanTagRegex.exec(content)) !== null) {
            const [fullMatch, openTag, text, closeTag] = spanMatch;
            const startIndex = spanMatch.index;
            const endIndex = startIndex + fullMatch.length;
            
            spanNewContent += content.substring(spanLastIndex, startIndex);
            
            if (hasRenderedMath(text) || hasRawMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    spanNewContent += openTag + rendered + closeTag;
                } else {
                    spanNewContent += fullMatch;
                }
            } else {
                spanNewContent += fullMatch;
            }
            
            spanLastIndex = endIndex;
        }
        spanNewContent += content.substring(spanLastIndex);
        if (modified) content = spanNewContent;
        
        // Process within <h1>-<h6> tags
        const headingRegex = /(<h[1-6][^>]*>)([\s\S]*?)(<\/h[1-6]>)/g;
        let headingMatch;
        let headingNewContent = '';
        let headingLastIndex = 0;
        
        while ((headingMatch = headingRegex.exec(content)) !== null) {
            const [fullMatch, openTag, text, closeTag] = headingMatch;
            const startIndex = headingMatch.index;
            const endIndex = startIndex + fullMatch.length;
            
            headingNewContent += content.substring(headingLastIndex, startIndex);
            
            if (hasRawMath(text) || hasRenderedMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    headingNewContent += openTag + rendered + closeTag;
                } else {
                    headingNewContent += fullMatch;
                }
            } else {
                headingNewContent += fullMatch;
            }
            
            headingLastIndex = endIndex;
        }
        headingNewContent += content.substring(headingLastIndex);
        if (modified) content = headingNewContent;
        
        // Process within <li> tags
        const liTagRegex = /(<li[^>]*>)([\s\S]*?)(<\/li>)/g;
        let liMatch;
        let liNewContent = '';
        let liLastIndex = 0;
        
        while ((liMatch = liTagRegex.exec(content)) !== null) {
            const [fullMatch, openTag, text, closeTag] = liMatch;
            const startIndex = liMatch.index;
            const endIndex = startIndex + fullMatch.length;
            
            liNewContent += content.substring(liLastIndex, startIndex);
            
            if (hasRawMath(text) || hasRenderedMath(text)) {
                const rendered = renderMathToHTML(text);
                if (rendered !== text) {
                    modified = true;
                    liNewContent += openTag + rendered + closeTag;
                } else {
                    liNewContent += fullMatch;
                }
            } else {
                liNewContent += fullMatch;
            }
            
            liLastIndex = endIndex;
        }
        liNewContent += content.substring(liLastIndex);
        if (modified) content = liNewContent;
        
        // Process text nodes outside of tags
        const textNodesRegex = /([^<>\n]*)(?=<|$)/g;
        let textMatch;
        let textNewContent = '';
        let textLastIndex = 0;
        
        while ((textMatch = textNodesRegex.exec(content)) !== null) {
            const match = textMatch[0];
            const startIndex = textMatch.index;
            const endIndex = startIndex + match.length;
            
            textNewContent += content.substring(textLastIndex, startIndex);
            
            if (match && match.trim() !== '') {
                if (hasRenderedMath(match) || hasRawMath(match)) {
                    const rendered = renderMathToHTML(match);
                    if (rendered !== match) {
                        modified = true;
                        textNewContent += rendered;
                    } else {
                        textNewContent += match;
                    }
                } else {
                    textNewContent += match;
                }
            } else {
                textNewContent += match;
            }
            
            textLastIndex = endIndex;
        }
        textNewContent += content.substring(textLastIndex);
        if (modified) content = textNewContent;
        
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

// Recursively process all HTML files in books directory
async function processHTMLFiles(dir) {
    console.log(`📁 Scanning: ${dir}`);
    
    const entries = fs.readdirSync(dir);
    let processedCount = 0;
    let modifiedCount = 0;
    let skippedCount = 0;
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Skip system directories
            if (!['node_modules', '.git', '.github'].includes(entry)) {
                const result = await processHTMLFiles(fullPath);
                processedCount += result.processed;
                modifiedCount += result.modified;
                skippedCount += result.skipped || 0;
            }
        } else if (entry.endsWith('.html') || entry.endsWith('.htm')) {
            processedCount++;
            
            try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                
                if (!hasRawMath(content) && !hasRenderedMath(content)) {
                    console.log(`  ℹ️ Skipping ${entry} (no math)`);
                    skippedCount++;
                    continue;
                }
            } catch (e) {
                console.error(`  ❌ Error reading ${entry}:`, e.message);
                continue;
            }
            
            const modified = await processHTMLFile(fullPath);
            if (modified) modifiedCount++;
        }
    }
    
    return { processed: processedCount, modified: modifiedCount, skipped: skippedCount };
}

// ===== MAIN =====

async function main() {
    console.log('🚀 Starting math pre-rendering with KaTeX');
    console.log('📁 Processing HTML files in books folder only...\n');
    
    try {
        // ONLY process books directory - no fallback
        const targetDir = './books';
        
        if (!fs.existsSync(targetDir)) {
            console.log('📁 No books directory found - nothing to process');
            console.log('✅ Done!');
            return;
        }
        
        const result = await processHTMLFiles(targetDir);
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Math pre-rendering complete!');
        console.log('='.repeat(50));
        console.log(`📊 Total files processed: ${result.processed}`);
        console.log(`📝 Files modified: ${result.modified}`);
        console.log(`⏭️ Files skipped: ${result.skipped}`);
        console.log(`💡 Rendering engine: KaTeX`);
        console.log('='.repeat(50));
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
main();
