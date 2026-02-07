import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScannedDocument, ExtractedField, DocumentType } from "@/lib/types";
// Note: useMedicalDictionary available for future auto-correction features
// import { useMedicalDictionary } from "@/hooks/useMedicalDictionary";
import { SmartInput } from "./SmartInput";

interface DocumentReviewProps {
  document: ScannedDocument;
  onSave: (document: ScannedDocument) => void;
  onRetake: () => void;
  onCancel: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PATIENT_RECORD: "Patient Record",
  PRESCRIPTION: "Prescription",
  LAB_RESULT: "Lab Result",
  TASK_NOTE: "Task/Note",
};

export const DocumentReview: React.FC<DocumentReviewProps> = ({
  document,
  onSave,
  onRetake,
  onCancel,
}) => {
  const [fields, setFields] = useState<ExtractedField[]>(document.fields);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  // Note: Medical dictionary hooks available for future auto-correction features
  // const { correctTerm, expandAbbreviation } = useMedicalDictionary();

  const updateField = useCallback(
    (index: number, newValue: string) => {
      const newFields = [...fields];
      newFields[index] = {
        ...newFields[index],
        value: newValue,
        isVerified: true,
        confidence: 100,
      };
      setFields(newFields);
    },
    [fields]
  );

  const saveDocument = useCallback(() => {
    const updatedDocument: ScannedDocument = {
      ...document,
      fields,
      isVerified: true,
    };
    onSave(updatedDocument);
  }, [document, fields, onSave]);

  const handleSave = useCallback(() => {
    // Check if all required fields are filled
    const emptyFields = fields.filter(
      (f) => !f.value || f.value.trim() === ""
    );

    if (emptyFields.length > 0) {
      Alert.alert(
        "Incomplete Fields",
        `${emptyFields.length} field(s) are empty. Are you sure you want to save?`,
        [
          { text: "Review", style: "cancel" },
          { text: "Save Anyway", onPress: saveDocument },
        ]
      );
    } else {
      saveDocument();
    }
  }, [fields, saveDocument]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 90) return "bg-green-100 border-green-400 text-green-700";
    if (confidence > 70) return "bg-yellow-100 border-yellow-400 text-yellow-700";
    return "bg-red-100 border-red-400 text-red-700";
  };

  const getConfidenceIcon = (confidence: number): string => {
    if (confidence > 90) return "checkmark-circle";
    if (confidence > 70) return "warning";
    return "alert-circle";
  };

  const calculateOverallConfidence = (): number => {
    if (fields.length === 0) return 0;
    return Math.round(
      fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length
    );
  };

  const overallConfidence = calculateOverallConfidence();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-900">
            Review Extracted Data
          </Text>
          <Text className="text-gray-600 text-sm">
            {DOCUMENT_TYPE_LABELS[document.documentType]}
          </Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${
            overallConfidence > 90
              ? "bg-green-100"
              : overallConfidence > 70
              ? "bg-yellow-100"
              : "bg-red-100"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              overallConfidence > 90
                ? "text-green-700"
                : overallConfidence > 70
                ? "text-yellow-700"
                : "text-red-700"
            }`}
          >
            {overallConfidence}% Confidence
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Scanned Image */}
          <View className="bg-white m-4 rounded-xl overflow-hidden shadow-sm">
            <View className="p-3 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="font-semibold text-gray-800">
                Scanned Document
              </Text>
              <TouchableOpacity
                onPress={() => setIsImageExpanded(!isImageExpanded)}
              >
                <Ionicons
                  name={isImageExpanded ? "contract" : "expand"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: document.imageUri }}
              className={`w-full ${isImageExpanded ? "h-96" : "h-48"}`}
              resizeMode="contain"
            />
          </View>

          {/* Extracted Fields */}
          <View className="mx-4 mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Extracted Fields ({fields.length})
            </Text>

            {fields.length === 0 ? (
              <View className="bg-yellow-50 p-4 rounded-xl">
                <Text className="text-yellow-800">
                  No fields were automatically extracted. You can manually enter
                  the data below.
                </Text>
              </View>
            ) : (
              fields.map((field, index) => (
                <View
                  key={`${field.name}-${index}`}
                  className={`mb-4 p-4 rounded-xl border-2 ${getConfidenceColor(
                    field.confidence
                  )}`}
                >
                  {/* Field Header */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-semibold capitalize">
                      {field.name.replace(/_/g, " ")}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={getConfidenceIcon(field.confidence) as any}
                        size={16}
                        color={
                          field.confidence > 90
                            ? "#10B981"
                            : field.confidence > 70
                            ? "#F59E0B"
                            : "#EF4444"
                        }
                      />
                      <Text className="ml-1 text-xs">
                        {field.confidence}%
                      </Text>
                    </View>
                  </View>

                  {/* Field Input */}
                  <SmartInput
                    value={field.value}
                    onChangeText={(text) => updateField(index, text)}
                    fieldType={getFieldType(field.name)}
                    confidence={field.confidence}
                    placeholder={`Enter ${field.name.replace(/_/g, " ")}`}
                  />

                  {/* Suggestions for low confidence */}
                  {field.confidence < 70 && !field.isVerified && (
                    <View className="mt-2 p-2 bg-white rounded-lg">
                      <Text className="text-xs text-red-600 mb-1">
                        Low confidence - please verify
                      </Text>
                      {field.suggestions && field.suggestions.length > 0 && (
                        <View className="flex-row flex-wrap gap-2">
                          {field.suggestions.map((suggestion, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() => updateField(index, suggestion)}
                              className="px-2 py-1 bg-emerald-100 rounded-md"
                            >
                              <Text className="text-xs text-emerald-700">
                                {suggestion}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Raw Text Preview (Collapsible) */}
          <View className="mx-4 mb-8">
            <TouchableOpacity
              className="flex-row items-center justify-between p-3 bg-gray-100 rounded-xl"
              onPress={() => {}}
            >
              <Text className="font-semibold text-gray-700">
                View Raw Extracted Text
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Buttons */}
      <View className="bg-white px-5 py-4 border-t border-gray-200">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-200 active:bg-gray-300"
          >
            <Text className="text-center font-semibold text-gray-700">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onRetake}
            className="flex-1 py-3 px-4 rounded-xl bg-yellow-100 active:bg-yellow-200 border border-yellow-300"
          >
            <Text className="text-center font-semibold text-yellow-700">
              Retake
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 active:bg-emerald-700"
          >
            <Text className="text-center font-semibold text-white">
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Helper function to determine field type for SmartInput
function getFieldType(fieldName: string): string {
  const name = fieldName.toLowerCase();

  if (name.includes("medication") || name.includes("drug")) {
    return "medication";
  }
  if (name.includes("diagnosis") || name.includes("condition")) {
    return "diagnosis";
  }
  if (name.includes("date") || name.includes("dob") || name.includes("due")) {
    return "date";
  }
  if (name.includes("phone") || name.includes("contact")) {
    return "phone";
  }
  if (name.includes("dosage") || name.includes("dose")) {
    return "dosage";
  }

  return "general";
}
