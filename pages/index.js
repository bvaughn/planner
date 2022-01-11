import AppComponent from "../components/App";
import OgMeta from "../components/OgMeta";

export default function App({ ogUrl, ogImageUrl }) {
  return (
    <>
      <OgMeta url={ogUrl} imageUrl={ogImageUrl} />
      <AppComponent />
    </>
  );
}

export async function getServerSideProps({ query, resolvedUrl }) {
  let ogImageUrl = null;
  if (query.data) {
    ogImageUrl = `/api/ogimage?data=${query.data}`;
  }

  return {
    props: {
      ogUrl: resolvedUrl,
      ogImageUrl,
    },
  };
}
