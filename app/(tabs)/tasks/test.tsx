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
import { LinearGradient } from 'expo-linear-gradient';

import api from "@/lib/api";
import { TaskPriority, TaskStatus, UserRole } from "@/lib/types";

const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.nativeEnum(UserRole),
});

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
      roomNumber: z.string().nullable(),
    })
    .nullable()
    .optional(),
  createdBy: userSchema,
  assignedTo: userSchema.optional().nullable(),
});

export type Task = z.infer<typeof taskSchema>;

const priorityConfig = {
  [TaskPriority.CRITICAL]: {
    color: "#DC2626",
    bgColor: "#FEF2F2",
    borderColor: "#FECACA",
    gradient: ["#DC2626", "#B91C1C"] as const,
    icon: "warning" as keyof typeof Ionicons.glyphMap,
    label: "Critical",
  },
  [TaskPriority.HIGH]: {
    color: "#D97706",
    bgColor: "#FFFBEB",
    borderColor: "#FED7AA",
    gradient: ["#D97706", "#B45309"] as const,
    icon: "alert-circle" as keyof typeof Ionicons.glyphMap,
    label: "High",
  },
  [TaskPriority.MEDIUM]: {
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#DBEAFE",
    gradient: ["#2563EB", "#1D4ED8"] as const,
    icon: "information-circle" as keyof typeof Ionicons.glyphMap,
    label: "Medium",
  },
  [TaskPriority.LOW]: {
    color: "#059669",
    bgColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    gradient: ["#059669", "#047857"] as const,
    icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
    label: "Low",
  },
};

const statusConfig = {
  [TaskStatus.PENDING]: {
    color: "#D97706",
    bgColor: "#FFFBEB",
    icon: "time" as keyof typeof Ionicons.glyphMap,
    label: "Pending",
    progress: 0,
  },
  [TaskStatus.IN_PROGRESS]: {
    color: "#2563EB",
    bgColor: "#EFF6FF",
    icon: "play-circle" as keyof typeof Ionicons.glyphMap,
    label: "In Progress",
    progress: 50,
  },
  [TaskStatus.COMPLETED]: {
    color: "#059669",
    bgColor: "#F0FDF4",
    icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
    label: "Completed",
    progress: 100,
  },
  [TaskStatus.CANCELLED]: {
    color: "#DC2626",
    bgColor: "#FEF2F2",
    icon: "close-circle" as keyof typeof Ionicons.glyphMap,
    label: "Cancelled",
    progress: 0,
  },
};

// Helper function to calculate time until due date
function getTimeUntilDue(dueDate: string) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffInHours = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 0) {
    return { text: `${Math.abs(diffInHours)}h overdue`, isOverdue: true };
  } else if (diffInHours < 24) {
    return { text: `${diffInHours}h remaining`, isOverdue: false };
  } else {
    const days = Math.ceil(diffInHours / 24);
    return { text: `${days}d remaining`, isOverdue: false };
  }
}

// Priority Banner Component
function PriorityBanner({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority];
  
  return (
    <LinearGradient
      colors={config.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name={config.icon} size={20} color="white" />
          <Text className="text-white font-bold text-base ml-2">
            {config.label} Priority Task
          </Text>
        </View>
        <View className="bg-white/20 px-3 py-1 rounded-full">
          <Text className="text-white font-semibold text-sm">
            {priority}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// Status Progress Component
function StatusProgress({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];
  
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: config.bgColor }}
          >
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <View className="ml-3">
            <Text className="font-semibold text-gray-900 text-base">
              {config.label}
            </Text>
            <Text className="text-gray-500 text-sm">Current Status</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="font-bold text-lg" style={{ color: config.color }}>
            {config.progress}%
          </Text>
          <Text className="text-gray-500 text-xs">Complete</Text>
        </View>
      </View>
      
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View 
          className="h-full rounded-full"
          style={{ 
            width: `${config.progress}%`, 
            backgroundColor: config.color 
          }}
        />
      </View>
    </View>
  );
}

// Patient Card Component
function PatientCard({ patient }: { patient: { name: string; roomNumber: string | null } | null | undefined }) {
  if (!patient) return null;
  
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-semibold text-gray-600 text-sm uppercase tracking-wide">
          Patient Information
        </Text>
        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
          <Ionicons name="person" size={20} color="#2563EB" />
        </View>
      </View>
      
      <Text className="font-bold text-xl text-gray-900 mb-1">
        {patient.name}
      </Text>
      
      {patient.roomNumber && (
        <View className="flex-row items-center">
          <Ionicons name="bed-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 ml-2 font-medium">
            Room {patient.roomNumber}
          </Text>
        </View>
      )}
    </View>
  );
}

