import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

// Zod schema for robust validation
const patientSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." }),
  dob: z.date({
    required_error: "Please select a date of birth.",
    invalid_type_error: "That's not a valid date!",
  }),
  roomNumber: z.string().optional(),
  medicalRecord: z
    .string()
    .min(10, {
      message: "Medical record must be at least 10 characters long.",
    }),
});

// Infer the type from the schema
type PatientFormData = z.infer<typeof patientSchema>;

export default function CreatePatientScreen() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [roomNumber, setRoomNumber] = useState("");
  const [medicalRecord, setMedicalRecord] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const createPatientMutation = useMutation({
    mutationFn: (data: PatientFormData) => {
      // The API URL should be in an environment variable
      return axios.post("http://192.168.0.3:8000/api/patients", data);
    },
    onSuccess: () => {
      Alert.alert("Success", "Patient created successfully.");
      if (router.canGoBack()) {
        router.back();
      }
    },
    onError: (error: any) => {
      console.error("Patient creation error:", error.response?.data);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create patient.",
      );
    },
  });

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const handleCreatePatient = () => {
    // Validate form data with Zod
    const result = patientSchema.safeParse({
      name,
      dob,
      roomNumber,
      medicalRecord,
    });

    if (!result.success) {
      // Get the first validation error message
      const errorMessage =
        result.error.errors[0]?.message || "Please check the patient details.";
      Alert.alert("Validation Error", errorMessage);
      return;
    }

    // If validation passes, proceed with the mutation
    createPatientMutation.mutate(result.data);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="flex-1 justify-center py-8">
            {/* Header */}
            <View className="mb-8">
              <View className="items-center mb-8">
                <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                  <Ionicons
                    name="person-add-outline"
                    size={40}
                    color="#3B82F6"
                  />
                </View>
                <Text className="text-3xl font-bold text-gray-900 mb-2">
                  Add New Patient
                </Text>
                <Text className="text-gray-600 text-center">
                  Fill in the details to create a new patient record.
                </Text>
              </View>

              {/* Patient Creation Form */}
              <View className="space-y-4">
                {/* Full Name Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    Full Name
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 pr-12"
                      placeholder="Enter patient's full name"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                    <View className="absolute right-4 top-4">
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>

                {/* Date of Birth Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    Date of Birth
                  </Text>
                  <TouchableOpacity
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl flex-row justify-between items-center"
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text className={dob ? "text-gray-900" : "text-[#9CA3AF]"}>
                      {dob ? dob.toLocaleDateString() : "Select date of birth"}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dob || new Date()}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      maximumDate={new Date()} // A patient cannot be born in the future
                    />
                  )}
                </View>

                {/* Room Number Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    Room Number (Optional)
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 pr-12"
                      placeholder="Enter assigned room number"
                      placeholderTextColor="#9CA3AF"
                      value={roomNumber}
                      onChangeText={setRoomNumber}
                      keyboardType="numeric"
                    />
                    <View className="absolute right-4 top-4">
                      <Ionicons name="bed-outline" size={20} color="#9CA3AF" />
                    </View>
                  </View>
                </View>

                {/* Medical Record Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    Medical Record
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 pr-12 h-28"
                      placeholder="Enter brief medical history or reason for admission"
                      placeholderTextColor="#9CA3AF"
                      value={medicalRecord}
                      onChangeText={setMedicalRecord}
                      multiline={true}
                      textAlignVertical="top"
                    />
                    <View className="absolute right-4 top-4">
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>

                {/* Create Patient Button */}
                <TouchableOpacity
                  className={`w-full py-4 rounded-xl items-center justify-center mt-6 ${
                    createPatientMutation.isPending
                      ? "bg-blue-400"
                      : "bg-blue-600"
                  }`}
                  onPress={handleCreatePatient}
                  disabled={createPatientMutation.isPending}
                >
                  {createPatientMutation.isPending ? (
                    <Text className="text-white font-semibold text-lg">
                      Creating Record...
                    </Text>
                  ) : (
                    <Text className="text-white font-semibold text-lg">
                      Create Patient Record
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  className="w-full py-4 rounded-xl items-center justify-center mt-2 bg-gray-200"
                  onPress={() => router.canGoBack() && router.back()}
                  disabled={createPatientMutation.isPending}
                >
                  <Text className="text-gray-800 font-semibold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
