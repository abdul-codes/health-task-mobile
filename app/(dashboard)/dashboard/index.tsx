// app/index.tsx
// This is the main screen for your app, following Expo Router conventions.
// Ensure you have nativewind, typescript, and @expo/vector-icons installed.
// NOTE: We are now using standard components with `className` instead of the deprecated `styled` HOC.

import React from 'react';
import { View, Text, ScrollView, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';

// --- Type Definitions ---
// Defining types for our data structures and component props

type Priority = 'Critical' | 'High' | 'Normal' | 'Low';
type Status = 'New' | 'In Progress' | 'Completed';

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
    dueDate: "2025-06-16T10:00:00Z" // Note: Using a future date for demonstration
  },
  {
    id: "task102",
    title: "Check Vital Signs",
    patient: { name: "Jane Smith", roomNumber: "302B" },
    priority: "High",
    status: "New",
    dueDate: "2025-06-16T10:15:00Z"
  },
  {
    id: "task103",
    title: "Update Patient Chart",
    patient: { name: "Robert Brown", roomNumber: "305A" },
    priority: "Normal",
    status: "In Progress",
    dueDate: "2025-06-16T10:30:00Z"
  },
  {
    id: "task104",
    title: "Prepare for Discharge",
    patient: { name: "Emily White", roomNumber: "303C" },
    priority: "Normal",
    status: "New",
    dueDate: "2025-06-16T11:00:00Z"
  },
  {
    id: "task105",
    title: "Change IV Drip",
    patient: { name: "Michael Johnson", roomNumber: "301A" },
    priority: "Low",
    status: "Completed",
    dueDate: "2025-06-16T11:30:00Z"
  }
];

// --- Reusable Components ---

interface SummaryCardProps {
  title: string;
  count: number;
  iconName: keyof typeof Feather.glyphMap; // Ensures icon name is valid
  color?: string; // Color is now optional
  isCritical?: boolean;
}

const SummaryCard = ({ title, count, iconName, color, isCritical = false }: SummaryCardProps) => {
  const cardClasses = `bg-white p-4 rounded-xl flex-1 mx-2 shadow-sm`;
  const criticalCardClasses = `bg-red-50 border border-red-200`;
  
  return (
    <View className={`${cardClasses} ${isCritical ? criticalCardClasses : ''}`}>
      <View className="flex-row justify-between items-start">
        <Text className={`text-base font-medium ${isCritical ? 'text-red-800' : 'text-gray-600'}`}>
          {title}
        </Text>
        <Feather name={iconName} size={22} color={isCritical ? '#DC2626' : color} />
      </View>
      <Text className={`text-4xl font-bold mt-2 ${isCritical ? 'text-red-900' : 'text-gray-800'}`}>
        {count}
      </Text>
    </View>
  );
};

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const priorityStyles: Record<Priority, { tag: string; text: string }> = {
    Critical: { tag: "bg-red-100 text-red-700", text: "Critical" },
    High: { tag: "bg-yellow-100 text-yellow-700", text: "High" },
    Normal: { tag: "bg-blue-100 text-blue-700", text: "Normal" },
    Low: { tag: "bg-gray-200 text-gray-700", text: "Low" },
  };

  const currentPriority = priorityStyles[task.priority];

  const formattedTime = new Date(task.dueDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Link href={{ pathname: `/tasks/[id]`, params: { id: task.id } }} asChild>
      <TouchableOpacity className="bg-white p-4 rounded-xl mb-4 shadow-sm active:bg-gray-100">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">{task.title}</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Patient: {task.patient.name} - Room: {task.patient.roomNumber}
            </Text>
          </View>
          <Text className="text-base font-semibold text-gray-700 ml-2">{formattedTime}</Text>
        </View>
        <View className="flex-row justify-start items-center mt-3">
            <View className={`px-3 py-1 rounded-full ${currentPriority.tag}`}>
                <Text className={`text-xs font-bold ${currentPriority.tag.split(' ')[1]}`}>{currentPriority.text}</Text>
            </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

// --- Main Dashboard Screen ---
export default function DashboardScreen() {
  const newTasksCount = mockTasks.filter(t => t.status === 'New').length;
  const allTasksCount = mockTasks.filter(t => t.status !== 'Completed').length;
  const criticalTasksCount = mockTasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <ScrollView>
        <View className="p-5">
          {/* --- Header --- */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-bold text-gray-800">Good Morning,</Text>
              <Text className="text-2xl font-bold text-blue-600">Emily Carter</Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity className="mr-4">
                <Feather name="bell" size={26} color="#374151" />
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 justify-center items-center">
                   <Text className="text-white text-xs font-bold">3</Text>
                </View>
              </TouchableOpacity>
              <Image
                source={{ uri: 'https://i.pravatar.cc/150?u=emilycarter' }}
                className="w-12 h-12 rounded-full"
              />
            </View>
          </View>

          {/* --- Summary Cards --- */}
          <View className="flex-row justify-center mb-6">
            <SummaryCard title="New Tasks" count={newTasksCount} iconName="plus-circle" color="#3B82F6" />
            <SummaryCard title="All Tasks" count={allTasksCount} iconName="list" color="#10B981" />
            <SummaryCard title="Critical Tasks" count={criticalTasksCount} iconName="alert-triangle" color="#DC2626" isCritical />
          </View>

          {/* --- Due Soon Task List --- */}
          <View>
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Due Soon</Text>
                <Link href="/tasks" asChild>
                    <TouchableOpacity>
                        <Text className="text-blue-600 font-semibold">See All</Text>
                    </TouchableOpacity>
                </Link>
            </View>
            
            {mockTasks
              .filter(task => task.status !== 'Completed')
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
