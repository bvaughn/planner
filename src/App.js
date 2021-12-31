import { useLayoutEffect, useMemo, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import CanvasChart from "./CanvasChart";
import CodeEditor from "./CodeEditor";
import Legend from "./Legend";
import { getColorForString } from "./utils/color";
import { parseCode, stringifyObject } from "./utils/parsing";
import { getOwnerName } from "./utils/task";
import { owners as initialOwners, tasks as initialTasks } from "./tasks";
import { useURLData } from "./hooks";
import styles from "./App.module.css";

export default function App() {
  const [preloadCounter, setPreloadCounter] = useState(false);

  const [data, setData] = useURLData(
    { tasks: initialTasks, owners: initialOwners },
    (newData) => {
      return newData.owners != null && Array.isArray(newData.tasks);
    }
  );

  const { owners, tasks } = data;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ownerToImageMap = useMemo(() => new Map(), [owners]);

  const ownersString = useMemo(
    () => stringifyObject(data.owners),
    [data.owners]
  );
  const tasksString = useMemo(() => stringifyObject(data.tasks), [data.tasks]);

  const handleOwnersChange = (newString) => {
    try {
      setData({ ...data, owners: parseCode(newString) });
    } catch (error) {
      // Parsing errors are fine; they're expected while typing.
    }
  };

  const handleTasksChange = (newString) => {
    try {
      setData({ ...data, tasks: parseCode(newString) });
    } catch (error) {
      // Parsing errors are fine; they're expected while typing.
    }
  };

  // Pre-load images so we can draw avatars to the Canvas.
  useLayoutEffect(() => {
    preloadImages(owners, ownerToImageMap, () => {
      setPreloadCounter((value) => value + 1);
    });
  }, [owners, ownerToImageMap]);

  return (
    <div className={styles.App}>
      <Legend owners={owners} tasks={tasks} />

      <div className={styles.ChartContainer}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <CanvasChart
              owners={owners}
              ownerToImageMap={ownerToImageMap}
              preloadCounter={preloadCounter}
              tasks={tasks}
              width={width}
            />
          )}
        </AutoSizer>
      </div>

      <div className={styles.CodeContainer}>
        <div className={styles.CodeColumnLeft}>
          <div className={styles.CodeHeader}>Tasks</div>
          <CodeEditor code={tasksString} onChange={handleTasksChange} />
        </div>
        <div className={styles.CodeColumnRight}>
          <div className={styles.CodeHeader}>Team</div>
          <CodeEditor code={ownersString} onChange={handleOwnersChange} />
        </div>
      </div>
    </div>
  );
}

async function preloadImages(owners, ownerToImageMap, callback) {
  const promises = [];

  for (let key in owners) {
    const owner = owners[key];

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
