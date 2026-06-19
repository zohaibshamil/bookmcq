import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;600;700&display=swap" rel="stylesheet" />
        <link rel="canonical" href="https://bookmcq.com/" />
        <meta name="theme-color" content="#7c3aed" />
        
        {/* SEO Meta Tags */}
        <meta name="description" content="Practice One Paper MCQs for government jobs, private jobs, and competitive exams worldwide. Subject-wise, topic-wise, and difficulty-based questions from hundreds of books." />
        <meta name="keywords" content="One Paper MCQ, government job preparation, private job test, competitive exam preparation, CSS MCQs, PMS MCQs, UPSC MCQs, FPSC MCQs, PPSC MCQs" />
        <meta name="author" content="BookMCQ" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="BookMCQ - One Paper MCQ | Govt & Private Job Preparation" />
        <meta property="og:description" content="Practice subject-wise MCQs for government jobs, private jobs, and competitive exams worldwide." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bookmcq.com" />
        <meta property="og:site_name" content="BookMCQ" />
      </Head>
      <body className="disable-select">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
