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
  const [pendingOwnerName, setPendingOwnerName] = useState(null);
  const [pendingOwnerID, setPendingOwnerID] = useState(null);

  useModalDismissSignal(ref, dismissModal, false);

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

  const handlePendingOwnerInputChange = (event) => {
    setPendingOwnerName(event.target.value || null);
    setPendingOwnerID(null);
  };
  const handlePendingOwnerSelectChange = (event) => {
    setPendingOwnerID(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      addPendingOwner();
    }
  };

  const addPendingOwner = () => {
    const pendingOwner = pendingOwnerName || pendingOwnerID;

    if (!clonedTask.owner) {
      setClonedTask({
        ...clonedTask,
        owner: pendingOwner,
      });
    } else if (Array.isArray(clonedTask.owner)) {
      setClonedTask({
        ...clonedTask,
        owner: [...clonedTask.owner, pendingOwner],
      });
    } else {
      setClonedTask({
        ...clonedTask,
        owner: [clonedTask.owner, pendingOwner],
      });
    }

    setPendingOwnerName(null);
    setPendingOwnerID(null);
  };

  const removeOwner = (owner) => {
    if (Array.isArray(clonedTask.owner)) {
      const clonedOwners = [...clonedTask.owner];
      clonedOwners.splice(clonedOwners.indexOf(owner), 1);
      setClonedTask({
        ...clonedTask,
        owner: clonedOwners.length === 1 ? clonedOwners[0] : clonedOwners,
      });
    } else {
      setClonedTask({
        ...clonedTask,
        owner: null,
      });
    }
  };

  const ownersArray = Array.isArray(clonedTask.owner)
    ? clonedTask.owner
    : clonedTask.owner
    ? [clonedTask.owner]
    : [];

  const potentialNewOwnersArray = [];
  for (const [key, owner] of Object.entries(team)) {
    if (!ownersArray.includes(key)) {
      potentialNewOwnersArray.push([key, owner]);
    }
  }

  return (
    <div data-testname="EditTaskModal" className={styles.Background}>
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
            value={clonedTask.name || ""}
          />
        </div>

        <div className={styles.LabelColumn}>Owner(s)</div>
        <div className={styles.InputColumn}>
          {ownersArray.map((owner, index) => (
            <div key={index} className={styles.OwnerRow}>
              {owner}
              <button
                data-testname={`Button-RemoveOwner-${owner}`}
                className={styles.AddOwnerButton}
                onClick={() => removeOwner(owner)}
              >
                <RemoveIcon />
              </button>
            </div>
          ))}

          <div className={styles.OwnerRow}>
            <select
              data-testname="Select-PendingOwner"
              className={styles.Select}
              disabled={
                pendingOwnerName || potentialNewOwnersArray.length === 0
              }
              onChange={handlePendingOwnerSelectChange}
              onKeyPress={handleKeyPress}
              value={pendingOwnerID || ""}
            >
              <option value="" onChange={handleChange}></option>
              {potentialNewOwnersArray.map(([key, owner]) => (
                <option key={key} value={key}>
                  {owner.name || key}
                </option>
              ))}
            </select>
            <span className={styles.BigSpacer} />
            or
            <span className={styles.BigSpacer} />
            <input
              data-testname="Input-PendingOwner"
              className={styles.Input}
              type="text"
              placeholder="Owner name"
              onChange={handlePendingOwnerInputChange}
              onKeyPress={handleKeyPress}
              value={pendingOwnerName || ""}
            />
            <button
              data-testname="Button-AddPendingOwner"
              className={styles.AddOwnerButton}
              disabled={!pendingOwnerID && !pendingOwnerName}
              onClick={addPendingOwner}
            >
              <AddIcon />
            </button>
          </div>
        </div>

        <div className={styles.LabelColumn}>Dates</div>
        <div className={styles.InputLeftColumn}>
          <input
            className={styles.DateInput}
            data-testname="Input-TaskStartDate"
            name="start"
            type="date"
            value={clonedTask.start || ""}
            onChange={handleChange}
          />
        </div>
        <div className={styles.InputRightColumn}>
          <input
            className={styles.DateInput}
            data-testname="Input-TaskStopDate"
            name="stop"
            type="date"
            value={clonedTask.stop || ""}
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

        <div className={styles.LabelColumn}>Dependent on</div>
        <div className={styles.InputColumn}>
          <select
            className={styles.Select}
            data-testname="Select-TaskDependency"
            disabled={tasks.length === 0}
            name="dependency"
            value={clonedTask.dependency || ""}
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
            data-testname="Button-TaskCancelButton"
            className={styles.CancelButton}
            onClick={dismissModal}
          >
            <CancelIcon /> Cancel
          </button>
          <span className={styles.Spacer} />
          <button
            data-testname="Button-TaskSaveButton"
            className={styles.SaveButton}
            onClick={submitForm}
          >
            <SaveIcon /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// https://materialdesignicons.com/
const AddIcon = () => (
  <svg className={styles.AddIcon} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M17,13H13V17H11V13H7V11H11V7H13V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
    />
  </svg>
);

// https://materialdesignicons.com/
const CancelIcon = () => (
  <svg className={styles.CancelIcon} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C10.1 4 8.4 4.6 7.1 5.7L18.3 16.9C19.3 15.5 20 13.8 20 12C20 7.6 16.4 4 12 4M16.9 18.3L5.7 7.1C4.6 8.4 4 10.1 4 12C4 16.4 7.6 20 12 20C13.9 20 15.6 19.4 16.9 18.3Z"
    />
  </svg>
);

// https://materialdesignicons.com/
const SaveIcon = () => (
  <svg className={styles.SaveIcon} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"
    />
  </svg>
);

// https://materialdesignicons.com/
const RemoveIcon = () => (
  <svg className={styles.RemoveIcon} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"
    />
  </svg>
);
