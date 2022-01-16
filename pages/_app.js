import Head from "next/head";
import "./root.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Planner JS</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
