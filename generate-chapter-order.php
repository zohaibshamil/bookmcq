<?php
// generate-chapter-order.php
// Place this in your server root directory
// Run once to generate, or set as cron job

// Database configuration - UPDATE THESE!
$db_host = 'localhost';
$db_name = 'your_database_name';
$db_user = 'your_database_username';
$db_pass = 'your_database_password';

try {
    // Connect to database
    $pdo = new PDO("pgsql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Query to get chapter order
    $query = "
        SELECT 
            b.slug as book_slug,
            c.slug as chapter_slug,
            c.chapter_number
        FROM chapters c
        JOIN books b ON b.id = c.book_id
        WHERE c.chapter_number IS NOT NULL
        ORDER BY b.slug, c.chapter_number ASC
    ";
    
    $stmt = $pdo->query($query);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by book
    $chapterOrder = [];
    foreach ($results as $row) {
        $bookSlug = $row['book_slug'];
        $chapterSlug = $row['chapter_slug'];
        $chapterNumber = (int)$row['chapter_number'];
        
        if (!isset($chapterOrder[$bookSlug])) {
            $chapterOrder[$bookSlug] = [];
        }
        $chapterOrder[$bookSlug][$chapterSlug] = $chapterNumber;
    }
    
    // Also fetch any chapters without chapter_number (fallback)
    $fallbackQuery = "
        SELECT 
            b.slug as book_slug,
            c.slug as chapter_slug
        FROM chapters c
        JOIN books b ON b.id = c.book_id
        WHERE c.chapter_number IS NULL
    ";
    $fallbackStmt = $pdo->query($fallbackQuery);
    $fallbackResults = $fallbackStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add fallback chapters (will be placed at the end)
    foreach ($fallbackResults as $row) {
        $bookSlug = $row['book_slug'];
        $chapterSlug = $row['chapter_slug'];
        
        if (!isset($chapterOrder[$bookSlug])) {
            $chapterOrder[$bookSlug] = [];
        }
        // Use a very high number to place at end, or use 999
        if (!isset($chapterOrder[$bookSlug][$chapterSlug])) {
            $chapterOrder[$bookSlug][$chapterSlug] = 999;
        }
    }
    
    // Convert to JSON
    $jsonData = json_encode($chapterOrder, JSON_PRETTY_PRINT);
    
    // Save to file in public directory
    $filePath = __DIR__ . '/chapter-order.json';
    file_put_contents($filePath, $jsonData);
    
    // Also create a timestamp file to track last update
    file_put_contents(__DIR__ . '/chapter-order-timestamp.txt', time());
    
    echo "✅ chapter-order.json generated successfully!\n";
    echo "📊 Total books: " . count($chapterOrder) . "\n";
    echo "📁 File saved to: " . $filePath . "\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
