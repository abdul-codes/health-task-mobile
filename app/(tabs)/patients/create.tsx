import React, { useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
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
import { useRouter } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import api from "@/lib/api";

const patientSchema = z.object({
  name: z.string().min(2, { message: "Patient name must be at least 2 characters." }),
  dob: z.date({ required_error: "Date of Birth is required." }),
  roomNumber: z.string().optional(),
  medicalRecord: z.string().min(10, { message: "Medical record must be at least 10 characters." }),
  assignedToIds: z.string().array().min(1, { message: "Please assign at least one staff member." }), // Fixed array type
});

type PatientFormData = z.infer<typeof patientSchema>;

type User = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

const fetchAssignableUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>("/users/dropdown"); // Direct array response
  // console.log("fetchAssignableUsers",data);
  return data || [];
};


const StaffAssignment = ({
  staff,
  selectedStaffIds,
  onStaffSelectionChange,
  isLoading,
  error,
}: {
  staff: User[];
  selectedStaffIds: string[];
  onStaffSelectionChange: (ids: string[]) => void;
  isLoading: boolean;
  error: boolean;
}) => {
  const { doctors, nurses } = useMemo(() => {
    const doctors: User[] = [];
    const nurses: User[] = [];
    const normalizeRole = (role: string) => role.toLowerCase().trim();

    staff.forEach(user => {
      const role = normalizeRole(user.role);
      if (role === 'doctor') doctors.push(user);
      else if (role === 'nurse') nurses.push(user);
    });
    
    return { doctors, nurses };
  }, [staff]);

  const handleStaffToggle = useCallback((staffId: string) => {
    const newSelectedIds = selectedStaffIds.includes(staffId)
      ? selectedStaffIds.filter(id => id !== staffId)
      : [...selectedStaffIds, staffId];
    onStaffSelectionChange(newSelectedIds);
  }, [selectedStaffIds, onStaffSelectionChange]);

  const renderStaffMember = (member: User) => {
    const isSelected = selectedStaffIds.includes(member.id);
   // const normalizedRole = member.role.toLowerCase().trim();
    return (
      <TouchableOpacity
        key={member.id}
        className={`flex-row items-center p-3 mb-2 rounded-lg border ${
          isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
        }`}
        onPress={() => handleStaffToggle(member.id)}
      >
        <Ionicons 
          name={isSelected ? 'checkbox' : 'square-outline'} 
          size={24} 
          color={isSelected ? '#3B82F6' : '#9CA3AF'} 
        />
        <View className="ml-3 flex-1">
          <Text className="font-medium text-gray-900">
            {member.firstName} {member.lastName}  
          </Text>
          <View className="flex-row items-center mt-1">
            <View className={`px-2 py-1 rounded-full ${member.role === 'doctor' ? 'bg-green-100' : 'bg-blue-100'}`}>
              <Text className={`text-xs font-medium ${member.role === 'doctor' ? 'text-green-800' : 'text-blue-800'}`}>
                {member.role.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderStaffGroup = (title: string, members: User[]) => {
    if (members.length === 0) return null;
    return (
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">
          {title} ({members.length})
        </Text>
        {members.map(renderStaffMember)}
      </View>
    );
  };
  
  if (error) {
    return (
      <View className="p-4 bg-red-50 rounded-lg">
        <Text className="text-red-600">Error loading staff members</Text>
      </View>
    );
  }
  
  return (
    <View className="w-full border border-gray-200 rounded-xl p-3">
      {isLoading ? (
        <View className="h-40 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">Loading staff...</Text>
        </View>
      ) : (
        <>
          {renderStaffGroup('Doctors', doctors)}
          {renderStaffGroup('Nurses', nurses)}
          
          {staff.length === 0 && !error && (
            <View className="h-40 justify-center items-center">
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text className="mt-2 text-gray-600">No staff members found</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};


export default function CreatePatientScreen() {
  const router = useRouter(); 
  const queryClient = useQueryClient(); 
  
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [roomNumber, setRoomNumber] = useState("");
  const [medicalRecord, setMedicalRecord] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { 
    data: users = [], 
    isLoading: isLoadingUsers, 
    isError: isUsersError 
  } = useQuery<User[], Error>({
    queryKey: ["assignableUsers"],
    queryFn: fetchAssignableUsers,
  });
  
  const resetForm = () => {
    setName("");
    setDob(undefined);
    setRoomNumber("");
    setMedicalRecord("");
    setSelectedUserIds([]);
  };

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: (data: PatientFormData) => api.post("/patients", data),
    onSuccess: () => {
      // Invalidate patient queries
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      Alert.alert("Success", "Patient created successfully", [
        { 
          text: "OK", 
          onPress: () => {
            resetForm()
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/patients'); // Fallback navigation
            }
          }
        }
      ]);
    },
    onError: (error: any) => {
      console.error("Patient creation error:", error);
      Alert.alert(
        "Error", 
        error.response?.data?.message || error.message || "Failed to create patient."
      );
    },
  });

  // Date picker handler
  const onDateChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false); // Always hide picker first
    
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  // Form submission handler
  const handleCreatePatient = () => {
    // Prevent duplicate submissions
    if (createPatientMutation.isPending) return;
    
    const result = patientSchema.safeParse({
      name: name.trim(),
      dob,
      roomNumber: roomNumber.trim() || undefined,
      medicalRecord: medicalRecord.trim(),
      assignedToIds: selectedUserIds,
    });

    if (!result.success) {
      Alert.alert("Validation Error", result.error.errors[0]?.message || "Invalid form data");
      return;
    }

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
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="person-add-outline" size={40} color="#3B82F6" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">Add New Patient</Text>
              <Text className="text-gray-600 text-center">Fill in the details and assign medical staff</Text>
            </View>

            {/* Form Fields */}
            <View className="space-y-4">
              {/* Name */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Full Name *</Text>
                <TextInput
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  placeholder="Enter patient's full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
              
              {/* Date of Birth */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Date of Birth *</Text>
                <TouchableOpacity
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl flex-row justify-between items-center"
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className={dob ? "text-gray-900" : "text-gray-400"}>
                    {dob ? dob.toLocaleDateString() : "Select date"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker 
                    value={dob || new Date()} 
                    mode="date" 
                    display="default" 
                    onChange={onDateChange} 
                    maximumDate={new Date()} 
                  />
                )}
              </View>
              
              {/* Room Number */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Room Number</Text>
                <TextInput
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  placeholder="Enter room number (optional)"
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                />
              </View>
              
              {/* Medical Record */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Medical Record *</Text>
                <TextInput
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 h-28"
                  placeholder="Medical history, condition, etc."
                  value={medicalRecord}
                  onChangeText={setMedicalRecord}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              
              {/* Staff Assignment */}
              <View>
                <Text className="text-gray-700 font-medium mb-2">Assign to Staff *</Text>
                <StaffAssignment 
                  staff={users} 
                  selectedStaffIds={selectedUserIds} 
                  onStaffSelectionChange={setSelectedUserIds} 
                  isLoading={isLoadingUsers} 
                  error={isUsersError} 
                />
              </View>

              {/* Selected Count Display */}
              {selectedUserIds.length > 0 && (
                <View className="p-3 bg-blue-50 rounded-lg">
                  <Text className="text-sm font-medium text-blue-900">
                    {selectedUserIds.length} staff member{selectedUserIds.length !== 1 ? 's' : ''} selected
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                className={`w-full py-4 rounded-xl items-center justify-center mt-6 ${
                  createPatientMutation.isPending ? "bg-blue-400" : "bg-blue-600"
                }`}
                onPress={handleCreatePatient}
                disabled={createPatientMutation.isPending}
              >
                {createPatientMutation.isPending ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-semibold text-lg ml-2">
                      Creating Patient...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    Create Patient
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}