import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Link, useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// NOTE: This type is based on the `getAllPatients` controller response.
// It currently fetches all patients from the database. To show patients
// "assigned to the user", the backend API and database schema would need to be updated
// to support that relationship.
type Patient = {
  id: string;
  name: string;
  dob: string; // ISO date string
  roomNumber: string | null;
  createdBy: {
    firstName: string;
    lastName: string;
  } | null;
};

// Fetches the list of all patients from the backend
const fetchPatients = async (): Promise<Patient[]> => {
  // Using the same hardcoded IP as in other files. This should be moved to an env variable.

   
  const { data } = await api.get("/patients");
  return data;
  // console.error("Failed to fetch patients:", error);
   // Alert.alert("'Network Error' Please try again");
 
};

// A card component to display individual patient information
const PatientCard = ({ item }: { item: Patient }) => (
  <Link href={{ pathname: "/patients/[id]", params: { id: item.id, name: item.name } }} asChild>
    <TouchableOpacity>
      <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
            <Ionicons name="person-outline" size={28} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
            <Text className="text-sm text-gray-600 mt-1">
              DOB: {new Date(item.dob).toLocaleDateString()}
            </Text>
          </View>
          {item.roomNumber && (
            <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full">
              <Ionicons name="bed-outline" size={16} color="#4B5563" />
              <Text className="text-sm font-semibold text-gray-700 ml-1">
                {item.roomNumber}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  </Link>
);

export default function PatientsScreen() {
  const {
    data: patients,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Patient[], Error>({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  // useFocusEffect is a hook from expo-router that refetches data
  // every time the screen comes into focus. This ensures the list is
  // up-to-date after creating a new patient and navigating back.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading Patients...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View className="flex-1 justify-center items-center p-8">
          <Ionicons name="cloud-offline-outline" size={60} color="#EF4444" />
          <Text className="text-lg font-semibold text-red-500 mt-4 text-center">
            Network Error fetching patients
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
        </View>
      );
    }

    if (patients?.length === 0) {
      return (
        <View className="flex-1 justify-center items-center p-8">
          <Ionicons name="people-outline" size={60} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-gray-700 mt-4">
            No Patients Found
          </Text>
          <Text className="text-gray-500 mt-1">
            Tap the + button to add the first patient.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={patients}
        renderItem={PatientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center bg-gray-50">
        <Text className="text-3xl font-bold text-gray-900">Patients</Text>
        <Link href="/patients/create" asChild>
          <TouchableOpacity className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow">
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Link>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}
