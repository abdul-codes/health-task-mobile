import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

// Types for the task object. In production we would probably share this via a central types file.
type Task = {
  id: number;
  title: string;
  description?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'In Progress' | 'Completed';
  patientName?: string;
  roomNumber?: string;
  assignedBy?: string;
  dueDate: string;
  notes?: string;
};

const priorityBannerClasses: Record<Task['priority'], string> = {
  Critical: 'bg-red-600',
  High: 'bg-yellow-500',
  Medium: 'bg-green-500',
  Low: 'bg-blue-500',
};

export default function TaskDetailsScreen() {
  const { task } = useLocalSearchParams<{ task: string }>();
  const taskData = JSON.parse(task) as Task;
  const [note, setNote] = useState(taskData.notes ?? '');

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
          {taskData.priority.toUpperCase()} TASK
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
          {taskData.patientName && (
            <View className="flex-row mb-3">
              <Text className="w-32 font-medium text-gray-600">Patient</Text>
              <Text className="flex-1 text-gray-800">{taskData.patientName}</Text>
            </View>
          )}
          {taskData.roomNumber && (
            <View className="flex-row mb-3">
              <Text className="w-32 font-medium text-gray-600">Room</Text>
              <Text className="flex-1 text-gray-800">{taskData.roomNumber}</Text>
            </View>
          )}
          {taskData.assignedBy && (
            <View className="flex-row mb-3">
              <Text className="w-32 font-medium text-gray-600">Assigned By</Text>
              <Text className="flex-1 text-gray-800">{taskData.assignedBy}</Text>
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
        <View className="mb-32">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Notes</Text>
          <TextInput
            multiline
            placeholder="Add notes..."
            value={note}
            onChangeText={setNote}
            className="min-h-[120px] bg-white rounded-2xl p-4 text-base text-gray-800 shadow"
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <TouchableOpacity
          disabled={taskData.status === 'Completed'}
          className={`w-full items-center py-3 rounded-xl mb-2 ${
            taskData.status === 'Completed' ? 'bg-gray-300' : 'bg-blue-600'
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