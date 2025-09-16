import { useQuery } from "@tanstack/react-query";

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
