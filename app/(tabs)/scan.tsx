import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDocumentScanner } from "@/hooks/useDocumentScanner";
import { useOCR } from "@/hooks/useOCR";
import { parseDocument } from "@/utils/documentParser";
import { DocumentType, ScannedDocument } from "@/lib/types";
import { SafeScreen } from "@/components/SafeScreen";

const DOCUMENT_TYPES: { type: DocumentType; label: string; icon: string }[] = [
  { type: "PATIENT_RECORD", label: "Patient Record", icon: "person" },
  { type: "PRESCRIPTION", label: "Prescription", icon: "medical" },
  { type: "LAB_RESULT", label: "Lab Result", icon: "flask" },
  { type: "TASK_NOTE", label: "Task/Note", icon: "document-text" },
];

export default function ScanScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<DocumentType>("PATIENT_RECORD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");

  const { scanDocument } = useDocumentScanner();
  const { recognizeText, progress } = useOCR();

  const handleScan = useCallback(async () => {
    try {
      setIsProcessing(true);
      setProcessingStep("Scanning document...");

      // Step 1: Scan the document
      const scanResult = await scanDocument({
        maxNumDocuments: 1,
        letUserAdjustCrop: true,
        croppedImageQuality: 90,
      });

      if (!scanResult.success || !scanResult.document) {
        if (scanResult.error) {
          Alert.alert("Scan Failed", scanResult.error);
        }
        setIsProcessing(false);
        setProcessingStep("");
        return;
      }

      const scannedDoc = scanResult.document;

      // Step 2: OCR
      setProcessingStep("Extracting text...");
      const ocrResult = await recognizeText(scannedDoc.imageUri);

      if (!ocrResult) {
        Alert.alert(
          "Text Extraction Failed",
          "Could not extract text from the image. Please try again with better lighting."
        );
        setIsProcessing(false);
        setProcessingStep("");
        return;
      }

      // Step 3: Parse the document
      setProcessingStep("Analyzing document...");
      const parsedDoc = parseDocument(ocrResult);

      // Create the full scanned document
      const document: ScannedDocument = {
        ...scannedDoc,
        documentType: selectedType,
        extractedText: ocrResult.text,
        confidence: parsedDoc.confidence,
        fields: parsedDoc.fields.map((field) => ({
          ...field,
          isVerified: field.confidence > 90,
        })),
      };

      setIsProcessing(false);
      setProcessingStep("");

      // Navigate to review screen
      router.push({
        pathname: "/scan/review",
        params: {
          document: JSON.stringify(document),
        },
      });
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while scanning. Please try again."
      );
      setIsProcessing(false);
      setProcessingStep("");
    }
  }, [scanDocument, recognizeText, selectedType, router]);

  return (
    <SafeScreen>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-5 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">
            Scan Document
          </Text>
          <Text className="text-gray-600 mt-1">
            Select document type and scan to extract data
          </Text>
        </View>

        <ScrollView className="flex-1 px-5 py-6">
          {/* Document Type Selector */}
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Document Type
          </Text>

          <View className="flex-row flex-wrap gap-3 mb-8">
            {DOCUMENT_TYPES.map((docType) => (
              <TouchableOpacity
                key={docType.type}
                onPress={() => setSelectedType(docType.type)}
                className={`flex-1 min-w-[45%] p-4 rounded-xl border-2 ${
                  selectedType === docType.type
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Ionicons
                  name={docType.icon as any}
                  size={28}
                  color={selectedType === docType.type ? "#10B981" : "#6B7280"}
                />
                <Text
                  className={`mt-2 font-semibold ${
                    selectedType === docType.type
                      ? "text-emerald-700"
                      : "text-gray-700"
                  }`}
                >
                  {docType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Instructions */}
          <View className="bg-blue-50 p-4 rounded-xl mb-8">
            <Text className="text-blue-800 font-semibold mb-2">
              Tips for best results:
            </Text>
            <View className="space-y-1">
              <Text className="text-blue-700 text-sm">
                • Ensure good lighting
              </Text>
              <Text className="text-blue-700 text-sm">
                • Keep document flat and steady
              </Text>
              <Text className="text-blue-700 text-sm">
                • Make sure text is clearly visible
              </Text>
              <Text className="text-blue-700 text-sm">
                • Avoid shadows and glare
              </Text>
            </View>
          </View>

          {/* Scan Button */}
          <TouchableOpacity
            onPress={handleScan}
            disabled={isProcessing}
            className={`py-4 px-6 rounded-xl flex-row items-center justify-center ${
              isProcessing
                ? "bg-gray-400"
                : "bg-emerald-600 active:bg-emerald-700"
            }`}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator color="white" className="mr-3" />
                <Text className="text-white font-semibold text-lg">
                  {processingStep}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="camera" size={24} color="white" className="mr-2" />
                <Text className="text-white font-semibold text-lg">
                  Scan Document
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Processing Progress */}
          {isProcessing && progress > 0 && (
            <View className="mt-4">
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-center text-gray-600 mt-2 text-sm">
                {progress}%
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeScreen>
  );
}
