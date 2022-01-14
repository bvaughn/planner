import { useEffect } from "react";
import styles from "./ContextMenu.module.css";

export default function ContextMenu({ hide, items, left, top }) {
  useEffect(() => {
    const timeouteID = setTimeout(() => {
      timeouteID = null;

      document.addEventListener("click", hide);
      document.addEventListener("contextmenu", hide);
      document.addEventListener("keydown", hide);
    });

    return () => {
      if (timeouteID !== null) {
        clearTimeout(timeouteID);
      }

      document.removeEventListener("click", hide);
      document.removeEventListener("contextmenu", hide);
      document.removeEventListener("keydown", hide);
    };
  }, [hide]);

  return (
    <ul className={styles.ContextMenu} style={{ top, left }}>
      {items.map((item, index) => (
        <li
          key={index}
          className={styles.ContextMenuItem}
          onClick={item.callback}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}
