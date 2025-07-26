/* TaskDetailsScreen.tsx */

import React from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { TaskPriority, TaskStatus } from "@/lib/types";

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().datetime(),
  patient: z
    .object({
      name: z.string(),
      roomNumber: z.string(),
    })
    .optional(),
});

export type Task = z.infer<typeof taskSchema>;

const priorityStyles = {
  [TaskPriority.CRITICAL]: { banner: "bg-red-100", text: "text-red-700" },
  [TaskPriority.HIGH]: { banner: "bg-yellow-100", text: " text-yellow-700" },
  [TaskPriority.MEDIUM]: { banner: "bg-blue-100", text: "text-blue-700" },
  [TaskPriority.LOW]: { banner: "bg-gray-100", text: "text-gray-700" },
};

const statusStyles = {
  [TaskStatus.PENDING]: { bg: "bg-yellow-100", text: "text-yellow-800" },
  [TaskStatus.IN_PROGRESS]: { bg: "bg-blue-100", text: "text-blue-800" },
  [TaskStatus.COMPLETED]: { bg: "bg-green-100", text: "text-green-800" },
  [TaskStatus.CANCELLED]: { bg: "bg-red-100", text: "text-red-800" },
};

export function useUpdateStatus(taskId: string) {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (status: TaskStatus) => {
      const { data } = await api.patch(
        `/tasks/${taskId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return taskSchema.parse(data);
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(["task", taskId], updatedTask);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: any) => {
      Alert.alert(
        "Update Failed",
        err?.response?.data?.message || "The task status could not be updated."
      );
    },
  });
}

// --- Corrected "Version B" of ActionBar ---
function ActionBar({ task }: { task: Task }) {
  const { mutate, isPending, variables } = useUpdateStatus(task.id);

  const transitions: Record<
    TaskStatus,
    {
      label: string;
      next: TaskStatus;
      style: "primary" | "destructive";
      icon?: keyof typeof Ionicons.glyphMap;
    }[]
  > = {
    [TaskStatus.PENDING]: [
      {
        label: "Start Task",
        next: TaskStatus.IN_PROGRESS,
        style: "primary",
        icon: "play-circle-outline",
      },
    ],
    [TaskStatus.IN_PROGRESS]: [
      {
        label: "Complete",
        next: TaskStatus.COMPLETED,
        style: "primary",
        icon: "checkmark-circle-outline",
      },
      {
        label: "Cancel",
        next: TaskStatus.CANCELLED,
        style: "destructive",
        icon: "close-circle-outline",
      },
    ],
    [TaskStatus.COMPLETED]: [],
    [TaskStatus.CANCELLED]: [],
  };

  const availableActions = transitions[task.status] ?? [];

  if (availableActions.length === 0) {
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <View className="w-full items-center py-4 rounded-xl bg-gray-100">
          <Ionicons
            name="checkmark-done-circle"
            size={24}
            color={
              task.status === TaskStatus.COMPLETED ? "#10B981" : "#6B7280"
            }
          />
          <Text className="text-gray-600 font-semibold text-base mt-2">
            Task {task.status.toLowerCase()}
          </Text>
        </View>
      </View>
    );
  }

  if (availableActions.length === 1) {
    const action = availableActions[0];
    const isThisActionPending = isPending && variables === action.next;

    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <TouchableOpacity
          onPress={() => mutate(action.next)}
          disabled={isPending}
          className={`w-full items-center justify-center py-4 rounded-xl bg-blue-600 ${
            isPending ? "opacity-70" : ""
          }`}
        >
          <View className="flex-row items-center">
            {isThisActionPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              action.icon && (
                <Ionicons name={action.icon} size={20} color="white" />
              )
            )}
            <Text className="text-white font-bold text-base ml-2">
              {isThisActionPending ? "Processing..." : action.label}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const primaryAction = availableActions.find((a) => a.style === "primary");
  const destructiveAction = availableActions.find(
    (a) => a.style === "destructive"
  );

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
      <View className="flex-row space-x-6 ">
        {destructiveAction && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Cancel Task",
                "Are you sure you want to cancel this task? This action cannot be undone.",
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: () => mutate(destructiveAction.next),
                  },
                ]
              );
            }}
            disabled={isPending}
            className={`flex-1 items-center justify-center py-4 rounded-xl border border-gray-300 bg-white ${
              isPending ? "opacity-70" : ""
            }`}
          >
            <View className="flex-row items-center">
              {destructiveAction.icon && (
                <Ionicons
                  name={destructiveAction.icon}
                  size={18}
                  color="#EF4444"
                />
              )}
              <Text className="text-red-500 font-semibold text-base ml-2">
                {destructiveAction.label}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {primaryAction && (
          <TouchableOpacity
            onPress={() => mutate(primaryAction.next)}
            disabled={isPending}
            className={`flex-1 items-center justify-center py-4 rounded-xl bg-blue-600 ${
              isPending ? "opacity-70" : ""
            }`}
          >
            <View className="flex-row items-center">
              {isPending && variables === primaryAction.next ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                primaryAction.icon && (
                  <Ionicons name={primaryAction.icon} size={18} color="white" />
                )
              )}
              <Text className="text-white font-bold text-base ml-2">
                {isPending && variables === primaryAction.next
                  ? "Processing..."
                  : primaryAction.label}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();

  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      if (!id) throw new Error("Task ID is missing");
      const { data } = await api.get(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return taskSchema.parse(data);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 p-4">
        <Text className="text-red-600 text-lg font-semibold text-center mb-4">
          {error ? error.message : "Task not found."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-600 px-6 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-gray-800 ml-2">
          Task Details
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-sm p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View
                className={`px-3 py-1 rounded-full ${
                  priorityStyles[task.priority].banner
                }`}
              >
                <Text
                  className={`font-semibold ${
                    priorityStyles[task.priority].text
                  }`}
                >
                  {task.priority} Priority
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  statusStyles[task.status].bg
                }`}
              >
                <Text
                  className={`font-semibold ${statusStyles[task.status].text}`}
                >
                  {task.status}
                </Text>
              </View>
            </View>

            <Text className="text-2xl font-bold text-gray-900 mb-3">
              {task.title}
            </Text>

            {task.description && (
              <Text className="text-xl text-gray-600 mb-6 leading-relaxed">
                {task.description}
              </Text>
            )}

            <View className="border-t border-gray-200 pt-4 space-y-4">
              {task.patient && (
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={20} color="#6B7280" />
                  <Text className="ml-3 text-xl text-gray-800">
                    {task.patient.name} (Room {task.patient.roomNumber})
                  </Text>
                </View>
              )}
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
   
                <Text className="ml-3 text-xl text-gray-800">
                      Due: {new Date(task.dueDate).toLocaleString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <ActionBar task={task} />
    </SafeAreaView>
  );
}
