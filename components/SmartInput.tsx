import React, { useState, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMedicalDictionary } from "@/hooks/useMedicalDictionary";
import { normalizeDate, formatDate } from "@/utils/dateUtils";

interface SmartInputProps {
  value: string;
  onChangeText: (text: string) => void;
  fieldType: "medication" | "diagnosis" | "date" | "phone" | "dosage" | "general";
  confidence: number;
  placeholder?: string;
  multiline?: boolean;
}

interface Suggestion {
  term: string;
  confidence: number;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChangeText,
  fieldType,
  confidence,
  placeholder,
  multiline = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { getSuggestions, correctTerm, expandAbbreviation } =
    useMedicalDictionary();

  // Get border color based on confidence
  const getBorderColor = () => {
    if (confidence > 90) return "border-green-400";
    if (confidence > 70) return "border-yellow-400";
    return "border-red-400";
  };

  const getBackgroundColor = () => {
    if (confidence > 90) return "bg-white";
    if (confidence > 70) return "bg-yellow-50";
    return "bg-red-50";
  };

  // Generate suggestions based on input
  const generateSuggestions = useCallback(
    (input: string) => {
      if (!input || input.length < 2) {
        setSuggestions([]);
        return;
      }

      let newSuggestions: Suggestion[] = [];

      // Check for abbreviations
      const expanded = expandAbbreviation(input);
      if (expanded) {
        newSuggestions.push({ term: expanded, confidence: 100 });
      }

      // Get fuzzy matches from medical dictionary for relevant fields
      if (fieldType === "medication" || fieldType === "diagnosis") {
        const fuzzyResults = getSuggestions(input, fieldType, 4);
        newSuggestions = [
          ...newSuggestions,
          ...fuzzyResults
            .filter((r) => r.confidence > 50)
            .map((r) => ({ term: r.term, confidence: r.confidence })),
        ];
      }

      // Date suggestions for date fields
      if (fieldType === "date") {
        const normalized = normalizeDate(input);
        if (normalized) {
          newSuggestions.push({
            term: formatDate(normalized.date, "medium"),
            confidence: normalized.confidence,
          });
        }
      }

      // Remove duplicates
      const uniqueSuggestions = newSuggestions.filter(
        (suggestion, index, self) =>
          index === self.findIndex((s) => s.term === suggestion.term)
      );

      setSuggestions(uniqueSuggestions.slice(0, 5));
      setShowSuggestions(uniqueSuggestions.length > 0);
    },
    [fieldType, getSuggestions, expandAbbreviation]
  );

  // Handle text change
  const handleChangeText = (text: string) => {
    onChangeText(text);
    generateSuggestions(text);
  };

  // Apply suggestion
  const applySuggestion = (suggestion: string) => {
    onChangeText(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // Auto-correct on blur for low confidence
  const handleBlur = () => {
    setIsFocused(false);
    setShowSuggestions(false);

    if (confidence < 70 && value.length > 2) {
      if (fieldType === "medication" || fieldType === "diagnosis") {
        const corrected = correctTerm(value, fieldType, 80);
        if (corrected && corrected !== value) {
          onChangeText(corrected);
        }
      }
    }
  };

  // Render suggestion item
  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      onPress={() => applySuggestion(item.term)}
      className="px-4 py-3 border-b border-gray-100 active:bg-gray-50 flex-row items-center justify-between"
    >
      <Text className="text-gray-800 flex-1">{item.term}</Text>
      {item.confidence > 90 && (
        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  // Get keyboard type based on field
  const getKeyboardType = () => {
    switch (fieldType) {
      case "phone":
        return "phone-pad";
      case "date":
        return "default";
      case "dosage":
        return "default";
      default:
        return "default";
    }
  };

  // Get input validation
  const validateInput = (text: string): string => {
    switch (fieldType) {
      case "phone":
        // Only allow digits, spaces, +, -, (, )
        return text.replace(/[^\d\s\+\-\(\)]/g, "");
      case "dosage":
        // Allow digits, dots, spaces, and common dosage units
        return text.replace(/[^\d\.\s\/mgmltabcapsule]/gi, "");
      default:
        return text;
    }
  };

  return (
    <View className="relative">
      {/* Input Field */}
      <View
        className={`flex-row items-center border-2 rounded-lg ${getBorderColor()} ${getBackgroundColor()}`}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(text) => handleChangeText(validateInput(text))}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          className={`flex-1 px-3 py-2 text-gray-900 ${
            multiline ? "min-h-[80px]" : ""
          }`}
          style={{ textAlignVertical: multiline ? "top" : "center" }}
          keyboardType={getKeyboardType()}
        />

        {/* Confidence Indicator */}
        {value.length > 0 && (
          <View className="pr-3">
            {confidence > 90 ? (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            ) : confidence > 70 ? (
              <Ionicons name="warning" size={20} color="#F59E0B" />
            ) : (
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
            )}
          </View>
        )}

        {/* Clear Button */}
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onChangeText("");
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="pr-3"
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && isFocused && (
        <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48">
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.term}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          />
        </View>
      )}

      {/* Field Type Indicator */}
      {isFocused && (
        <View className="mt-1 flex-row items-center">
          <Text className="text-xs text-gray-500 capitalize">
            {fieldType === "general" ? "Text" : fieldType.replace("_", " ")}
          </Text>
          {confidence < 70 && (
            <Text className="text-xs text-red-500 ml-2">
              • Low confidence - tap to verify
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
