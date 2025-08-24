import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link, Href } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { z } from "zod";

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().datetime(),
  patient: z.object({
    name: z.string(),
    roomNumber: z.string().nullable(), // Allow roomNumber to be null
  }),
});
// const taskArraySchema = z.array(taskSchema);

interface SummaryCardProps {
  title: string;
  count: number;
  iconName: keyof typeof Feather.glyphMap; // Ensures icon name is valid
  href: Href;
  color?: string; // Color is now optional
  isCritical?: boolean;
}

const SummaryCard = ({
  title,
  count,
  iconName,
  href,
  color,
  isCritical = false,
}: SummaryCardProps) => {
  const cardClasses = `bg-white p-4 rounded-xl flex-1 mx-1 shadow-sm active:bg-gray-100`;
  const criticalCardClasses = `bg-red-50 border border-red-200`;

  return (
    <Link href={href} asChild>
      <TouchableOpacity
        className={`${cardClasses} ${isCritical ? criticalCardClasses : ""}`}
      >
        <View className="flex-row justify-between items-start">
          <Text
            className={`text-base font-medium ${isCritical ? "text-red-800" : "text-gray-600"}`}
          >
            {title}
          </Text>
          <Feather
            name={iconName}
            size={22}
            color={isCritical ? "#DC2626" : color}
          />
        </View>
        <Text
          className={`text-4xl font-bold mt-2 ${isCritical ? "text-red-900" : "text-gray-800"}`}
        >
          {count}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const priorityStyles: Record<
    TaskPriority,
    { bg: string; text: string; label: string }
  > = {
    [TaskPriority.CRITICAL]: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Critical",
    },
    [TaskPriority.HIGH]: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "High",
    },
    [TaskPriority.MEDIUM]: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "Normal",
    },
    [TaskPriority.LOW]: {
      bg: "bg-gray-200",
      text: "text-gray-700",
      label: "Low",
    },
  };
  const currentPriority = priorityStyles[task.priority];

  // Styles for the status badge
  const statusStyles: Record<
    TaskStatus,
    { bg: string; text: string; label: string }
  > = {
    [TaskStatus.PENDING]: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Pending",
    },
    [TaskStatus.IN_PROGRESS]: {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      label: "In Progress",
    },
    [TaskStatus.COMPLETED]: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Completed",
    },
    [TaskStatus.CANCELLED]: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Cancelled",
    },
  };
  const currentStatus = statusStyles[task.status];

  const formattedDueDate = useMemo(() => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();

    const isToday =
      dueDate.getDate() === now.getDate() &&
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getFullYear() === now.getFullYear();

    if (isToday) {
      // If the task is due today, just show the time.
      return dueDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      // If it's due on a future date, show a compact date and time.
      return dueDate.toLocaleString("en-US", {
        month: "short", // e.g., "Aug"
        day: "numeric", // e.g., "16"
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  }, [task.dueDate]);
  return (
    <Link href={{ pathname: `/tasks/[id]`, params: { id: task.id } }} asChild>
      <TouchableOpacity className="bg-white p-4 rounded-xl mb-4 shadow-sm active:bg-gray-100">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              {task.title}
            </Text>
            {task.patient && (
              <Text className="text-sm text-gray-500 mt-1">
                Patient: {task.patient.name} - Room: {task.patient.roomNumber}
              </Text>
            )}
          </View>
          <Text className="text-base font-semibold text-gray-700 ml-2">
            {formattedDueDate}
          </Text>
        </View>
        <View className="flex-row justify-start items-center mt-3">
          <View className={`px-3 py-1 rounded-full ${currentPriority.bg}`}>
            <Text className={`text-xs font-bold ${currentPriority.text}`}>
              {currentPriority.label}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${currentStatus.bg}`}>
            <Text
              className={`text-xs font-bold uppercase ${currentStatus.text}`}
            >
              {currentStatus.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

//  Main Dashboard Screen 
export default function DashboardScreen() {
  const { user, accessToken } = useAuth();
  const notificationCount = 0;

  const {
    data: tasks,
    isLoading,
    isError,
    error,
  } = useQuery<Task[], Error>({
    queryKey: ["tasks", "dashboard", user?.id], // Use a specific key for the dashboard
    queryFn: async () => {
      // Fetch all tasks, filtering can be done on the client for the dashboard
      const { data } = await api.get("/tasks");
      return data;
    },
    enabled: !!accessToken && !!user?.id,
  });

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
        <Text>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Error fetching tasks: {error.message}</Text>
      </SafeAreaView>
    );
  }

  // Calculations based on fetched data
  const newTasksCount =
    tasks?.filter((t) => t.status === TaskStatus.PENDING).length || 0;
  const allTasksCount =
    tasks?.filter((t) => t.status !== TaskStatus.COMPLETED).length || 0;
  const criticalTasksCount =
    tasks?.filter(
      (t) =>
        t.priority === TaskPriority.CRITICAL &&
        t.status !== TaskStatus.COMPLETED,
    ).length || 0;

  const dueSoonTasks =
    tasks
      ?.filter((task) => task.status !== TaskStatus.COMPLETED)
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      ) || [];

  // This component renders the main content of the list.
  const ListHeaderComponent = () => (
    <>
      {/*  Header  */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-800">
            Good Morning,
          </Text>
          <Text className="text-2xl font-bold text-blue-600">
            {user?.role} {user?.firstName?.toLowerCase()}
            {user?.lastName?.toLowerCase()}

          </Text>
        </View>
        <View className="flex-row items-center">
          <Link href="/notifications" asChild>
            <TouchableOpacity className="mr-4">
              <Feather name="bell" size={26} color="#374151" />
              {notificationCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 justify-center items-center">
                  <Text className="text-white text-xs font-bold">
                    {notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Link>
          <Link href="/profile">
            <Image
              source={{ uri: "https://i.pravatar.cc/150?u=emilycarter" }}
              className="w-12 h-12 rounded-full"
            />
          </Link>
        </View>
      </View>

      {/*  Summary Cards  */}
      <View className="flex-row justify-center mb-8">
        {(user?.role === "ADMIN" || user?.role === "DOCTOR") ? (
          <SummaryCard
            title="New Tasks"
            count={newTasksCount}
            iconName="plus-circle"
            color="#3B82F6"
            href="/tasks/create"
          />
        ) : (
          <SummaryCard
            title="My Tasks"
            count={tasks?.filter(t => t.assignedTo?.id === user?.id).length || 0}
            iconName="user-check"
            color="#10B981"
            href={{ pathname: "/tasks", params: { filter: "mine" } }}
          />
        )}
        <SummaryCard
          title="All Tasks"
          count={allTasksCount}
          iconName="list"
          color="#10B981"
          href="/tasks"
        />
        <SummaryCard
          title="Critical"
          count={criticalTasksCount}
          iconName="alert-triangle"
          isCritical
          href={{ pathname: "/tasks", params: { priority: "Critical" } }}
        />
      </View>

      {/*  Due Soon Task List Header  */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-800">Due Soon</Text>
        <Link href="/tasks" asChild>
          <TouchableOpacity>
            <Text className="text-blue-600 font-semibold">See All</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <FlatList
        data={dueSoonTasks}
        renderItem={({ item }) => <TaskCard task={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 36 }}
      />
    </SafeAreaView>
  );
}
