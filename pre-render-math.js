// ===== MAIN =====

function main() {
    const args = process.argv.slice(2);

    console.log(`📦 KaTeX version: ${katex.version}`);

    // ===== MODE 1: specific file(s) / dir(s) passed as args =====
    if (args.length > 0) {
        console.log('🚀 Processing specific target(s) only\n');
        console.log(`🎯 Targets: ${args.join(', ')}\n`);

        const booksDir = path.resolve(process.cwd(), 'books');
        let processed = 0, modified = 0, skipped = 0, errors = 0;

        for (const arg of args) {
            const targetPath = path.isAbsolute(arg)
                ? arg
                : path.resolve(process.cwd(), arg);

            // Security: must stay inside books/
            if (targetPath !== booksDir && !targetPath.startsWith(booksDir + path.sep)) {
                console.log(`⏭️ Skipping ${arg} — not inside books/`);
                skipped++;
                continue;
            }

            if (!fs.existsSync(targetPath)) {
                console.log(`❌ Not found: ${arg}`);
                errors++;
                continue;
            }

            const stat = fs.statSync(targetPath);

            if (stat.isDirectory()) {
                const r = processHTMLFiles(targetPath);
                processed += r.processed;
                modified  += r.modified;
                skipped   += r.skipped || 0;
            } else if (targetPath.endsWith('.html') || targetPath.endsWith('.htm')) {
                try {
                    const content = fs.readFileSync(targetPath, 'utf-8');
                    if (!hasRawMath(content) && !content.includes('class="katex"')) {
                        console.log(`  ℹ️ Skipping ${path.basename(targetPath)} (no math)`);
                        skipped++;
                        continue;
                    }
                } catch (e) {
                    console.error(`  ❌ Error reading ${arg}:`, e.message);
                    errors++;
                    continue;
                }

                processed++;
                if (processHTMLFile(targetPath)) modified++;
            } else {
                console.log(`⏭️ Skipping ${arg} — not HTML or directory`);
                skipped++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ Math pre-rendering complete!');
        console.log('='.repeat(50));
        console.log(`📊 Total files processed: ${processed}`);
        console.log(`📝 Files modified: ${modified}`);
        console.log(`⏭️ Files skipped: ${skipped}`);
        if (errors) console.log(`❌ Errors: ${errors}`);
        console.log('='.repeat(50));
        return;
    }

    // ===== MODE 2: no args → process ALL of books/ (old behavior) =====
    console.log('🚀 Starting math pre-rendering (all files in books/)');
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
        console.log('='.repeat(50));
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();
