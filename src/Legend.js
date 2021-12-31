import { useMemo } from "react";
import { getOwnerName } from "./utils/task";
import { getColorForString } from "./utils/color";
import styles from "./Legend.module.css";

export default function Legend({ owners, tasks }) {
  const ownerNamesArray = useMemo(() => {
    const set = new Set();
    for (let key in owners) {
      const owner = owners[key];
      if (owner.name) {
        set.add(owner.name.toLowerCase());
      }
    }

    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      const owner = owners[task.owner];
      if (owner == null) {
        const ownerName = getOwnerName(task, owners);
        set.add(ownerName);
      }
    }

    return Array.from(set);
  }, [owners, tasks]);

  return (
    <ul className={styles.List}>
      {ownerNamesArray.sort().map((name) => (
        <li key={name} className={styles.ListItem}>
          <span
            className={styles.Chip}
            style={{ backgroundColor: getColorForString(name) }}
          ></span>{" "}
          <span className={styles.ItemName}>{name}</span>
        </li>
      ))}
    </ul>
  );
}
