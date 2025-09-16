"use client";
import { Skeleton, Box, Card, CardContent } from "@mui/material";

export function ProjectCardSkeleton() {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Skeleton variant="rectangular" width={60} height={24} />
          <Skeleton variant="rectangular" width={80} height={24} />
        </Box>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2, mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="80%" height={32} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={28} />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={28} />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box>
      <Skeleton variant="rectangular" height={56} sx={{ mb: 1 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}
