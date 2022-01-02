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
        setData({ ...data, tasks: newTasks });
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
