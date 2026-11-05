import { QueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { TaskStatus } from "@/lib/types";

// Writes made while offline are paused by TanStack Query and persisted to MMKV with the
// rest of the cache. Functions can't be persisted, so after an app restart a paused
// mutation can only resume if its mutationFn is registered here under its mutationKey.
// Variables must therefore carry everything the request needs (ids included).

export const MUTATION_KEYS = {
  createTask: ["tasks", "create"],
  updateTaskStatus: ["tasks", "updateStatus"],
  createPatient: ["patients", "create"],
  markNotificationRead: ["notifications", "markRead"],
  markAllNotificationsRead: ["notifications", "markAllRead"],
} as const;

export type UpdateTaskStatusVariables = { taskId: string; status: TaskStatus };

export const registerOfflineMutations = (queryClient: QueryClient): void => {
  queryClient.setMutationDefaults(MUTATION_KEYS.createTask, {
    mutationFn: (task: unknown) => api.post("/tasks", task),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.updateTaskStatus, {
    mutationFn: async ({ taskId, status }: UpdateTaskStatusVariables) => {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      return data;
    },
    onSuccess: (_data: unknown, { taskId }: UpdateTaskStatusVariables) => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.createPatient, {
    mutationFn: (patient: unknown) => api.post("/patients", patient),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.markNotificationRead, {
    mutationFn: (notificationId: string) =>
      api.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.markAllNotificationsRead, {
    mutationFn: () => api.patch("/notifications/read/all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
};
