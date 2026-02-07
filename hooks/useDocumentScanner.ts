import { useState, useCallback } from "react";
import { Platform } from "react-native";
import DocumentScanner, {
  ScanDocumentOptions,
} from "react-native-document-scanner-plugin";
import { ScanPermissionStatus, ScanResult } from "@/lib/types";

interface UseDocumentScannerReturn {
  scanDocument: (options?: ScanOptions) => Promise<ScanResult>;
  checkPermissions: () => Promise<ScanPermissionStatus>;
  requestPermissions: () => Promise<boolean>;
  isScanning: boolean;
  error: string | null;
}

interface ScanOptions {
  maxNumDocuments?: number;
  letUserAdjustCrop?: boolean;
  croppedImageQuality?: number;
}

const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  maxNumDocuments: 1,
  letUserAdjustCrop: true,
  croppedImageQuality: 90,
};

export const useDocumentScanner = (): UseDocumentScannerReturn => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermissions = useCallback(async (): Promise<ScanPermissionStatus> => {
    try {
      if (Platform.OS === "web") {
        return { camera: true, canRequest: false };
      }

      const hasPermission = await DocumentScanner.scanDocument({
        maxNumDocuments: 0,
      });

      return {
        camera: true,
        canRequest: false,
      };
    } catch (err) {
      return {
        camera: false,
        canRequest: true,
      };
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === "web") {
        return true;
      }

      const result = await checkPermissions();
      return result.camera;
    } catch (err) {
      setError("Failed to request camera permissions");
      return false;
    }
  }, [checkPermissions]);

  const scanDocument = useCallback(
    async (options: ScanOptions = {}): Promise<ScanResult> => {
      setIsScanning(true);
      setError(null);

      try {
        const scanOptions: ScanDocumentOptions = {
          ...DEFAULT_SCAN_OPTIONS,
          ...options,
        };

        const { scannedImages } = await DocumentScanner.scanDocument(scanOptions);

        if (!scannedImages || scannedImages.length === 0) {
          return {
            success: false,
            error: "No document was scanned. Please try again.",
          };
        }

        const imageUri = scannedImages[0];

        return {
          success: true,
          document: {
            id: `temp-${Date.now()}`,
            imageUri: imageUri,
            extractedText: "",
            confidence: 0,
            documentType: "PATIENT_RECORD",
            fields: [],
            createdAt: new Date(),
            isSynced: false,
            isVerified: false,
          },
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to scan document";
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsScanning(false);
      }
    },
    []
  );

  return {
    scanDocument,
    checkPermissions,
    requestPermissions,
    isScanning,
    error,
  };
};
