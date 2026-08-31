// pre-render-math.js - Simple math rendering (no complex async)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting math pre-rendering...');
console.log('📁 ONLY processing files in the "books" folder...');
console.log('📌 Using simple math rendering (no complex dependencies)\n');

// Simple function to clean LaTeX for readability
function cleanLatex(math) {
    let cleaned = math
        // Remove \left and \right
        .replace(/\\left/g, '')
        .replace(/\\right/g, '')
        // Clean up fractions
        .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, function(match, num, den) {
            return num + '/' + den;
        })
        // Clean up common functions
        .replace(/\\ln/g, 'ln')
        .replace(/\\sin/g, 'sin')
        .replace(/\\cos/g, 'cos')
        .replace(/\\tan/g, 'tan')
        .replace(/\\log/g, 'log')
        .replace(/\\exp/g, 'exp')
        .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
        // Clean up integrals
        .replace(/\\int/g, '∫')
        // Remove braces
        .replace(/\{/g, '(')
        .replace(/\}/g, ')')
        // Clean up superscripts/subscripts
        .replace(/\^\{([^}]*)\}/g, '^$1')
        .replace(/_\{([^}]*)\}/g, '_$1')
        // Remove extra spaces
        .replace(/\s+/g, ' ')
        .trim();
    
    return cleaned;
}

function renderMathToHTML(text) {
    if (!text) return text;
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
        return text;
    }
    
    try {
        // Process \(...\) style
        let processed = text.replace(/\\\((.+?)\\\)/g, function(match, math) {
            const cleaned = cleanLatex(math);
            return '<span class="math-inline" style="font-family: \'Times New Roman\', serif; font-style: italic;">' + 
                   cleaned + 
                   '</span>';
        });
        
        // Process $...$ style
        processed = processed.replace(/\$(.+?)\$/g, function(match, math) {
            const cleaned = cleanLatex(math);
            return '<span class="math-inline" style="font-family: \'Times New Roman\', serif; font-style: italic;">' + 
                   cleaned + 
                   '</span>';
        });
        
        // Process \[...\] style (display math)
        processed = processed.replace(/\\\[(.+?)\\\]/g, function(match, math) {
            const cleaned = cleanLatex(math);
            return '<div class="math-display" style="text-align: center; font-family: \'Times New Roman\', serif; font-style: italic; padding: 10px 0;">' + 
                   cleaned + 
                   '</div>';
        });
        
        // Process $$...$$ style (display math)
        processed = processed.replace(/\$\$(.+?)\$\$/g, function(match, math) {
            const cleaned = cleanLatex(math);
            return '<div class="math-display" style="text-align: center; font-family: \'Times New Roman\', serif; font-style: italic; padding: 10px 0;">' + 
                   cleaned + 
                   '</div>';
        });
        
        return processed;
    } catch (e) {
        return text;
    }
}

function processBooksFolder() {
    const booksDir = './books';
    let processedCount = 0;
    let filesWithMath = 0;
    
    if (!fs.existsSync(booksDir)) {
        console.log('❌ Books folder not found!');
        return 0;
    }
    
    console.log(`📂 Processing ONLY: ${booksDir}\n`);
    
    function processDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                processDirectory(filePath);
            } else if (file.endsWith('.html')) {
                try {
                    let content = fs.readFileSync(filePath, 'utf-8');
                    let originalContent = content;
                    
                    if (content.includes('$') || content.includes('\\(') || content.includes('\\[')) {
                        filesWithMath++;
                        let modified = false;
                        
                        // Process math in ALL text content
                        // Method 1: Process inside HTML elements
                        const elementPatterns = [
                            /<p[^>]*>([\s\S]*?)<\/p>/g,
                            /<div[^>]*class="[^"]*(?:explanation|definition|q-text|math|diff-tag)[^"]*"[^>]*>([\s\S]*?)<\/div>/g,
                            /<span[^>]*class="[^"]*(?:math|q-text)[^"]*"[^>]*>([\s\S]*?)<\/span>/g,
                            /<li[^>]*>([\s\S]*?)<\/li>/g,
                            /<strong[^>]*>([\s\S]*?)<\/strong>/g,
                            /<em[^>]*>([\s\S]*?)<\/em>/g
                        ];
                        
                        for (const pattern of elementPatterns) {
                            content = content.replace(pattern, function(match, text) {
                                if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                    const rendered = renderMathToHTML(text);
                                    if (rendered !== text) {
                                        modified = true;
                                        return match.replace(text, rendered);
                                    }
                                }
                                return match;
                            });
                        }
                        
                        // Method 2: Process ANY text between tags
                        content = content.replace(/>([^<]*?)</g, function(match, text) {
                            if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
                                const rendered = renderMathToHTML(text);
                                if (rendered !== text) {
                                    modified = true;
                                    return '>' + rendered + '<';
                                }
                            }
                            return match;
                        });
                        
                        if (modified) {
                            fs.writeFileSync(filePath, content, 'utf-8');
                            processedCount++;
                            const relativePath = path.relative(booksDir, filePath);
                            console.log(`  ✓ Processed: books/${relativePath}`);
                        }
                    }
                } catch (error) {
                    console.error(`  ✗ Error processing: ${filePath}`, error.message);
                }
            }
        }
    }
    
    processDirectory(booksDir);
    console.log(`\n📊 Found ${filesWithMath} files with math content.`);
    return processedCount;
}

try {
    const count = processBooksFolder();
    console.log('\n' + '='.repeat(50));
    if (count > 0) {
        console.log(`✅ SUCCESS: ${count} files processed in the books folder.`);
        console.log('📌 ONLY the books folder was modified.');
    } else {
        console.log('ℹ️ No files were modified.');
        console.log('💡 Check that your HTML files contain math delimiters like:');
        console.log('   - \\( ... \\) for inline math');
        console.log('   - \\[ ... \\] for display math');
    }
    console.log('='.repeat(50));
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
