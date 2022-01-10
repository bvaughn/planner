import Image from "next/image";
import styles from "./Loading.module.css";

export default function Loading() {
  return (
    <div className={styles.Loading}>
      <Image
        className={styles.Image}
        alt="Planner logo"
        src="/static/avatar.png"
        width={231}
        height={231}
      />
      loading...
    </div>
  );
}
