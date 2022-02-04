import AppComponent from "../components/App";
import OgMeta from "../components/OgMeta";

export default function App({ maxHeight, ogUrl, ogImageUrl }) {
  return (
    <>
      <OgMeta url={ogUrl} imageUrl={ogImageUrl} />
      <AppComponent maxHeight={maxHeight} />
    </>
  );
}

export async function getServerSideProps({ query, resolvedUrl }) {
  let ogImageUrl = null;
  if (query.data) {
    ogImageUrl = `/api/ogimage?data=${query.data}`;
  }

  let maxHeight = null;
  if (query.maxHeight) {
    maxHeight = query.maxHeight;
  }

  return {
    props: {
      maxHeight,
      ogUrl: resolvedUrl,
      ogImageUrl,
    },
  };
}
