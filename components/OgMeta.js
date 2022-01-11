import Head from "next/head";

import { getBaseURL } from "./utils/url";

export default function OgMeta({
  url,
  imageUrl = "/og-image.png",
  title = "Planner JS",
  description = "Lightweight, interactive planner. Visualize tasks using an HTML canvas.",
}) {
  const baseUrl = getBaseURL();

  return (
    <Head>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${baseUrl}${url}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${baseUrl}${imageUrl}`} />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={`{baseURL}${url}`} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${baseUrl}${imageUrl}`} />
    </Head>
  );
}
