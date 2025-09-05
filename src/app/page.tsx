"use client";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Image
          src="/logo.png"
          alt="لوگو سیستم آرشیو اسناد سپهر"
          width={300}
          height={300}
          className={styles.logo}
        />
        <h1 className={styles.title}>
          سیستم آرشیو اسناد سپهر
        </h1>
        <h2 className={styles.subtitle}>
          مدیریت اسناد و پروژه‌ها
        </h2>
        <Link href="/login" className={styles.loginButton}>
          ورود
        </Link>
      </div>
    </div>
  );
}
