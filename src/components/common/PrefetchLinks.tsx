"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function PrefetchLinks() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch critical pages
    const prefetchPages = [
      "/dashboard",
      "/projects", 
      "/finance",
      "/archived"
    ];

    prefetchPages.forEach(page => {
      router.prefetch(page);
    });

    // Prefetch critical data
    queryClient.prefetchQuery({
      queryKey: ["projects"],
      queryFn: async () => {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [router, queryClient]);

  return null;
}
