import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BackupPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      router.push('/projects');
    }
  }, [isAdmin, router]);

  // Don't render the page if user is not admin
  if (!isAdmin) {
    return null;
  }

  return <div>پشتیبان‌گیری</div>;
}

