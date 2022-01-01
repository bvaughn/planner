import { useMemo } from "react";
import { getOwnerName } from "./utils/task";
import { getColorForString } from "./utils/color";
import styles from "./Legend.module.css";

export default function Legend({ team, tasks }) {
  const [namesArray, nameToAvatarMap] = useMemo(() => {
    const map = new Map();
    const set = new Set();

    for (let key in team) {
      const owner = team[key];
      const name = owner.name?.toLowerCase();

      if (name) {
        set.add(name);
        if (owner.avatar) {
          map.set(name, owner.avatar);
        }
      }
    }

    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      const owner = team[task.owner];
      if (owner == null) {
        const ownerName = getOwnerName(task, team);
        set.add(ownerName);
      }
    }

    return [Array.from(set), map];
  }, [team, tasks]);

  return (
    <ul className={styles.List} data-testname="Legend-list">
      {namesArray.sort().map((name) => {
        const avatar = nameToAvatarMap.get(name);
        return (
          <li key={name} className={styles.ListItem}>
            <span
              className={styles.ColorChip}
              style={{ backgroundColor: getColorForString(name) }}
            >
              {avatar && (
                <img className={styles.AvatarImage} src={avatar} alt="Avatar" />
              )}
            </span>{" "}
            <span className={styles.ItemName}>{name}</span>
          </li>
        );
      })}
    </ul>
  );
}
