import { useMemo } from "react";
import ReactDOM from "react-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import Planner from "../Planner";
import CodeEditor from "./CodeEditor";
import Header from "./Header";
import { parseCode, stringifyObject } from "../utils/parsing";
import { fromString, subtract } from "../utils/time";
import { team as initialOwners, tasks as initialTasks } from "./data";
import useURLData from "../hooks/useURLData";
import styles from "./App.module.css";

const defaultData = { tasks: initialTasks, team: initialOwners };

export default function App() {
  const [data, setData] = useURLData(defaultData);

  const { team, tasks } = data;

  migrateLegacyTasks(tasks);

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
        // Remove empty tasks (e.g. ",," in task string).
        const filteredTasks = newTasks.filter((task) => task != null);

        setData({ ...data, tasks: filteredTasks });
      }
    } catch (error) {
      // Parsing errors are fine; they're expected while typing.
    }
  };

  const resetError = () => {
    setData(defaultData);
  };

  return (
    <div className={styles.App}>
      <Header team={team} tasks={tasks} />

      <div className={styles.ChartContainer}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <Planner
              resetError={resetError}
              tasks={tasks}
              team={team}
              width={width}
            />
          )}
        </AutoSizer>
      </div>

      <div className={styles.CodeContainer}>
        <div className={styles.CodeColumnLeft}>
          <CodeEditor
            code={tasksString}
            label="Tasks"
            onChange={handleTasksChange}
            testName="tasks"
          />
        </div>
        <div className={styles.CodeColumnRight}>
          <CodeEditor
            code={teamString}
            label="Team"
            onChange={handleOwnersChange}
            testName="team"
          />
        </div>
      </div>
    </div>
  );
}

function migrateLegacyTasks(tasks) {
  // Check for previous data format and update in place.
  for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
    const task = tasks[taskIndex];
    if (task.hasOwnProperty("duration")) {
      const startString = monthIndexToDateString(task.start);
      const stopString = monthIndexToDateString(task.start + task.duration);

      delete task.duration;

      task.start = startString;
      task.stop = subtract(fromString(stopString), 1).toString().substr(0, 10);
    }
  }
}

function monthIndexToDateString(index) {
  let day;
  switch (index % 1) {
    case 0.25:
      day = "07";
      break;
    case 0.5:
      day = "15";
      break;
    case 0.75:
      day = "21";
      break;
    default:
      day = "01";
      break;
  }

  let month = Math.floor(index) + 1;
  if (month < 10) {
    month = `0${month}`;
  }

  return `2022-${month}-${day}`;
}
