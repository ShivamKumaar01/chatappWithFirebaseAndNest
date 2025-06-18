import Image from "next/image";
import styles from "./page.module.css";
import Login from "./signup/page";

export default function Home() {
  return (
    <div className={styles.page}>
     <Login></Login>
    </div>
  );
}
