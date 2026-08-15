// ============================================
// GENERATE-CHAPTER-ORDER.JS
// Run this script to generate chapter-order.json backup
// ============================================

// NOTE: This is a Node.js script that requires the Supabase JS SDK
// Run with: node scripts/generate-chapter-order.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration - SAME as config.js
const SUPABASE_URL = 'https://wnsuuazwcxmuwqyphvse.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qsQzf3RycZtO8Uj1hd3mcg_jaX6iQ9C';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateChapterOrder() {
    console.log('🚀 Starting chapter order generation...');
    
    try {
        // Fetch chapters with book slugs
        const { data, error } = await supabase
            .from('chapters')
            .select(`
                chapter_number,
                slug,
                books!inner (
                    slug
                )
            `)
            .order('book_id')
            .order('chapter_number', { ascending: true });

        if (error) {
            console.error('❌ Database error:', error);
            process.exit(1);
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No chapters found in database');
            process.exit(0);
        }

        // Group by book slug
        const grouped = {};
        data.forEach(row => {
            const bookSlug = row.books.slug;
            if (!grouped[bookSlug]) {
                grouped[bookSlug] = {};
            }
            if (row.chapter_number !== null && row.chapter_number !== undefined) {
                grouped[bookSlug][row.slug] = row.chapter_number;
            }
        });

        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '../public/data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Write to JSON file
        const filePath = path.join(dataDir, 'chapter-order.json');
        fs.writeFileSync(
            filePath,
            JSON.stringify(grouped, null, 2)
        );

        console.log(`✅ chapter-order.json generated successfully!`);
        console.log(`📊 Books: ${Object.keys(grouped).length}`);
        console.log(`📁 File: ${filePath}`);
        
        // Also create a backup in the public folder
        const publicPath = path.join(__dirname, '../public/chapter-order.json');
        fs.writeFileSync(
            publicPath,
            JSON.stringify(grouped, null, 2)
        );
        console.log(`📁 Backup: ${publicPath}`);

    } catch (error) {
        console.error('❌ Failed to generate chapter order:', error);
        process.exit(1);
    }
}

// Run the script
generateChapterOrder();
