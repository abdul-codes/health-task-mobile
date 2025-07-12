// app/index.tsx
// This is the main screen for your app, following Expo Router conventions.
// Ensure you have nativewind, typescript, and @expo/vector-icons installed.
// NOTE: We are now using standard components with `className` instead of the deprecated `styled` HOC.

import React from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link, Href } from "expo-router";
import { useAuth } from "../hooks/useAuth";
// --- Type Definitions ---
// Defining types for our data structures and component props

type Priority = "Critical" | "High" | "Normal" | "Low";
type Status = "New" | "In Progress" | "Completed";

interface Task {
  id: string;
  title: string;
  patient: {
    name: string;
    roomNumber: string;
  };
  priority: Priority;
  status: Status;
  dueDate: string;
}

// --- Mock Data ---
// In a real app, this data would come from an API.
const mockTasks: Task[] = [
  {
    id: "task101",
    title: "Administer Medication",
    patient: { name: "John Doe", roomNumber: "301A" },
    priority: "Critical",
    status: "New",
    dueDate: "2025-06-16T10:00:00Z", // Note: Using a future date for demonstration
  },
  {
    id: "task102",
    title: "Check Vital Signs",
    patient: { name: "Jane Smith", roomNumber: "302B" },
    priority: "High",
    status: "New",
    dueDate: "2025-06-16T10:15:00Z",
  },
  {
    id: "task103",
    title: "Update Patient Chart",
    patient: { name: "Robert Brown", roomNumber: "305A" },
    priority: "Normal",
    status: "In Progress",
    dueDate: "2025-06-16T10:30:00Z",
  },
  {
    id: "task104",
    title: "Prepare for Discharge",
    patient: { name: "Emily White", roomNumber: "303C" },
    priority: "Normal",
    status: "New",
    dueDate: "2025-06-16T11:00:00Z",
  },
  {
    id: "task105",
    title: "Change IV Drip",
    patient: { name: "Michael Johnson", roomNumber: "301A" },
    priority: "Low",
    status: "Completed",
    dueDate: "2025-06-16T11:30:00Z",
  },
];

// --- Reusable Components ---

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
    Priority,
    { bg: string; text: string; label: string }
  > = {
    Critical: { bg: "bg-red-100", text: "text-red-700", label: "Critical" },
    High: { bg: "bg-yellow-100", text: "text-yellow-700", label: "High" },
    Normal: { bg: "bg-blue-100", text: "text-blue-700", label: "Normal" },
    Low: { bg: "bg-gray-200", text: "text-gray-700", label: "Low" },
  };
  const currentPriority = priorityStyles[task.priority];

  const formattedTime = new Date(task.dueDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Link href={{ pathname: `/tasks/[id]`, params: { id: task.id } }} asChild>
      <TouchableOpacity className="bg-white p-4 rounded-xl mb-4 shadow-sm active:bg-gray-100">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              {task.title}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Patient: {task.patient.name} - Room: {task.patient.roomNumber}
            </Text>
          </View>
          <Text className="text-base font-semibold text-gray-700 ml-2">
            {formattedTime}
          </Text>
        </View>
        <View className="flex-row justify-start items-center mt-3">
          <View className={`px-3 py-1 rounded-full ${currentPriority.bg}`}>
            <Text className={`text-xs font-bold ${currentPriority.text}`}>
              {currentPriority.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

// --- Main Dashboard Screen ---
export default function DashboardScreen() {
  const newTasksCount = mockTasks.filter((t) => t.status === "New").length;
  const allTasksCount = mockTasks.filter(
    (t) => t.status !== "Completed",
  ).length;
  const criticalTasksCount = mockTasks.filter(
    (t) => t.priority === "Critical" && t.status !== "Completed",
  ).length;

  const { user } = useAuth();

  const dueSoonTasks = mockTasks
    .filter((task) => task.status !== "Completed")
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  // This component renders the main content of the list.
  const ListHeaderComponent = () => (
    <>
      {/* --- Header --- */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-800">
            Good Morning,
          </Text>
          <Text className="text-2xl font-bold text-blue-600">
            {user?.role} {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4">
            <Feather name="bell" size={26} color="#374151" />
            {/* NOTE: In a real app, this notification count should be dynamic. */}
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 justify-center items-center">
              <Text className="text-white text-xs font-bold">3</Text>
            </View>
          </TouchableOpacity>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?u=emilycarter" }}
            className="w-12 h-12 rounded-full"
          />
        </View>
      </View>

      {/* --- Summary Cards --- */}
      <View className="flex-row justify-center mb-8">
        <SummaryCard
          title="New Tasks"
          count={newTasksCount}
          iconName="plus-circle"
          color="#3B82F6"
          href="/tasks/create"
        />
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

      {/* --- Due Soon Task List Header --- */}
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
      {/* BEST PRACTICE: Using FlatList instead of ScrollView for better performance with lists. */}
      <FlatList
        data={dueSoonTasks}
        renderItem={({ item }) => <TaskCard task={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        // FIX: The contentContainerStyle adds padding to the scrollable area.
        // 'px-5' adds horizontal padding and 'pt-4' adds top padding to push content down.
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 36 }}
      />
    </SafeAreaView>
  );
}
