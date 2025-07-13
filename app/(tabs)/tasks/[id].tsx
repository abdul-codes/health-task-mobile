import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { findTaskById, Priority, Status } from "../../../lib/mockData";

// Map priority to styles
const priorityStyles: Record<
  Priority,
  { banner: string; text: string; border: string }
> = {
  Critical: {
    banner: "bg-red-100",
    text: "text-red-800",
    border: "border-red-500",
  },
  High: {
    banner: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-500",
  },
  Normal: {
    banner: "bg-green-100",
    text: "text-green-800",
    border: "border-green-500",
  },
  Low: {
    banner: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-500",
  },
};

// Map status to styles
const statusStyles: Record<Status, { bg: string; text: string }> = {
  New: { bg: "bg-blue-100", text: "text-blue-800" },
  "In Progress": { bg: "bg-yellow-100", text: "text-yellow-800" },
  Completed: { bg: "bg-green-100", text: "text-green-800" },
};

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Use state to manage task data for dynamic updates
  const [taskData, setTaskData] = useState(findTaskById(id));

  const handleStatusChange = (newStatus: Status) => {
    if (taskData) {
      // In a real app, you would call an API to update the task
      // and then update the state with the response.
      setTaskData({ ...taskData, status: newStatus });
    }
  };

  // Handle case when task is not found
  if (!taskData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-red-500 text-lg">Task not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-500">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const nextStatus: {
    [key in Status]: { action: string; next: Status; color: string } | null;
  } = {
    New: {
      action: "Acknowledge & Start",
      next: "In Progress",
      color: "bg-yellow-500",
    },
    "In Progress": {
      action: "Mark as Complete",
      next: "Completed",
      color: "bg-green-600",
    },
    Completed: null,
  };

  const currentAction = nextStatus[taskData.status];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-gray-800 ml-2">
          Task Details
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-sm p-5">
            {/* Priority and Status */}
            <View className="flex-row justify-between items-center mb-4">
              <View
                className={`px-3 py-1 rounded-full flex-row items-center border ${
                  priorityStyles[taskData.priority].border
                } ${priorityStyles[taskData.priority].banner}`}
              >
                <Text
                  className={`font-semibold ${priorityStyles[taskData.priority].text}`}
                >
                  {taskData.priority} Priority
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${statusStyles[taskData.status].bg}`}
              >
                <Text
                  className={`font-semibold ${statusStyles[taskData.status].text}`}
                >
                  {taskData.status}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              {taskData.title}
            </Text>

            {/* Description */}
            {taskData.description && (
              <Text className="text-base text-gray-600 leading-relaxed mb-6">
                {taskData.description}
              </Text>
            )}

            {/* Details Section */}
            <View className="border-t border-gray-100 pt-4 space-y-4">
              {taskData.patient && (
                <View className="flex-row items-start">
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#6B7280"
                    className="mr-4 mt-1"
                  />
                  <View>
                    <Text className="text-sm font-medium text-gray-500">
                      Patient
                    </Text>
                    <Text className="text-base text-gray-800 font-medium">
                      {taskData.patient.name}
                    </Text>
                  </View>
                </View>
              )}
              {taskData.patient?.roomNumber && (
                <View className="flex-row items-start">
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#6B7280"
                    className="mr-4 mt-1"
                  />
                  <View>
                    <Text className="text-sm font-medium text-gray-500">
                      Room
                    </Text>
                    <Text className="text-base text-gray-800 font-medium">
                      {taskData.patient.roomNumber}
                    </Text>
                  </View>
                </View>
              )}
              {taskData.patient?.createdBy && (
                <View className="flex-row items-start">
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color="#6B7280"
                    className="mr-4 mt-1"
                  />
                  <View>
                    <Text className="text-sm font-medium text-gray-500">
                      Assigned By
                    </Text>
                    <Text className="text-base text-gray-800 font-medium">
                      {`${taskData.patient.createdBy.role} ${taskData.patient.createdBy.firstName}`}
                    </Text>
                  </View>
                </View>
              )}
              <View className="flex-row items-start">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#6B7280"
                  className="mr-4 mt-1"
                />
                <View>
                  <Text className="text-sm font-medium text-gray-500">
                    Due Date
                  </Text>
                  <Text className="text-base text-gray-800 font-medium">
                    {new Date(taskData.dueDate).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        {currentAction ? (
          <TouchableOpacity
            onPress={() => handleStatusChange(currentAction.next)}
            className={`w-full items-center py-3.5 rounded-xl ${currentAction.color}`}
          >
            <Text className="text-white font-bold text-base">
              {currentAction.action}
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="w-full items-center py-3.5 rounded-xl bg-gray-300">
            <Text className="text-gray-500 font-bold text-base">
              Task Completed
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => {
            /* Handle delegate */
          }}
          className="w-full items-center py-3 rounded-xl mt-2"
        >
          <Text className="text-gray-700 font-semibold text-base">
            Delegate or Add Note
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
