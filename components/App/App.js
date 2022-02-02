import { useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import Planner from "../Planner";
import CodeEditor from "./CodeEditor";
import Header from "./Header";
import { parseCode, stringifyObject } from "../utils/parsing";
import { getNextID } from "../utils/task";
import { fromString, subtract } from "../utils/time";
import { team as initialOwners, tasks as initialTasks } from "./data";
import useURLData from "../hooks/useURLData";
import EditTaskModal from "./EditTaskModal";
import * as defaultConfig from "../Planner/defaultConfig";
import styles from "./App.module.css";

const NEW_TASK = {
  start: "",
  stop: "",
  name: "",
  owner: "",
  isOngoing: false,
  dependency: undefined,
};

const defaultData = { tasks: initialTasks, team: initialOwners };

export default function App() {
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [data, setData] = useURLData(defaultData);

  const { team, tasks } = data;

  migrateLegacyTasks(tasks);

  const teamString = useMemo(() => stringifyObject(data.team), [data.team]);
  const tasksString = useMemo(() => stringifyObject(data.tasks), [data.tasks]);

  const showNewTaskModal = () => {
    setTaskToEdit(NEW_TASK);
  };

  const dismissModal = () => setTaskToEdit(null);

  const saveTask = (updatedTask) => {
    const clonedTasks = [...tasks];

    if (updatedTask.id == null || updatedTask.id === "") {
      updatedTask.id = getNextID(clonedTasks);
    }

    if (updatedTask.isOngoing === false) {
      delete updatedTask.isOngoing;
    }

    const taskIndex = clonedTasks.indexOf(taskToEdit);
    if (taskIndex >= 0) {
      clonedTasks.splice(taskIndex, 1, updatedTask);
    } else {
      clonedTasks.push(updatedTask);
    }

    setData({ ...data, tasks: clonedTasks });

    setTaskToEdit(null);
  };

  const handleOwnersChange = (newString) => {
    try {
      const newOwners = parseCode(newString);
      if (newOwners != null) {
        setData({ ...data, team: newOwners });
      }
    } catch (error) {
      // Parsing errors are fine; they're expected while typing.
      console.error(error);
    }
  };

  const handleTasksChange = (newString) => {
    try {
      const newTasks = parseCode(newString);
      if (newTasks != null && Array.isArray(newTasks)) {
        let nextID = getNextID(newTasks);

        // Remove empty tasks (e.g. ",," in task string).
        // Make sure all tasks have ids.
        newTasks = newTasks
          .filter((task) => task != null)
          .map((task) => {
            if (task.id == null || task.id === "") {
              task = {
                ...task,
                id: nextID,
              };
              nextID++;
            }
            return task;
          });

        setData({ ...data, tasks: newTasks });
      }
    } catch (error) {
      // Parsing errors are fine; they're expected while typing.
      console.error(error);
    }
  };

  const editTask = (task) => {
    setTaskToEdit(task);
  };

  const removeTask = (targetTask) => {
    setData({
      ...data,
      tasks: tasks.filter((task) => task !== targetTask),
    });
  };

  const resetError = () => {
    setData(defaultData);
  };

  return (
    <>
      <div className={styles.App}>
        <Header
          avatarSize={defaultConfig.AVATAR_SIZE}
          cornerRadius={defaultConfig.CORNER_RADIUS}
          padding={defaultConfig.PADDING}
          showNewTaskModal={showNewTaskModal}
          team={team}
          tasks={tasks}
        />

        <div className={styles.ChartContainer}>
          <AutoSizer disableHeight>
            {({ width }) => (
              <Planner
                config={defaultConfig}
                editTask={editTask}
                removeTask={removeTask}
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

      {taskToEdit != null && (
        <EditTaskModal
          dismissModal={dismissModal}
          saveTask={saveTask}
          task={taskToEdit}
          tasks={tasks}
          team={team}
        />
      )}
    </>
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
