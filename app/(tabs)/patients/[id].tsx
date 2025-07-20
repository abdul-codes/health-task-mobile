import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "@/lib/api";

// Types based on Prisma schema for a detailed patient view
type Task = {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate: string; // ISO date string
};

type PatientDetail = {
  id: string;
  name: string;
  dob: string; // ISO date string
  roomNumber: string | null;
  medicalRecord: string
  tasks: Task[];
  createdBy: {
    firstName: string;
    lastName: string;
  } | null;
};

// --- API Fetching ---
const fetchPatientById = async (id: string): Promise<PatientDetail> => {
  const { data } = await api.get(`/patients/${id}`);
  return data;
};

// --- Helper Functions & Components ---

// Calculate age from date of birth
const getAge = (dobString: string) => {
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Priority and Status styling
const priorityStyles = {
  LOW: { bg: "bg-blue-100", text: "text-blue-800", icon: "arrow-down" },
  MEDIUM: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "arrow-forward" },
  HIGH: { bg: "bg-orange-100", text: "text-orange-800", icon: "arrow-up" },
  CRITICAL: { bg: "bg-red-100", text: "text-red-800", icon: "alert-circle" },
};

const statusStyles = {
  PENDING: { bg: "bg-gray-200", text: "text-gray-800" },
  IN_PROGRESS: { bg: "bg-indigo-200", text: "text-indigo-800" },
  COMPLETED: { bg: "bg-green-200", text: "text-green-800" },
  CANCELLED: { bg: "bg-red-200", text: "text-red-800" },
};

// Card for displaying a single task
const TaskListItem = ({ item }: { item: Task }) => {
  const priority = priorityStyles[item.priority];
  const status = statusStyles[item.status];

  return (
    <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm mb-3 border-l-4 border-blue-500">
      <View className="flex-row justify-between items-start">
        <Text className="text-base font-bold text-gray-800 flex-1 pr-2">{item.title}</Text>
        <View className={`px-2 py-1 rounded-full ${status.bg}`}>
          <Text className={`text-xs font-bold uppercase ${status.text}`}>{item.status}</Text>
        </View>
      </View>
      <View className="flex-row items-center mt-3">
        <View className={`flex-row items-center mr-4 px-2 py-0.5 rounded-full ${priority.bg}`}>
          <Ionicons name={priority.icon as any} size={12} color={priority.text.replace("text-", "")} />
          <Text className={`text-xs font-semibold ml-1 ${priority.text}`}>{item.priority}</Text>
        </View>
        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
        <Text className="text-sm text-gray-600 ml-1">
          Due: {new Date(item.dueDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// --- Main Screen Component ---
export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: patient,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PatientDetail, Error>({
    queryKey: ["patient", id],
    queryFn: () => fetchPatientById(id!),
    enabled: !!id, // Ensure query only runs when id is available
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      );
    }

    if (isError) {
      return (
        <View className="flex-1 justify-center items-center p-8 text-center">
          <Ionicons name="cloud-offline-outline" size={60} color="#EF4444" />
          <Text className="text-lg font-semibold text-red-600 mt-4">Error fetching patient data</Text>
          <Text className="text-gray-500 mt-1">{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} className="mt-6 bg-blue-600 px-6 py-2 rounded-lg">
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!patient) return null;

    return (
      <FlatList
        data={patient.tasks}
        renderItem={TaskListItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View className="mb-6">
            <View className="bg-white p-5 rounded-xl shadow-md">
              <View className="flex-row items-center">
                <Ionicons name="person-circle-outline" size={48} color="#3B82F6" className="mr-4"/>
                <View>
                  <Text className="text-2xl font-bold text-gray-900">{patient.name}</Text>
                   <Text className="text-base text-gray-600">
                    {getAge(patient.dob)} years old (DOB: {new Date(patient.dob).toLocaleDateString()})
                  </Text>
                </View>
              </View>
              <View className="border-t border-gray-200 mt-4 pt-4">
                {patient.roomNumber && (
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="bed-outline" size={20} color="#4B5563" />
                    <Text className="text-base text-gray-800 ml-3">Room {patient.roomNumber}</Text>
                  </View>
                )}
                {patient.createdBy && (
                   <View className="flex-row items-center">
                     <Ionicons name="git-branch-outline" size={20} color="#4B5563" />
                     <Text className="text-base text-gray-800 ml-3">
                       Managed by: Dr. {patient.createdBy.firstName} {patient.createdBy.lastName}
                     </Text>
                   </View>
                )}
              </View>
              {patient.medicalRecord && (
                <View className="flex-row items-center">
                  <Ionicons name="document-text-outline" size={20} color="#4B5563" />
                  <Text className="text-base text-gray-800 ml-3">
                    Medical Record: {patient.medicalRecord}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xl font-bold text-gray-800 mt-8 mb-2 px-1">Tasks ({patient.tasks.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View className="justify-center items-center bg-gray-50 p-8 rounded-lg">
            <Ionicons name="checkmark-done-circle-outline" size={50} color="#9CA3AF" />
            <Text className="text-lg font-semibold text-gray-700 mt-3">No Tasks Found</Text>
            <Text className="text-gray-500 mt-1 text-center">This patient has no pending or completed tasks.</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: patient?.name || "Patient Details", headerBackTitle: "Patients" }} />
      {renderContent()}
      {/* Floating Action Button to Add a New Task */}
      {patient && (
         <Link href={{ pathname: "/tasks/create", params: { patientId: patient.id, patientName: patient.name } }} asChild>
          <TouchableOpacity className="absolute bottom-6 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg">
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </Link>
      )}
    </SafeAreaView>
  );
}
