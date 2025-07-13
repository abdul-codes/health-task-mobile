import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
//import useAuth from "../../hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { TaskPriority, TaskStatus } from "@/lib/types";

// Keep your existing interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface Patient {
  id: string;
  name: string;
  roomNumber: string;
}

type DueDateOption = "1_hour" | "4_hours" | "tomorrow" | "custom";

// Re-integrated QuickDueButton component
const QuickDueButton: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-3 py-2 rounded-lg border ${
      isActive
        ? "bg-blue-500 border-blue-500"
        : "bg-white border-gray-300"
    }`}
  >
    <Text
      className={`font-semibold ${isActive ? "text-white" : "text-gray-600"}`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// Re-integrated Zod schema
const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long"),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().datetime("Invalid due date").refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, "Due date must be in the future"),
  assignedToId: z.string().uuid("Invalid user ID format").optional(),
  patientId: z.string().uuid("Invalid patient ID format").optional(),
});

type CreateTaskInput = z.infer<typeof createTaskSchema>;

// Mock data (as it was in your file)
const commonTaskTitles = [
  "Administer Medication",
  "Check Vital Signs",
  "Patient Transport",
  "Update Patient Chart",
  "Collect Blood Sample",
  "Emergency Response",
  "Discharge Patient",
];

export default function CreateTaskScreen() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const titleInputRef = useRef<View>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(),
    assignedToId: "",
    patientId: "",
  });

  // UI state
  const [dueDateOption, setDueDateOption] = useState<DueDateOption>("custom");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [titleInputPosition, setTitleInputPosition] = useState({
    pageX: 0,
    pageY: 0,
    width: 0,
    height: 0,
  });

  // Mutation for creating a task
  const { mutate: createTask, isPending: isSubmitting } = useMutation({
    mutationFn: (taskData: CreateTaskInput) =>
      api.post("/tasks", taskData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.replace("/(tabs)/tasks");
      Alert.alert("Success", "Task created successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create task";
      Alert.alert("Error", message);
    },
  });

  // Fetch Users and Patients
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await api.get("/users/dropdown")
      return response.data.users; // Backend returns { users: [...] }
    },
    enabled: !!accessToken,
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async (): Promise<Patient[]> => {
      const response = await api.get("/patients")
      return response.data;
    },
    enabled: !!accessToken,
  });

  // Handlers
  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleTitleChange = (text: string) => {
    updateField("title", text);
    if (text.length > 0) {
      const filtered = commonTaskTitles.filter((task) =>
        task.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
      
      if (filtered.length > 0) {
        if (!isSuggestionsVisible) {
          measureTitleInput();
          setIsSuggestionsVisible(true);
        }
      } else {
        setIsSuggestionsVisible(false);
      }
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionSelect = (title: string) => {
    updateField("title", title);
    setIsSuggestionsVisible(false);
  };

  const measureTitleInput = () => {
    titleInputRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setTitleInputPosition({ pageX, pageY, width, height });
    });
  };

  const toggleSuggestions = () => {
    measureTitleInput();
    if (isSuggestionsVisible) {
      setIsSuggestionsVisible(false);
    } else {
      setSuggestions(commonTaskTitles);
      setIsSuggestionsVisible(true);
    }
  };

  const handleDueDateOptionSelect = (option: DueDateOption) => {
    setDueDateOption(option);
    const now = new Date();
    if (option === "custom") return;

    let newDueDate = new Date();
    if (option === "1_hour") newDueDate.setHours(now.getHours() + 1);
    else if (option === "4_hours") newDueDate.setHours(now.getHours() + 4);
    else if (option === "tomorrow") {
      newDueDate.setDate(now.getDate() + 1);
      newDueDate.setHours(9, 0, 0, 0);
    }
    updateField("dueDate", newDueDate);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const newDateTime = new Date(formData.dueDate);
      newDateTime.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      updateField("dueDate", newDateTime);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const newDateTime = new Date(formData.dueDate);
      newDateTime.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );
      updateField("dueDate", newDateTime);
    }
  };

  const validateForm = (): boolean => {
    try {
      createTaskSchema.parse({
        ...formData,
        dueDate: formData.dueDate.toISOString(),
        assignedToId: formData.assignedToId || undefined,
        patientId: formData.patientId || undefined,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0)
            newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors in the form.");
      return;
    }
    const newTask: CreateTaskInput = {
      ...formData,
      dueDate: formData.dueDate.toISOString(),
      assignedToId: formData.assignedToId || undefined,
      patientId: formData.patientId || undefined,
    };
    createTask(newTask);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center px-4 py-3 bg-white shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Create New Task</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Task Title <Text className="text-red-500">*</Text>
            </Text>
            <View
              ref={titleInputRef}
              onLayout={measureTitleInput}
              className={`flex-row items-center bg-white rounded-xl border ${
                errors.title ? "border-red-300" : "border-gray-200"
              }`}
            >
              <TextInput
                value={formData.title}
                onChangeText={handleTitleChange}
                onFocus={measureTitleInput}
                placeholder="Type or select a task title"
                className="flex-1 px-4 py-3 text-base text-gray-800"
                maxLength={100}
              />
              <TouchableOpacity onPress={toggleSuggestions} className="px-4">
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {errors.title && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.title}
              </Text>
            )}
          </View>

          {/* Description Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Description <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.description}
              onChangeText={(text) => updateField("description", text)}
              placeholder="Enter task description"
              multiline
              numberOfLines={4}
              className={`bg-white rounded-xl px-4 py-3 text-base border ${
                errors.description ? "border-red-300" : "border-gray-200"
              }`}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.description}
              </Text>
            )}
          </View>

          {/* Priority Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Priority
            </Text>
            <View className="bg-white rounded-xl border border-gray-200">
              <Picker
                selectedValue={formData.priority}
                onValueChange={(value) => updateField("priority", value)}
              >
                <Picker.Item label="Low Priority" value={TaskPriority.LOW} />
                <Picker.Item
                  label="Medium Priority"
                  value={TaskPriority.MEDIUM}
                />
                <Picker.Item label="High Priority" value={TaskPriority.HIGH} />
                <Picker.Item
                  label="Critical Priority"
                  value={TaskPriority.CRITICAL}
                />
              </Picker>
            </View>
          </View>

          {/* Due Date Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Due Date <Text className="text-red-500">*</Text>
            </Text>
            
            <View className="flex-row justify-between mb-4">
              <QuickDueButton
                label="In 1 hour"
                isActive={dueDateOption === "1_hour"}
                onPress={() => handleDueDateOptionSelect("1_hour")}
              />
              <QuickDueButton
                label="In 4 hours"
                isActive={dueDateOption === "4_hours"}
                onPress={() => handleDueDateOptionSelect("4_hours")}
              />
              <QuickDueButton
                label="Tomorrow"
                isActive={dueDateOption === "tomorrow"}
                onPress={() => handleDueDateOptionSelect("tomorrow")}
              />
              <QuickDueButton
                label="Custom"
                isActive={dueDateOption === "custom"}
                onPress={() => handleDueDateOptionSelect("custom")}
              />
            </View>

            {dueDateOption === "custom" && (
              <View className="flex-row space-x-2 mb-4">
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-white rounded-xl px-4 py-3 border border-gray-200 flex-1 flex-row items-center justify-between"
                >
                  <Text className="text-base text-gray-800">
                    {formData.dueDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  className="bg-white rounded-xl px-4 py-3 border border-gray-200 flex-1 flex-row items-center justify-between"
                >
                  <Text className="text-base text-gray-800">
                    {formData.dueDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}

            <View className="bg-gray-100 rounded-xl px-4 py-3">
              <Text className="text-base text-gray-800 font-semibold">
                Due: {formData.dueDate.toLocaleDateString()}{" "}
                {formData.dueDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            
            {errors.dueDate && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.dueDate}
              </Text>
            )}
          </View>

          {/* Assign To Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Assign To (Optional)
            </Text>
            <View className="bg-white rounded-xl border border-gray-200">
              <Picker
                selectedValue={formData.assignedToId}
                onValueChange={(value) => updateField("assignedToId", value)}
                enabled={!usersLoading}
              >
                <Picker.Item
                  label={
                    usersLoading ? "Loading..." : "Select user (optional)"
                  }
                  value=""
                />
                {users.map((user) => (
                  <Picker.Item
                    key={user.id}
                    label={`${user.firstName} ${user.lastName}`}
                    value={user.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Patient Field */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Patient (Optional)
            </Text>
            <View className="bg-white rounded-xl border border-gray-200">
              <Picker
                selectedValue={formData.patientId}
                onValueChange={(value) => updateField("patientId", value)}
                enabled={!patientsLoading}
              >
                <Picker.Item
                  label={
                    patientsLoading
                      ? "Loading..."
                      : "Select patient (optional)"
                  }
                  value=""
                />
                {patients.map((patient) => (
                  <Picker.Item
                    key={patient.id}
                    label={`${patient.name} - Room ${patient.roomNumber}`}
                    value={patient.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl mb-6 ${
              isSubmitting ? "bg-gray-400" : "bg-blue-600"
            }`}
          >
            <Text className="text-white font-bold text-center text-lg">
              {isSubmitting ? "Creating Task..." : "Create Task"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-full py-4 rounded-xl border border-gray-300 mb-8"
          >
            <Text className="text-gray-700 font-semibold text-center text-lg">
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODALS */}
      <Modal
        visible={isSuggestionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSuggestionsVisible(false)}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => setIsSuggestionsVisible(false)}
          activeOpacity={1}
        >
          <View
            style={[
              styles.suggestionsContainer,
              {
                top: titleInputPosition.pageY + titleInputPosition.height,
                left: titleInputPosition.pageX,
                width: titleInputPosition.width,
              },
            ]}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSuggestionSelect(item)}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dueDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={formData.dueDate}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  suggestionsContainer: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 192,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  suggestionText: {
    fontSize: 16,
    color: "#1F2937",
  },
});
