// app/(tabs)/tasks/[id].tsx
// Task Details Screen - Updated to use mock data for testing
// 
// Changes made:
// 1. Replaced API calls (getTaskById, useTask, useQuery) with mock data lookup
// 2. Updated type definitions to match shared mock data structure
// 3. Aligned priority and status values with mock data format
// 4. Removed loading states since mock data is synchronous
// 5. Updated button logic to work with mock status values

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Import Shared Mock Data ---
// Using shared mock data instead of API calls for testing
import { findTaskById, Priority } from '../../../lib/mockData';





// Map mock data priority values to banner styles
const priorityBannerClasses: Record<Priority, string> = {
  Critical: 'bg-red-600',
  High: 'bg-yellow-500',
  Normal: 'bg-green-500',
  Low: 'bg-blue-500',
};

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find task from mock data instead of API call
  const taskData = findTaskById(id);

  // Handle case when task is not found
  if (!taskData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-red-500 text-lg">
          Task not found.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-500">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }


  // Map mock data status values to button labels
  const primaryLabel =
    taskData.status === 'New'
      ? 'Acknowledge & Start'
      : taskData.status === 'In Progress'
        ? 'Mark as Complete'
        : 'Completed';

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white shadow">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Task Details</Text>
      </View>

      {/* Priority Banner */}
      <View className={`py-2 items-center ${priorityBannerClasses[taskData.priority]}`}>
        <Text className="text-white font-semibold">
          {taskData.priority.toUpperCase()} PRIORITY TASK
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Description */}
        <Text className="text-2xl font-bold text-gray-800 mb-2">{taskData.title}</Text>

        {taskData.description && (
          <Text className="text-base text-gray-600 leading-relaxed mb-6">
            {taskData.description}
          </Text>
        )}

        {/* Key Information */}
        <View className="bg-white rounded-2xl p-4 shadow mb-6">
          {taskData.patient && (
            <View className="flex-row mb-3">
              <Text className="w-32 font-medium text-gray-600">Patient</Text>
              <Text className="flex-1 text-gray-800">{taskData.patient.name}</Text>
            </View>
          )}
          {taskData.patient?.roomNumber && (
            <View className="flex-row mb-3">
              <Text className="w-32 font-medium text-gray-600">Room</Text>
              <Text className="flex-1 text-gray-800">{taskData.patient?.roomNumber}</Text>
            </View>
          )}
          {taskData.patient && (
            <View className="flex-row mb-3">
              <Text className="w-32 font-medium text-gray-600">Assigned By</Text>
              <Text className="flex-1 text-gray-800">
                {taskData.patient?.createdBy
                  ? `${taskData.patient.createdBy.role} ${taskData.patient.createdBy.firstName}`
                  : 'Unknown'}
              </Text>
            </View>
          )}
          <View className="flex-row">
            <Text className="w-32 font-medium text-gray-600">Due</Text>
            <Text className="flex-1 text-gray-800">
              {new Date(taskData.dueDate).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {/* <View className="mb-32">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Notes</Text>
          <TextInput
            multiline
            placeholder="Add notes..."
            value={note}
            onChangeText={setNote}
            className="min-h-[120px] bg-white rounded-2xl p-4 text-base text-gray-800 shadow"
            textAlignVertical="top"
          />
        </View> */}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <TouchableOpacity
          disabled={taskData.status === 'Completed'}
          className={`w-full items-center py-3 rounded-xl mb-2 ${taskData.status === 'Completed' ? 'bg-gray-300' : 'bg-blue-600'
            }`}
        >
          <Text className="text-white font-bold text-base">{primaryLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="w-full items-center py-3 rounded-xl border border-gray-300">
          <Text className="text-gray-800 font-semibold text-base">Delegate Task</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}