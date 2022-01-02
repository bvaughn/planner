import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import Planner from "./Planner";
import CodeEditor from "./CodeEditor";
import Header from "./Header";
import { parseCode, stringifyObject } from "./utils/parsing";
import { team as initialOwners, tasks as initialTasks } from "./data";
import useURLData from "./hooks/useURLData";
import styles from "./App.module.css";

const defaultData = { tasks: initialTasks, team: initialOwners };

export default function App() {
  const [data, setData] = useURLData(defaultData);

  const { team, tasks } = data;

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
