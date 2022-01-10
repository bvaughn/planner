import Loading from "./Loading";
import dynamic from "next/dynamic";

const DynamicComponentWithNoSSR = dynamic(
  import("./App")
    .then((Component) => Component)
    .catch((err) => console.log(err)),
  {
    loading: () => <Loading />,
    ssr: false,
  }
);

export default function PlannerComponentWrapper(props) {
  return <DynamicComponentWithNoSSR {...props} />;
}
