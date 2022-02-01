import { useLayoutEffect, useMemo, useState } from "react";
import {
  getIntervalRange,
  getIntervalUnit,
  getEndOfDay,
  getStartOfDay,
  fromString,
} from "../utils/time";

// TODO Make sure the Preloader isn't over-rendering.
export default function Preloader({ children, tasks, team }) {
  const [ownerToImageMap, setOwnerToImageMap] = useState(() => new Map());

  // Precompute task metadata only when these values change.
  const metadata = useMemo(() => {
    // Pre-sort tasks based on the start date to simplify the subsequent sort.
    const sortedTasks = tasks.sort((a, b) => {
      if (a.start === b.start) {
        if (a.stop < b.stop) {
          return 1;
        } else if (a.stop > b.stop) {
          return -1;
        }
      } else if (a.start < b.start) {
        return -1;
      } else if (a.start > b.start) {
        return 1;
      }

      if (a.owner < b.owner) {
        return -1;
      } else if (a.owner > b.owner) {
        return 1;
      }

      return 0;
    });

    const dependenciesMap = new Map();
    const idToTaskMap = new Map();
    const rowsOfTasks = [];
    const taskToRowIndexMap = new Map();
    const taskToTemporalMap = new Map();

    // Stick more than one task on a row if there's room–
    // but leave room before tasks with dependencies so the arrow doesn't overlap.
    for (let taskIndex = 0; taskIndex < sortedTasks.length; taskIndex++) {
      const task = sortedTasks[taskIndex];

      const taskStart = fromString(task.start);
      const taskStop = fromString(task.stop, "23:59:59");
      taskToTemporalMap.set(task, { start: taskStart, stop: taskStop });

      let placed = false;

      if (task.dependency != null) {
        // If the task has a dependency, it belongs on the row beneath its parent
        // (or beneath another tasks dependent on the same task, if one comes first).
        // It's okay if other things are on that row but they have to be after it (so they don't overlap with the arrow).
        // Since we've pre-sorted, anything on the row already is before it, so it needs to shift down.
        for (let index = 0; index < rowsOfTasks.length; index++) {
          const rowOfTasks = rowsOfTasks[index];
          const match = rowOfTasks.find(({ id }) => id === task.dependency);
          if (match) {
            let matchIndex = index;

            // We've found the parent task; now find where in the stack of dependencies this task belongs.
            for (
              let peekIndex = index + 1;
              peekIndex < rowsOfTasks.length;
              peekIndex++
            ) {
              const firstTaskOnRow = rowsOfTasks[peekIndex][0];
              const firstTaskOnRowStart =
                taskToTemporalMap.get(firstTaskOnRow).start;

              if (
                firstTaskOnRow.dependency === task.dependency &&
                firstTaskOnRowStart.epochMilliseconds <
                  taskStop.epochMilliseconds
              ) {
                // maybe keep looking
                matchIndex = peekIndex;
              } else {
                break;
              }
            }

            const matchingRowOfTasks = rowsOfTasks[matchIndex];
            const firstTaskOnRow = matchingRowOfTasks[0];
            const firstTaskOnRowStart =
              taskToTemporalMap.get(firstTaskOnRow).start;

            // If the dependent task can fit on the next row, put it there.
            // Otherwise shift everything else down to make room.
            if (
              taskStop.epochMilliseconds < firstTaskOnRowStart.epochMilliseconds
            ) {
              matchingRowOfTasks.unshift(task);
            } else {
              rowsOfTasks.splice(matchIndex + 1, 0, [task]);
            }

            placed = true;
            break;
          }
        }
      } else {
        // If the task has no dependencies, put it on the highest/first row where there's sufficient room.
        for (let index = 0; index < rowsOfTasks.length; index++) {
          const rowOfTasks = rowsOfTasks[index];

          // We only need to check the last task on the row, because we've pre-sorted the array.
          const lastTaskOnRow = rowOfTasks[rowOfTasks.length - 1];
          const lastTaskOnRowStop = taskToTemporalMap.get(lastTaskOnRow).stop;
          if (
            taskStart.epochMilliseconds >= lastTaskOnRowStop.epochMilliseconds
          ) {
            rowOfTasks.push(task);

            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        rowsOfTasks.push([task]);
      }
    }

    // Populate the task-to-row Map now that the rows have been sorted.
    // Also map id-to-task so we can more easily draw arrows between dependencies later.
    rowsOfTasks.forEach((rowOfTasks, rowIndex) => {
      rowOfTasks.forEach((task) => {
        taskToRowIndexMap.set(task, rowIndex);

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
    });

    let unit = "day";
    let intervalRange = [];
    if (sortedTasks.length > 0) {
      const firstAndLastTasks = sortedTasks.reduce(
        (firstAndLastTasks, task) => {
          if (firstAndLastTasks.length === 0) {
            firstAndLastTasks.push(task);
            firstAndLastTasks.push(task);
          } else {
            if (task.start < firstAndLastTasks[0].start) {
              firstAndLastTasks[0] = task;
            }
            if (task.stop > firstAndLastTasks[1].stop) {
              firstAndLastTasks[1] = task;
            }
          }

          return firstAndLastTasks;
        },
        []
      );

      const minDate = getStartOfDay(
        taskToTemporalMap.get(firstAndLastTasks[0]).start
      );
      const maxDate = getEndOfDay(
        taskToTemporalMap.get(firstAndLastTasks[1]).stop
      );

      unit = getIntervalUnit(minDate, maxDate);
      intervalRange = getIntervalRange(minDate, maxDate);
    }

    return {
      dependenciesMap,
      intervalRange,
      maxRowIndex: rowsOfTasks.length,
      startDate: intervalRange[0],
      stopDate: intervalRange[intervalRange.length - 1],
      taskToRowIndexMap,
      taskToTemporalMap,
      tasks,
      taskDOMMetadata: new Map(),
      unit,
    };
  }, [tasks]);

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
      promises.push(preloadImage(ownerToImageMap, owner));
    }
  }

  await Promise.all(promises);

  callback(ownerToImageMap);
}

function preloadImage(ownerToImageMap, owner) {
  return new Promise((resolve) => {
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
  });
}
