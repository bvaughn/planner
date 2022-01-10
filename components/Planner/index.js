import { useMemo } from "react";
import Canvas from "./Canvas";
import ErrorBoundary from "./ErrorBoundary";
import Preloader from "./Preloader";
import * as defaultConfig from "./defaultConfig";

export default function Planner({ config, resetError, tasks, team, width }) {
  const memoizedConfig = useMemo(
    () => ({
      ...defaultConfig,
      ...config,
    }),
    [config]
  );
  return (
    <ErrorBoundary resetError={resetError} width={width}>
      <Preloader tasks={tasks} team={team}>
        {({ metadata, ownerToImageMap }) => (
          <Canvas
            config={memoizedConfig}
            metadata={metadata}
            team={team}
            ownerToImageMap={ownerToImageMap}
            tasks={tasks}
            width={width}
          />
        )}
      </Preloader>
    </ErrorBoundary>
  );
}
