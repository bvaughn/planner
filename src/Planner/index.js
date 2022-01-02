import Canvas from "./Canvas";
import ErrorBoundary from "./ErrorBoundary";
import Preloader from "./Preloader";

export default function Planner({ resetError, tasks, team, width }) {
  return (
    <ErrorBoundary resetError={resetError}>
      <Preloader tasks={tasks} team={team}>
        {({ metadata, ownerToImageMap }) => (
          <Canvas
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
