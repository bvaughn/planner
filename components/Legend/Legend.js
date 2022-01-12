/* eslint-disable @next/next/no-img-element */

import { useMemo } from "react";
import {
  BLACK,
  WHITE,
  getColorForString,
  getContrastRatio,
} from "../utils/color";
import styles from "./Legend.module.css";

export default function Legend({ avatarSize = 24, tasks, team }) {
  const entries = useMemo(() => {
    const map = new Map();

    for (let key in team) {
      const owner = team[key];
      const ownerName = owner.name || key;

      map.set(key.toLowerCase(), {
        name: ownerName,
        color: owner.color || getColorForString(ownerName),
        avatar: owner.avatar || null,
      });
    }

    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      const ownerKey = (task.owner || "Team").toLowerCase();
      if (!map.has(ownerKey)) {
        map.set(ownerKey, {
          name: ownerKey.toLowerCase(),
          color: getColorForString(ownerKey),
          avatar: null,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    });
  }, [team, tasks]);

  return (
    <ul className={styles.List} data-testname="Legend-list">
      {entries.map(({ avatar, color: backgroundColor, name }) => {
        const color =
          getContrastRatio(backgroundColor, WHITE) >
          getContrastRatio(backgroundColor, BLACK)
            ? WHITE
            : BLACK;

        return (
          <li key={name} className={styles.ListItem}>
            <span
              className={styles.ColorChip}
              style={{
                backgroundColor,
                width: `${avatarSize}px`,
                height: `${avatarSize}px`,
                borderRadius: `${avatarSize}px`,
              }}
            >
              {avatar && (
                <img
                  alt={`${name} avatar`}
                  className={styles.AvatarImage}
                  style={{ avatarSize }}
                  src={avatar}
                  width={avatarSize}
                  height={avatarSize}
                />
              )}
              {!avatar && (
                <span className={styles.Letter} style={{ color }}>
                  {name.substr(0, 1)}
                </span>
              )}
            </span>{" "}
            <span className={styles.ItemName}>{name}</span>
          </li>
        );
      })}
    </ul>
  );
}
