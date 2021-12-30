import { useMemo } from "react";
import styles from "./Legend.module.css";

export default function Legend({ colorMap, owners, tasks }) {
  const ownerNamesArray = useMemo(() => {
    const set = new Set();
    for (let key in owners) {
      const owner = owners[key];
      set.add(owner.name);
    }

    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      const owner = owners[task.owner];
      if (owner == null) {
        const ownerName = task.owner || "team";
        set.add(ownerName);
      }
    }

    return Array.from(set);
  }, [owners, tasks]);

  if (ownerNamesArray.length === 0) {
    return null;
  }

  return (
    <ul className={styles.List}>
      {ownerNamesArray.sort().map((name) => (
        <li key={name} className={styles.ListItem}>
          <span
            className={styles.Chip}
            style={{ backgroundColor: colorMap.get(name) }}
          ></span>{" "}
          {name}
        </li>
      ))}
    </ul>
  );
}