// Time Card Component
function TimeCard({ dueDate }: { dueDate: string }) {
  const timeInfo = getTimeUntilDue(dueDate);
  
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={timeInfo.isOverdue ? "#DC2626" : "#6B7280"} 
            />
            <Text className="font-semibold text-gray-600 text-sm uppercase tracking-wide ml-2">
              Due Date
            </Text>
          </View>
          
          <Text className="font-bold text-lg text-gray-900 mb-1">
            {new Date(dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          
          <Text className="text-gray-500 text-sm">
            {new Date(dueDate).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </View>
        
        <View className={`px-3 py-2 rounded-full ${timeInfo.isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Text 
            className={`font-bold text-sm ${timeInfo.isOverdue ? 'text-red-700' : 'text-blue-700'}`}
          >
            {timeInfo.text}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Team Card Component
function TeamCard({ createdBy, assignedTo }: { createdBy: any; assignedTo: any }) {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <Text className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-3">
        Team
      </Text>
      
      <View style={{ gap: 12 }}>
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
            <Ionicons name="person-add" size={18} color="#059669" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">
              {createdBy.firstName} {createdBy.lastName}
            </Text>
            <Text className="text-gray-500 text-sm capitalize">
              Created • {createdBy.role.toLowerCase()}
            </Text>
          </View>
        </View>
        
        {assignedTo && (
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
              <Ionicons name="person-circle" size={18} color="#2563EB" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-gray-900">
                {assignedTo.firstName} {assignedTo.lastName}
              </Text>
              <Text className="text-gray-500 text-sm capitalize">
                Assigned • {assignedTo.role.toLowerCase()}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export function useUpdateStatus(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: TaskStatus) => {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      return taskSchema.parse(data);
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(["task", taskId], updatedTask);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: any) => {
      Alert.alert(
        "Update Failed",
        err?.response?.data?.message || "The task status could not be updated.",
      );
    },
  });
}

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
        <View className="w-full items-center py-4 rounded-xl bg-gray-50">
          <Ionicons
            name="checkmark-done-circle"
            size={32}
            color={task.status === TaskStatus.COMPLETED ? "#059669" : "#6B7280"}
          />
          <Text className="text-gray-600 font-semibold text-base mt-2">
            Task {task.status.toLowerCase().replace('_', ' ')}
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
          className={`w-full items-center justify-center py-4 rounded-xl ${
            action.style === "primary" 
              ? "bg-blue-600" 
              : "bg-red-600"
          } ${isPending ? "opacity-70" : ""}`}
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
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
    (a) => a.style === "destructive",
  );

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
      <View className="flex-row" style={{ gap: 12 }}>
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
                ],
              );
            }}
            disabled={isPending}
            className={`flex-1 items-center justify-center py-4 rounded-xl border border-red-200 bg-red-50 ${
              isPending ? "opacity-70" : ""
            }`}
          >
            <View className="flex-row items-center">
              {destructiveAction.icon && (
                <Ionicons
                  name={destructiveAction.icon}
                  size={18}
                  color="#DC2626"
                />
              )}
              <Text className="text-red-600 font-semibold text-base ml-2">
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
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
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

  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      if (!id) throw new Error("Task ID is missing");
      const { data } = await api.get(`/tasks/${id}`);
      return taskSchema.parse(data);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4 font-medium">Loading task details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 p-4">
        <View className="items-center">
          <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
          <Text className="text-red-600 text-lg font-semibold text-center mb-2 mt-4">
            {error ? "Error Loading Task" : "Task Not Found"}
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            {error ? error.message : "The requested task could not be found."}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-600 px-6 py-3 rounded-xl"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Enhanced Header */}
      <View className="bg-white border-b border-gray-200" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View className="ml-2 flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Task Details
            </Text>
            <Text className="text-gray-500 text-sm">
              ID: {task.id.slice(0, 8)}...
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Priority Banner */}
        <View className="mx-4 mt-4">
          <View className="bg-white rounded-2xl overflow-hidden" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }}>
            <PriorityBanner priority={task.priority} />
            
            {/* Task Title and Description */}
            <View className="p-6">
              <Text className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                {task.title}
              </Text>

              {task.description && (
                <View className="bg-gray-50 p-4 rounded-xl">
                  <Text className="text-gray-700 leading-relaxed text-base">
                    {task.description}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Information Cards Grid */}
        <View className="px-4 mt-4" style={{ gap: 16 }}>
          {/* Status Progress */}
          <StatusProgress status={task.status} />

          {/* Patient Information */}
          <PatientCard patient={task.patient} />

          {/* Time Information */}
          <TimeCard dueDate={task.dueDate} />

          {/* Team Information */}
          <TeamCard createdBy={task.createdBy} assignedTo={task.assignedTo} />
        </View>

        {/* Extra padding for action bar */}
        <View className="h-6" />
      </ScrollView>

      <ActionBar task={task} />
    </SafeAreaView>
  );
}
