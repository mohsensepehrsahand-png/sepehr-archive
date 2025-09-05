"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.logo} style={{ width: 300, height: 300, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <h1 className={styles.title}>
            سیستم آرشیو اسناد سپهر
          </h1>
          <h2 className={styles.subtitle}>
            مدیریت اسناد و پروژه‌ها
          </h2>
          <div className={styles.loginButton} style={{ display: 'inline-block' }}>
            ورود
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Image
          src="/logo.png"
          alt="لوگو سیستم آرشیو اسناد سپهر"
          width={300}
          height={300}
          className={styles.logo}
          priority
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
