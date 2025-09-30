import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnects for webfonts */}
        
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Add resource hints */}
        <link rel="dns-prefetch" href="/api" />
        
        {/* Add meta description for SEO */}
        <meta
          name="description"
          content="Generate interactive quizzes instantly from any text to boost your learning with genText AI."
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
