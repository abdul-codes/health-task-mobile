import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateUploadUrl } from "@/lib/api/scannedDocuments";
import { PresignedUrlResponse } from "@/lib/types/scannedDocument";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseR2UploadReturn {
  uploadImage: (
    imageUri: string,
    patientId?: string
  ) => Promise<string>;
  uploadProgress: UploadProgress | null;
  isUploading: boolean;
  error: Error | null;
}

export const useR2Upload = (): UseR2UploadReturn => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );

  const uploadMutation = useMutation({
    mutationFn: async ({
      imageUri,
      patientId,
    }: {
      imageUri: string;
      patientId?: string;
    }): Promise<string> => {
      // 1. Get presigned URL from backend
      const { data: uploadData }: { data: PresignedUrlResponse } =
        await generateUploadUrl(patientId, "image/jpeg");

      if (!uploadData.success || !uploadData.uploadUrl) {
        throw new Error("Failed to generate upload URL");
      }

      // 2. Fetch the image file
      const imageResponse = await fetch(imageUri);
      const blob = await imageResponse.blob();

      // 3. Upload to R2 using presigned URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress({
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during upload"));
        };

        xhr.open("PUT", uploadData.uploadUrl!, true);
        xhr.setRequestHeader("Content-Type", "image/jpeg");
        xhr.send(blob);
      });

      // 4. Return the object key for database storage
      return uploadData.objectKey;
    },
  });

  const uploadImage = async (
    imageUri: string,
    patientId?: string
  ): Promise<string> => {
    setUploadProgress(null);
    return uploadMutation.mutateAsync({ imageUri, patientId });
  };

  return {
    uploadImage,
    uploadProgress,
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error as Error | null,
  };
};

// Simple upload without progress tracking (for smaller images)
export const useR2UploadSimple = () => {
  return useMutation({
    mutationFn: async ({
      imageUri,
      patientId,
    }: {
      imageUri: string;
      patientId?: string;
    }): Promise<string> => {
      // Get presigned URL
      const { data: uploadData } = await generateUploadUrl(
        patientId,
        "image/jpeg"
      );

      if (!uploadData.success || !uploadData.uploadUrl) {
        throw new Error("Failed to generate upload URL");
      }

      // Fetch and upload
      const imageResponse = await fetch(imageUri);
      const blob = await imageResponse.blob();

      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      return uploadData.objectKey;
    },
  });
};
