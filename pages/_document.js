import Document, { Html, Head, Main, NextScript } from "next/document";
import { getBaseURL } from "../components/utils/url";
import { useRouter } from "next/router";

const baseURL = getBaseURL();
const defaultOgImageUrl = `${baseURL}/static/og-image.png`;

export default function CustomDocument({
  ogImageUrl = defaultOgImageUrl,
  ogUrl = baseURL,
}) {
  return (
    <Html>
      <Head>
        <meta name="title" content="Planner JS" />
        <meta
          name="description"
          content="Lightweight, interactive planner. Visualize tasks using an HTML canvas."
        />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${baseURL}/static/apple-touch-icon.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${baseURL}/static/favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${baseURL}/static/favicon-16x16.png`}
        />

        <link rel="icon" href={`${baseURL}/static/favicon.ico`} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:title" content="Planner JS" />
        <meta
          property="og:description"
          content="Lightweight, interactive planner. Visualize tasks using an HTML canvas."
        />
        <meta property="og:image" content={ogImageUrl} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`${ogUrl}`} />
        <meta property="twitter:title" content="Planner JS" />
        <meta
          property="twitter:description"
          content="Lightweight, interactive planner. Visualize tasks using an HTML canvas."
        />
        <meta property="twitter:image" content={ogImageUrl} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// Default OG meta tag values during server rendering.
// Many websites like Facebook and Twitter don't wait for JavaScript.
CustomDocument.getInitialProps = async (context) => {
  const initialProps = await Document.getInitialProps(context);

  const { query } = context;

  let ogUrl = null;
  let ogImageUrl = null;
  if (query.data) {
    ogUrl = `${baseURL}/?data=${query.data}`;
    ogImageUrl = `${baseURL}/api/ogimage?data=${query.data}`;
  }

  return { ...initialProps, ogImageUrl, ogUrl };
};
