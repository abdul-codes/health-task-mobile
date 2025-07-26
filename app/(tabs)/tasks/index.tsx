import { Feather, Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface TaskListItemProps {
  item: Task;
}

const TaskListItem = ({ item }: TaskListItemProps) => {
  const priorityStyles: Record<TaskPriority, string> = {
    [TaskPriority.CRITICAL]: "bg-red-100 text-red-700",
    [TaskPriority.HIGH]: "bg-yellow-100 text-yellow-700",
    [TaskPriority.MEDIUM]: "bg-blue-100 text-blue-700",
    [TaskPriority.LOW]: "bg-gray-100 text-gray-700",
  };
  const statusStyles: Record<TaskStatus, string> = {
    [TaskStatus.PENDING]: "bg-green-100 text-green-700",
    [TaskStatus.IN_PROGRESS]: "bg-purple-100 text-purple-700",
    [TaskStatus.COMPLETED]: "bg-gray-200 text-gray-500",
    [TaskStatus.CANCELLED]: "bg-red-200 text-red-500",
  };

  const formattedDate = new Date(item.dueDate).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <Link href={`/tasks/${item.id}`} asChild>
      <TouchableOpacity className="bg-white p-4 rounded-xl mb-3 shadow-sm active:bg-gray-100">
        <Text className="text-lg font-semibold text-gray-800 mb-2">
          {item.title}
        </Text>
        {item.patient && (
          <Text className="text-base text-gray-500">
            Patient: {item.patient.name} - Room: {item.patient.roomNumber}
          </Text>
        )}
        <View className="flex-row items-center mb-3">
          <Feather name="calendar" size={14} color="#6B7280" />
          <Text className="text-sm text-gray-500 ml-2">
            Due: {formattedDate}
          </Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <View
            className={`px-3 py-1 rounded-full ${
              priorityStyles[item.priority]
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                priorityStyles[item.priority].split(" ")[1]
              }`}
            >
              {item.priority}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${statusStyles[item.status]}`}
          >
            <Text
              className={`text-xs font-bold ${
                statusStyles[item.status].split(" ")[1]
              }`}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

// --- Main Tasks List Screen ---

const fetchTasks = async (
  accessToken: string | null,
  activeFilter: TaskStatus | "All",
): Promise<Task[]> => {
  if (!accessToken) {
    return [];
  }
  const params = activeFilter === "All" ? {} : { status: activeFilter };
  const { data } = await api.get("/tasks", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  });
  return data;
};

export default function TasksScreen() {
  const { accessToken } = useAuth();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TaskStatus | "All">("All");

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch, // 1. Get the refetch function
  } = useQuery<Task[], Error>({
    queryKey: ["tasks", activeFilter],
    // 2. Use the new standalone fetch function
    queryFn: () => fetchTasks(accessToken, activeFilter),
    enabled: !!accessToken,
  });

  const filterOptions: (TaskStatus | "All")[] = [
    "All",
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
  ];
  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
        <Text>Loading tasks...</Text>
      </SafeAreaView>
    );
  }

  // 3. Implement the improved error UI
  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-8 bg-gray-50">
        <Ionicons name="cloud-offline-outline" size={60} color="#EF4444" />
        <Text className="text-lg font-semibold text-red-600 mt-4 text-center">
          Error fetching tasks
        </Text>
        <Text className="text-gray-500 mt-1 text-center">
          {error.message}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-6 bg-blue-600 px-6 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* Configure the header for this screen */}
      <Stack.Screen options={{ headerShown: false }} />

      <View className="p-5 flex-1 mt-10">
        {/* --- Custom Header --- */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-bold text-gray-800">Tasks</Text>
          <View className="flex-row space-x-3 ">
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              className="flex-row items-center bg-white px-4 py-2 rounded-full shadow-sm"
            >
              <Ionicons name="filter" size={18} color="#374151" />
              <Text className="text-base font-semibold text-gray-700 ml-2">
                Filter
              </Text>
            </TouchableOpacity>
            {/* <Link href="/tasks/create" asChild>
                            <TouchableOpacity className="flex-row items-center bg-blue-500 px-2 py-2 rounded-full shadow-sm">
                                <Ionicons name="add" size={18} color="white" />
                                <Text className="text-base font-semibold text-white ml-2"></Text>
                            </TouchableOpacity>
                        </Link> */}
          </View>
        </View>

        {/* --- Task List --- */}
        <FlatList
          data={tasks}
          renderItem={({ item }) => <TaskListItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* --- Filter Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          onPress={() => setFilterModalVisible(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white rounded-t-2xl p-5 shadow-lg">
            <Text className="text-xl font-bold text-center mb-5">
              Filter by Status
            </Text>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setActiveFilter(option);
                  setFilterModalVisible(false);
                }}
                className={`p-4 rounded-lg mb-2 ${
                  activeFilter === option ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    activeFilter === option
                      ? "text-blue-600"
                      : "text-gray-800"
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
