import { Feather, Ionicons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
// MODIFICATION: Import UserRole
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { Task, TaskPriority, TaskStatus, UserRole } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";


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
      <TouchableOpacity className="active:bg-gray-100 mb-3 rounded-xl bg-white p-4 shadow-sm">
        <Text className="mb-2 text-lg font-semibold text-gray-800">
          {item.title}
        </Text>
        {item.patient && (
          <Text className="text-base text-gray-500">
            Patient: {item.patient.name} - Room: {item.patient.roomNumber}
          </Text>
        )}
        <View className="mb-3 flex-row items-center">
          <Feather name="calendar" size={14} color="#6B7280" />
          <Text className="ml-2 text-sm text-gray-500">
            Due: {formattedDate}
          </Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <View
            className={`rounded-full px-3 py-1 ${
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
            className={`rounded-full px-3 py-1 ${statusStyles[item.status]}`}
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

// MODIFICATION: Updated fetchTasks to handle role-based fetching
const fetchTasks = async (
  accessToken: string | null,
  userRole: UserRole | undefined,
  activeFilter: TaskStatus | "All",
  mineFilter: boolean,
): Promise<Task[]> => {
  if (!accessToken || !userRole) {
    return [];
  }

  const params = activeFilter === "All" ? {} : { status: activeFilter };
  const headers = { Authorization: `Bearer ${accessToken}` };

  let tasks: Task[] = [];

  try {
    if (mineFilter) {
      const { data } = await api.get("/tasks/my-tasks", { headers, params });
      tasks = data;
    } else if (userRole === UserRole.Admin) {
      // Admin gets all tasks
      const { data } = await api.get("/tasks", { headers, params });
      tasks = data;
    } else if (userRole === UserRole.Doctor) {
      // Doctor gets assigned tasks and tasks created by them
      const [assignedResponse, createdResponse] = await Promise.all([
        api.get("/tasks/my-tasks", { headers, params }),
        api.get("/tasks/created-by-me", { headers, params }),
      ]);
      // Merge and remove duplicates
      const taskMap = new Map<string, Task>();
      assignedResponse.data.forEach((task: Task) => taskMap.set(task.id, task));
      createdResponse.data.forEach((task: Task) => taskMap.set(task.id, task));
      tasks = Array.from(taskMap.values());
    } else {
      // Other roles (NURSE, LABTECH) get tasks assigned to them
      const { data } = await api.get("/tasks/my-tasks", { headers, params });
      tasks = data;
    }
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    // Re-throw the error to be caught by React Query
    throw error;
  }

  return tasks;
};

// MODIFICATION: Helper for sorting tasks
const sortTasks = (tasks: Task[]): Task[] => {
  const priorityOrder: Record<TaskPriority, number> = {
    [TaskPriority.CRITICAL]: 1,
    [TaskPriority.HIGH]: 2,
    [TaskPriority.MEDIUM]: 3,
    [TaskPriority.LOW]: 4,
  };

  return tasks.sort((a, b) => {
    // Sort by due date first (ascending)
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    // Then sort by priority (ascending by order number)
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};


export default function TasksScreen() {
  const { accessToken, user } = useAuth();
  const params = useLocalSearchParams<{ priority?: string; filter?: string }>();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<"status" | "priority">("status");
  const [activeStatusFilter, setActiveStatusFilter] = useState<TaskStatus | "All">("All");
  const [activePriorityFilter, setActivePriorityFilter] = useState<TaskPriority | "All">("All");
  const [activeMineFilter, setActiveMineFilter] = useState<boolean>(false);

  // Handle priority parameter from navigation
  useEffect(() => {
    if (params.priority) {
      // Convert the string parameter to TaskPriority enum
      const priorityValue = params.priority.toUpperCase() as TaskPriority;
      if (Object.values(TaskPriority).includes(priorityValue)) {
        setActivePriorityFilter(priorityValue);
      }
    }
    if (params.filter === 'mine') {
      setActiveMineFilter(true);
    }
  }, [params]);

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Task[], Error>({
    // MODIFICATION: Updated queryKey to include user's role and filters
    queryKey: ["tasks", user?.id, user?.role, activeStatusFilter, activePriorityFilter, activeMineFilter],
    // MODIFICATION: Pass user role to fetchTasks
    queryFn: () => fetchTasks(accessToken, user?.role, activeStatusFilter, activeMineFilter),
    enabled: !!accessToken && !!user?.id && !!user?.role,
  });

  // MODIFICATION: Memoized sorted and filtered tasks
  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    
    // Apply priority filter on the client side
    let filteredTasks = tasks;
    if (activePriorityFilter !== "All") {
      filteredTasks = tasks.filter(task => task.priority === activePriorityFilter);
    }
    
    return sortTasks(filteredTasks);
  }, [tasks, activePriorityFilter]);

  const statusFilterOptions: (TaskStatus | "All")[] = [
    "All",
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
  ];

  const priorityFilterOptions: (TaskPriority | "All")[] = [
    "All",
    TaskPriority.CRITICAL,
    TaskPriority.HIGH,
    TaskPriority.MEDIUM,
    TaskPriority.LOW,
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

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 p-8">
        <Ionicons name="cloud-offline-outline" size={60} color="#EF4444" />
        <Text className="mt-4 text-center text-lg font-semibold text-red-600">
          Error fetching tasks
        </Text>
        <Text className="mt-1 text-center text-gray-500">{error.message}</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-2"
        >
          <Text className="font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="mt-10 flex-1 p-5">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-gray-800">Tasks</Text>
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              className="flex-row items-center rounded-full bg-white px-4 py-2 shadow-sm"
            >
              <Ionicons name="filter" size={18} color="#374151" />
              <Text className="ml-2 text-base font-semibold text-gray-700">
                Filter
              </Text>
            </TouchableOpacity>
            {/* MODIFICATION: Conditionally render Create Task button */}
            {(user?.role === UserRole.Admin || user?.role === UserRole.Doctor) && (
              <Link href="/tasks/create" asChild>
                <TouchableOpacity className="flex-row items-center rounded-full bg-blue-500 px-2 py-2 shadow-sm">
                  <Ionicons name="add" size={22} color="white" />
                </TouchableOpacity>
              </Link>
            )}
          </View>
        </View>

        {/* MODIFICATION: Active filters indicator */}
        <View className="mb-4 flex-row items-center flex-wrap">
          <Text className="font-semibold text-gray-500">Showing:</Text>
          <Text className="ml-2 rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-600">
            Status: {activeStatusFilter}
          </Text>
          {activeMineFilter && (
            <Text className="ml-2 rounded-full bg-green-100 px-3 py-1 font-bold text-green-600">
              My Tasks
            </Text>
          )}
          {activePriorityFilter !== "All" && (
            <Text className="ml-2 rounded-full bg-red-100 px-3 py-1 font-bold text-red-600">
              Priority: {activePriorityFilter}
            </Text>
          )}
          {(activeStatusFilter !== "All" || activePriorityFilter !== "All" || activeMineFilter) && (
            <TouchableOpacity
              onPress={() => {
                setActiveStatusFilter("All");
                setActivePriorityFilter("All");
                setActiveMineFilter(false);
              }}
              className="ml-2 rounded-full bg-gray-100 px-3 py-1"
            >
              <Text className="font-bold text-gray-600">Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* MODIFICATION: Use sortedTasks for the list */}
        <FlatList
          data={sortedTasks}
          renderItem={({ item }) => <TaskListItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          // Add a message for when there are no tasks
          ListEmptyComponent={
            <View className="mt-20 flex-1 items-center justify-center">
              <Ionicons name="file-tray-outline" size={48} color="#9CA3AF" />
              <Text className="mt-4 text-lg text-gray-500">
                No tasks found.
              </Text>
              <Text className="mt-1 text-sm text-gray-400">
                Try changing the filter or creating a new task.
              </Text>
            </View>
          }
        />
      </View>

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
          <View className="rounded-t-2xl bg-white p-5 shadow-lg">
            {/* Filter Type Tabs */}
            <View className="mb-5 flex-row rounded-lg bg-gray-100 p-1">
              <TouchableOpacity
                onPress={() => setFilterType("status")}
                className={`flex-1 rounded-md py-2 ${
                  filterType === "status" ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    filterType === "status" ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  Status
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterType("priority")}
                className={`flex-1 rounded-md py-2 ${
                  filterType === "priority" ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    filterType === "priority" ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  Priority
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="mb-5 text-center text-xl font-bold">
              Filter by {filterType === "status" ? "Status" : "Priority"}
            </Text>

            {/* Status Filter Options */}
            {filterType === "status" &&
              statusFilterOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setActiveStatusFilter(option);
                    setFilterModalVisible(false);
                  }}
                  className={`mb-2 rounded-lg p-4 ${
                    activeStatusFilter === option ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      activeStatusFilter === option
                        ? "text-blue-600"
                        : "text-gray-800"
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}

            {/* Priority Filter Options */}
            {filterType === "priority" &&
              priorityFilterOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setActivePriorityFilter(option);
                    setFilterModalVisible(false);
                  }}
                  className={`mb-2 rounded-lg p-4 ${
                    activePriorityFilter === option ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      activePriorityFilter === option
                        ? "text-red-600"
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
