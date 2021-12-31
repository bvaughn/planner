import { useMemo } from "react";
import { getOwnerName } from "./utils/task";
import gitHubLogo from "./images/github.png";
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

  if (ownerNamesArray.length === 0) {
    return null;
  }

  return (
    <div className={styles.Legend}>
      <div className={styles.LogoContainer}>
        <a href="https://github.com/bvaughn/planner" target="_blank">
          <img className={styles.Logo} src={gitHubLogo} />
        </a>
      </div>
      <ul className={styles.List}>
        {ownerNamesArray.sort().map((name) => (
          <li key={name} className={styles.ListItem}>
            <span
              className={styles.Chip}
              style={{ backgroundColor: getColorForString(name) }}
            ></span>{" "}
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
