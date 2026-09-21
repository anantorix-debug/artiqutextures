"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trackingService, type TrackingQuery, type UpdateProjectPayload } from "@/services/tracking.service";
import { getErrorMessage } from "@/lib/api-client";

export function useProjects(query: TrackingQuery) {
  return useQuery({
    queryKey: ["tracking", query],
    queryFn: () => trackingService.list(query),
    placeholderData: (prev) => prev,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["tracking", id],
    queryFn: () => trackingService.get(id as string),
    enabled: !!id,
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) => trackingService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking", id] });
      queryClient.invalidateQueries({ queryKey: ["tracking"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Project updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trackingService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking"] });
      toast.success("Project deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
