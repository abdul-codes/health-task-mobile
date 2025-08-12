import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { TaskPriority, TaskStatus } from "@/lib/types";

// Keep your existing interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
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
      isActive ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
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
  title: z
    .string()
    .min(3, "Task title must be at least 3 characters long")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(
      10,
      "Please write a detailed description of at least 10 characters long",
    ),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z
    .string()
    .datetime("Invalid due date")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, "Due date must be in the future"),
  assignedToId: z.string().cuid("Invalid user ID format").optional(),
  patientId: z.string().cuid("Invalid patient ID format").optional(),
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
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    patientId?: string;
    patientName?: string;
  }>();

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
  const titleInputRef = useRef<TextInput>(null);
  const [titleInputPosition, setTitleInputPosition] = useState({
    pageX: 0,
    pageY: 0,
    width: 0,
    height: 0,
  });

  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prevErrors) => {
      if (prevErrors[field]) {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      }
      return prevErrors;
    });
  }, []); // Empt

  useEffect(() => {
    if (params.patientId) {
      updateField("patientId", params.patientId);
    }
  }, [params.patientId, updateField]);

  // Mutation for creating a task
  const { mutate: createTask, isPending: isSubmitting } = useMutation({
    mutationFn: (taskData: CreateTaskInput) =>
      api.post("/tasks", taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["patient", params.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "dashboard", user?.id],
      });
      // Also invalidate the specific patient query if a task was assigned to them
      if (params.patientId) {
        queryClient.invalidateQueries({
          queryKey: ["patient", params.patientId],
        });
      }

      // router.replace("/tasks");
      //   // If we can go back, do it. Otherwise, go to the tasks list.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/tasks");
      }
      Alert.alert("Success", "Task created successfully!");
      resetForm();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create task";
      Alert.alert("Error", message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(),
      assignedToId: "",
      patientId: "",
    });
    setDueDateOption("custom");
    setErrors({});
  };

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["usersForDropdown", user?.id],
    queryFn: async () => {
      // Correctly handle the direct array response
      const { data } = await api.get<User[]>("/users/dropdown");
      return data || []; // Return the array directly, or an empty array as a fallback
    },
    enabled: !!accessToken && !!user?.id,
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients", user?.id],
    queryFn: async (): Promise<Patient[]> => {
      const response = await api.get("/patients/dropdown");
      return response.data;
    },
    enabled: !!accessToken && !!user?.id,
  });

  // Handlers
  const handleTitleChange = (text: string) => {
    updateField("title", text);
    if (text.length > 1) {
      const filtered = commonTaskTitles.filter((task) =>
        task.toLowerCase().includes(text.toLowerCase()),
      );
      setSuggestions(filtered);

      setIsSuggestionsVisible(
        filtered.length > 0 && filtered.length < commonTaskTitles.length,
      );
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionSelect = (title: string) => {
    updateField("title", title);
    setIsSuggestionsVisible(false);
    titleInputRef.current?.blur(); // Blur the input to signify completion
  };

  const measureTitleInput = () => {
    titleInputRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setTitleInputPosition({ pageX, pageY, width, height });
    });
  };

  const handleFocus = () => {
    measureTitleInput();
    // Show suggestions on focus if there's already text
    if (formData.title.length > 0) {
      setIsSuggestionsVisible(true);
    }
  };

  const handleBlur = () => {
    // Hide suggestions when the input loses focus
    setIsSuggestionsVisible(false);
  };

  const toggleSuggestions = () => {
    if (isSuggestionsVisible) {
      setIsSuggestionsVisible(false);
    } else {
      measureTitleInput();
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
        selectedDate.getDate(),
      );
      updateField("dueDate", newDateTime);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const newDateTime = new Date(formData.dueDate);
      newDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
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
              className={`flex-row items-center bg-white rounded-xl border ${
                errors.title ? "border-red-300" : "border-gray-200"
              }`}
            >
              <TextInput
                value={formData.title}
                ref={titleInputRef}
                onChangeText={handleTitleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Type or select a task title"
                className="flex-1 px-4 py-3 text-base text-gray-800"
                maxLength={100}
              />
              <TouchableOpacity onPress={toggleSuggestions} className="px-4">
                <Ionicons
                  name={isSuggestionsVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.title && (
              <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>
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
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.priority}
                onValueChange={(value) => updateField("priority", value)}
                style={styles.picker}
              >
                <Picker.Item
                  label="Select Priority"
                  value=""
                  color={Platform.OS === "ios" ? "#9CA3AF" : undefined}
                />
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
                      hour12: true,
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
              Assign To
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                key={`users-${users.length}`}
                selectedValue={formData.assignedToId}
                onValueChange={(value) => updateField("assignedToId", value)}
                enabled={!usersLoading}
                style={styles.picker}
              >
                <Picker.Item
                  label="Select staff"
                  value=""
                  color={Platform.OS === "ios" ? "#9CA3AF" : undefined}
                />
                {users.map((user) => (
                  <Picker.Item
                    key={user.id}
                    label={`${user.firstName} ${user.lastName} (${user.role})`}
                    value={user.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Patient Field */}
          <View className="mb-8">
            {params.patientName ? (
              <View>
                <Text className="text-base font-semibold text-gray-700 mb-2">
                  Patient
                </Text>
                <View className="bg-gray-100 rounded-xl px-4 py-4">
                  <Text className="text-base text-gray-800 font-semibold">
                    {params.patientName}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <Text className="text-base font-semibold text-gray-700 mb-2">
                  Patient
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    //  key={`patients-${patients.length}`}
                    selectedValue={formData.patientId}
                    onValueChange={(value) => updateField("patientId", value)}
                    enabled={!patientsLoading}
                    style={styles.picker}
                    itemStyle={{ fontSize: 16 }}
                  >
                    {/* <Picker.Item label="Select patient" value="" color={Platform.OS === "ios" ? "#9CA3AF" : undefined}  /> */}
                    {patients.length === 0 ? (
                      <Picker.Item
                        label="Loading"
                        color={Platform.OS === "ios" ? "#9CA3AF" : undefined}
                      />
                    ) : (
                      patients.map((patient) => (
                        <Picker.Item
                          key={patient.id}
                          label={`${patient.name} - Room ${patient.roomNumber}`}
                          value={patient.id}
                        />
                      ))
                    )}
                  </Picker>
                </View>
              </>
            )}
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
  // FIXED: Proper picker container styling
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        paddingVertical: 0,
      },
      android: {
        paddingVertical: 0,
      },
    }),
  },
  // FIXED: Proper picker styling
  picker: {
    ...Platform.select({
      ios: {
        height: 50,
      },
      android: {
        height: 50,
        color: "#1F2937",
      },
    }),
  },
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
