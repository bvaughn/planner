import styles from "./Tooltip.module.css";

export default function Tooltip({ left, right, text, top }) {
  if (!text) {
    return null;
  }

  return (
    <div
      className={styles.Tooltip}
      style={{
        left: left != null ? `${left}px` : "",
        right: right != null ? `${right}px` : "",
        top: top != null ? `${top}px` : "",
      }}
    >
      {text}
    </div>
  );
}
