import AppComponent from "../components/App";

export default function App() {
  return <AppComponent />;
}

export async function getServerSideProps() {
  // Opt this route out of static pre-rendering so we can set dynamic OG meta tags on the server side.
  return { props: {} };
}
