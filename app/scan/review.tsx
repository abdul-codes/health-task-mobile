import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import { DocumentReview } from "@/components/DocumentReview";
import { ScannedDocument } from "@/lib/types";
import { SafeScreen } from "@/components/SafeScreen";

export default function ReviewScreen() {
  const router = useRouter();
  const { document } = useLocalSearchParams<{ document: string }>();

  const [scannedDocument] = useState<ScannedDocument>(() => {
    try {
      return JSON.parse(document) as ScannedDocument;
    } catch {
      Alert.alert("Error", "Invalid document data");
      router.back();
      return {} as ScannedDocument;
    }
  });

  const handleSave = (updatedDocument: ScannedDocument) => {
    // Here you would typically:
    // 1. Save to local storage
    // 2. Upload image to Cloudflare R2
    // 3. Sync extracted data to backend
    // 4. Navigate to appropriate screen based on document type

    console.log("Saving document:", updatedDocument);

    // Show success message
    Alert.alert(
      "Document Saved",
      `The ${updatedDocument.documentType.toLowerCase().replace("_", " ")} has been saved successfully.`,
      [
        {
          text: "OK",
          onPress: () => {
            // Navigate based on document type
            switch (updatedDocument.documentType) {
              case "PATIENT_RECORD":
                router.push("/(tabs)/patients");
                break;
              case "PRESCRIPTION":
              case "TASK_NOTE":
                router.push("/(tabs)/tasks");
                break;
              case "LAB_RESULT":
                router.push("/(tabs)/patients");
                break;
              default:
                router.push("/(tabs)/scan");
            }
          },
        },
      ]
    );
  };

  const handleRetake = () => {
    Alert.alert(
      "Retake Document",
      "Are you sure you want to scan this document again?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retake",
          style: "destructive",
          onPress: () => router.push("/(tabs)/scan"),
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Discard Document",
      "Are you sure you want to discard this scanned document?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (!scannedDocument || !scannedDocument.id) {
    return null;
  }

  return (
    <SafeScreen>
      <DocumentReview
        document={scannedDocument}
        onSave={handleSave}
        onRetake={handleRetake}
        onCancel={handleCancel}
      />
    </SafeScreen>
  );
}
