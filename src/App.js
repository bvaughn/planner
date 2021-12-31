import { useLayoutEffect, useMemo, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import CanvasChart from "./CanvasChart";
import CodeEditor from "./CodeEditor";
import Legend from "./Legend";
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

  // Generate unique colors for each owner to mark their tasks.
  const colorMap = useMemo(() => {
    const map = new Map();

    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      const ownerName = getOwnerName(task, owners);

      const color = getColor(ownerName);

      map.set(ownerName, color);
    }

    return map;
  }, [owners, tasks]);

  return (
    <div className={styles.App}>
      <Legend colorMap={colorMap} owners={owners} tasks={tasks} />

      <div className={styles.ChartContainer}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <CanvasChart
              colorMap={colorMap}
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

// TODO Can I generate colors rather than hard-coding a list?

let colorIndex = 0;
const colors = [
  "#363852",
  "#726D81",
  "#B29DA0",
  "#DECBC6",
  "#4A4E69",
  "#9A8C98",
  "#C9ADA7",
  "#22223B",
  "#F2E9E4",
];
const takenColorMap = new Map();

function getColor(stringInput) {
  stringInput = stringInput.toLowerCase();

  if (!takenColorMap.has(stringInput)) {
    const color = colors[colorIndex % colors.length];
    colorIndex++;

    takenColorMap.set(stringInput, color);
  }
  return takenColorMap.get(stringInput);
}
