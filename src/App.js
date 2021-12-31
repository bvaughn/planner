import { useLayoutEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import AutoSizer from "react-virtualized-auto-sizer";
import CanvasChart from "./CanvasChart";
import CodeEditor from "./CodeEditor";
import Header from "./Header";
import { parseCode, stringifyObject } from "./utils/parsing";
import { team as initialOwners, tasks as initialTasks } from "./tasks";
import useURLData from "./hooks/useURLData";
import styles from "./App.module.css";

const defaultData = { tasks: initialTasks, team: initialOwners };

export default function App() {
  const [preloadCounter, setPreloadCounter] = useState(false);

  const [data, setData] = useURLData(defaultData);

  const { team, tasks } = data;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ownerToImageMap = useMemo(() => new Map(), [team]);

  const teamString = useMemo(() => stringifyObject(data.team), [data.team]);
  const tasksString = useMemo(() => stringifyObject(data.tasks), [data.tasks]);

  const handleOwnersChange = (newString) => {
    try {
      const newOwners = parseCode(newString);
      if (newOwners != null) {
        setData({ ...data, team: newOwners });
      }
    } catch (error) {
      // Parsing errors are fine; they're expected while typing.
    }
  };

  const handleTasksChange = (newString) => {
    try {
      const newTasks = parseCode(newString);
      if (newTasks != null && Array.isArray(newTasks)) {
        setData({ ...data, tasks: newTasks });
      }
    } catch (error) {
      // Parsing errors are fine; they're expected while typing.
    }
  };

  // Pre-load images so we can draw avatars to the Canvas.
  useLayoutEffect(() => {
    preloadImages(team, ownerToImageMap, () => {
      // Now that all images have been pre-loaded, re-render and draw them to the Canvas.
      // Incrementing this counter just lets React know we want to re-render.
      // The specific count value has no significance.
      setPreloadCounter((value) => value + 1);
    });
  }, [team, ownerToImageMap]);

  const resetError = () => {
    setData(defaultData);
  };

  return (
    <div className={styles.App}>
      <Header team={team} tasks={tasks} />

      <div className={styles.ChartContainer}>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={resetError}>
          <AutoSizer disableHeight>
            {({ width }) => (
              <CanvasChart
                team={team}
                ownerToImageMap={ownerToImageMap}
                preloadCounter={preloadCounter}
                tasks={tasks}
                width={width}
              />
            )}
          </AutoSizer>
        </ErrorBoundary>
      </div>

      <div className={styles.CodeContainer}>
        <div className={styles.CodeColumnLeft}>
          <div className={styles.CodeHeader}>Tasks</div>
          <CodeEditor
            code={tasksString}
            onChange={handleTasksChange}
            testName="tasks"
          />
        </div>
        <div className={styles.CodeColumnRight}>
          <div className={styles.CodeHeader}>Team</div>
          <CodeEditor
            code={teamString}
            onChange={handleOwnersChange}
            testName="team"
          />
        </div>
      </div>
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <>
      <div className={styles.ErrorHeader}>Something went wrong:</div>
      <pre className={styles.ErrorMessage}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </>
  );
}

async function preloadImages(team, ownerToImageMap, callback) {
  const promises = [];

  for (let key in team) {
    const owner = team[key];

    if (owner?.avatar != null && typeof owner?.avatar === "string") {
      promises.push(
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => {
            ownerToImageMap.set(owner, {
              height: image.naturalHeight,
              image,
              width: image.naturalWidth,
            });

            resolve();
          };
          image.src = owner.avatar;
        })
      );
    }
  }

  await Promise.all(promises);

  callback();
}
