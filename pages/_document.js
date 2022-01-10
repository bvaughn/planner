import Document, { Html, Head, Main, NextScript } from "next/document";

const NEXT_PUBLIC_VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL;
const HOST = process.env.NODE_ENV === "development" ? "http:" : "https";
const URL = `${HOST}://${NEXT_PUBLIC_VERCEL_URL}`;

export default function CustomDocument() {
  return (
    <Html>
      <Head>
        <meta name="title" content="Planner JS" />
        <meta
          name="description"
          content="Lightweight, interactive planner. Visualize tasks using an HTML canvas."
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={URL} />
        <meta property="og:title" content="Planner JS" />
        <meta
          property="og:description"
          content="Lightweight, interactive planner. Visualize tasks using an HTML canvas."
        />
        <meta property="og:image" content={`${URL}/static/og-image.png`} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`${URL}`} />
        <meta property="twitter:title" content="Planner JS" />
        <meta
          property="twitter:description"
          content="Lightweight, interactive planner. Visualize tasks using an HTML canvas."
        />
        <meta property="twitter:image" content={`${URL}/static/og-image.png`} />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${URL}/static/apple-touch-icon.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${URL}/static/favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${URL}/static/favicon-16x16.png`}
        />

        <link rel="icon" href={`${URL}/static/favicon.ico`} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
