import { useQuery } from "@tanstack/react-query";

export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [activitiesRes, documentsRes, projectsRes] = await Promise.all([
        fetch("/api/dashboard/recent-activities"),
        fetch("/api/dashboard/recent-documents"),
        fetch("/api/projects")
      ]);

      const [activities, documents, projects] = await Promise.all([
        activitiesRes.ok ? activitiesRes.json() : [],
        documentsRes.ok ? documentsRes.json() : [],
        projectsRes.ok ? projectsRes.json() : []
      ]);

      return { activities, documents, projects };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
