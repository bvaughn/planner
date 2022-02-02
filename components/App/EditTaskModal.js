import { useRef, useState } from "react";
import useModalDismissSignal from "./useModalDismissSignal";
import styles from "./EditTaskModal.module.css";

export default function EditTaskModal({
  dismissModal,
  saveTask,
  task,
  tasks,
  team,
}) {
  const ref = useRef(null);

  const [clonedTask, setClonedTask] = useState(task);

  useModalDismissSignal(ref, dismissModal);

  const submitForm = () => {
    // Simple validation
    if (!clonedTask.name || !clonedTask.start || !clonedTask.stop) {
      return; // TODO Show validation error
    } else if (clonedTask.stop < clonedTask.start) {
      return; // TODO Show validation error
    } else if (clonedTask.dependency) {
      const dependency = tasks.find(
        (task) => task.id === clonedTask.dependency
      );
      if (clonedTask.start < dependency.start) {
        return; // TODO Show validation error
      }
    }

    saveTask(clonedTask);
  };

  const saveDependency = (event) => {
    const target = event.target;

    let dependency = target.value;
    if (dependency) {
      if (tasks.find((task) => task.id === parseInt(dependency))) {
        dependency = parseInt(dependency);
      }
    }

    setClonedTask({
      ...clonedTask,
      dependency,
    });
  };

  const handleChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    setClonedTask({
      ...clonedTask,
      [name]: value,
    });
  };

  return (
    <div className={styles.Background}>
      <div ref={ref} className={styles.Dialog}>
        <div className={styles.HeaderRow}>Add task</div>

        <div className={styles.LabelColumn}>Name</div>
        <div className={styles.InputColumn}>
          <input
            data-testname="Input-TaskName"
            name="name"
            className={styles.Input}
            type="text"
            placeholder="Task name"
            onChange={handleChange}
            value={clonedTask.name}
          />
        </div>

        <div className={styles.LabelColumn}>Owner</div>
        <div className={styles.InputColumn}>
          <select
            data-testname="Input-TaskOwner"
            className={styles.Select}
            disabled={Array.from(Object.keys(team)).length === 0}
            name="owner"
            onChange={handleChange}
          >
            <option value={clonedTask.owner} onChange={handleChange}></option>
            {Array.from(Object.entries(team)).map(([key, owner]) => (
              <option key={key} value={key}>
                {owner.name || key}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.LabelColumn}>Dates</div>
        <div className={styles.InputLeftColumn}>
          <input
            className={styles.DateInput}
            data-testname="Input-TaskStartDate"
            name="start"
            type="date"
            value={clonedTask.start}
            onChange={handleChange}
          />
        </div>
        <div className={styles.InputRightColumn}>
          <input
            className={styles.DateInput}
            data-testname="Input-TaskStopDate"
            name="stop"
            type="date"
            value={clonedTask.stop}
            onChange={handleChange}
          />
        </div>

        <div className={styles.LabelColumn}>Ongoing?</div>
        <div className={styles.InputColumn}>
          <input
            data-testname="Input-TaskOngoing"
            name="isOngoing"
            type="checkbox"
            onChange={handleChange}
            checked={clonedTask.isOngoing === true}
          />
        </div>

        <div className={styles.LabelColumn}>Dependency on</div>
        <div className={styles.InputColumn}>
          <select
            className={styles.Select}
            data-testname="Input-TaskDependency"
            disabled={tasks.length === 0}
            name="dependency"
            value={clonedTask.dependency}
            onChange={saveDependency}
          >
            <option value={null}></option>
            {tasks
              .filter((task) => task.id != null && task.id != clonedTask.id)
              .map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
          </select>
        </div>

        <div className={styles.FooterRow}>
          <button
            data-testname="Input-TaskCancelButton"
            className={styles.CancelButton}
            onClick={dismissModal}
          >
            Cancel
          </button>
          <span className={styles.Spacer} />
          <button
            data-testname="Input-TaskSaveButton"
            className={styles.SaveButton}
            onClick={submitForm}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
