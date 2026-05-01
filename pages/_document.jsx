import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
        <meta name="theme-color" content="#0F0E0C"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <link rel="icon" href="/favicon.ico" sizes="any"/>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
        <link rel="apple-touch-icon" href="/favicon-16.png"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      </Head>
      <body>
        <Main/>
        <NextScript/>
      </body>
    </Html>
  );
}
