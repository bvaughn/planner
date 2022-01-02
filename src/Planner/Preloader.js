import { useLayoutEffect, useMemo, useState } from "react";

export default function Preloader({ children, tasks, team }) {
  const [ownerToImageMap, setOwnerToImageMap] = useState(() => new Map());

  // Precompute task and team metadata only when these values change.
  const metadata = useMemo(() => {
    const taskToRowIndexMap = new Map();
    const rows = [];

    const dependenciesMap = new Map();
    const idToTaskMap = new Map();

    // Pre-sort dependencies to always follow parent tasks,
    // and oder them by (start) month index (lowest to highest).
    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      if (task.dependency != null) {
        let currentIndex = taskIndex - 1;
        while (currentIndex >= 0) {
          const currentTask = tasks[currentIndex];
          let move = false;
          if (currentTask.id === task.dependency) {
            move = true;
          } else if (currentTask.dependency === task.dependency) {
            if (task.start > currentTask.start) {
              move = true;
            } else if (task.start === currentTask.start) {
              if (task.duration < currentTask.duration) {
                move = true;
              } else if (!task.isOngoing && currentTask.isOngoing) {
                move = true;
              }
            }
          }

          if (move) {
            tasks.splice(taskIndex, 1);
            tasks.splice(currentIndex + 1, 0, task);
            break;
          } else {
            currentIndex--;
          }
        }
      }
    }

    tasks.forEach((task) => {
      let nextAvailableRowIndex = -1;
      if (task.dependency == null) {
        nextAvailableRowIndex = rows.findIndex((rowTasks, rowIndex) => {
          let match = true;
          for (
            let rowTaskIndex = 0;
            rowTaskIndex < rowTasks.length;
            rowTaskIndex++
          ) {
            const rowTask = rowTasks[rowTaskIndex];
            if (rowTask.isOngoing) {
              match = false;
              break;
            }
            if (rowTask.dependency != null) {
              match = false;
              break;
            }
            if (
              !(
                task.start + task.duration <= rowTask.start ||
                task.start >= rowTask.start + rowTask.duration
              )
            ) {
              match = false;
              break;
            }
          }
          return match;
        });
      }

      const rowIndex =
        nextAvailableRowIndex >= 0 ? nextAvailableRowIndex : rows.length;
      if (rows[rowIndex] == null) {
        rows[rowIndex] = [task];
      } else {
        rows[rowIndex].push(task);
      }

      taskToRowIndexMap.set(task, rowIndex);

      // Collect dependencies for later.
      idToTaskMap.set(task.id, task);
      if (task.dependency != null) {
        const dependencyId = task.dependency;
        const dependency = idToTaskMap.get(dependencyId);

        if (dependency == null) {
          console.warn(
            `Invalid dependenc; no parent task found with id ${dependencyId}`
          );
        } else {
          if (!dependenciesMap.has(dependency)) {
            dependenciesMap.set(dependency, []);
          }
          dependenciesMap.get(dependency).push(idToTaskMap.get(task.id));
        }
      }
    });

    return {
      dependenciesMap,
      maxRowIndex: rows.length,
      ownerToImageMap,
      taskToRowIndexMap,
      tasks,
      team,
      textDOMRects: new Map(),
    };
  }, [ownerToImageMap, tasks, team]);

  // Pre-load images so we can draw avatars to the Canvas.
  useLayoutEffect(() => {
    preloadImages(team, (map) => {
      // Now that all images have been pre-loaded, re-render and draw them to the Canvas.
      setOwnerToImageMap(map);
    });
  }, [team]);

  return children({ metadata, ownerToImageMap });
}

async function preloadImages(team, callback) {
  const ownerToImageMap = new Map();
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

  callback(ownerToImageMap);
}
