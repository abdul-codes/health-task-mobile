import { useEffect, useCallback, useState } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import {
  usePendingScans,
  useUpdateSyncStatus,
} from "./useScannedDocuments";
import { useR2Upload } from "./useR2Upload";
import { ScannedDocumentResponse, SyncStatus } from "@/lib/types/scannedDocument";
import { Alert } from "react-native";

// Priority order for sync (lower = higher priority)
const SYNC_PRIORITY: Record<string, number> = {
  PRESCRIPTION: 1,
  LAB_RESULT: 2,
  PATIENT_RECORD: 3,
  TASK_NOTE: 4,
};

interface SyncState {
  isSyncing: boolean;
  currentScanId: string | null;
  progress: number;
  total: number;
}

export const useAutoSync = () => {
  const { isOnline } = useNetworkStatus();
  const { data: pendingScansData, refetch } = usePendingScans();
  const { mutateAsync: updateSyncStatus } = useUpdateSyncStatus();
  const { uploadImage } = useR2Upload();
  
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    currentScanId: null,
    progress: 0,
    total: 0,
  });

  const [failedScans, setFailedScans] = useState<ScannedDocumentResponse[]>([]);

  // Sort scans by priority
  const sortByPriority = (
    scans: ScannedDocumentResponse[]
  ): ScannedDocumentResponse[] => {
    return [...scans].sort(
      (a, b) => SYNC_PRIORITY[a.documentType] - SYNC_PRIORITY[b.documentType]
    );
  };

  // Sync a single scan with retry logic
  const syncScan = async (
    scan: ScannedDocumentResponse,
    attempt: number = 1
  ): Promise<boolean> => {
    const maxRetries = 3;
    
    try {
      setSyncState((prev) => ({
        ...prev,
        currentScanId: scan.id,
      }));

      // If scan has no R2 object key, we need to upload it first
      // Note: Since we're now uploading directly to R2 during scanning,
      // this should rarely happen. But we handle it just in case.
      if (!scan.r2ObjectKey) {
        throw new Error("Scan missing R2 object key. Please rescan.");
      }

      // Mark as synced
      await updateSyncStatus({
        id: scan.id,
        status: "SYNCED" as SyncStatus,
      });

      return true;
    } catch (error: any) {
      console.error(`Sync failed for scan ${scan.id}, attempt ${attempt}:`, error);

      // If we haven't exceeded max retries, retry immediately
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        await new Promise((resolve) => setTimeout(resolve, delay));
        return syncScan(scan, attempt + 1);
      }

      // Max retries reached, mark as failed
      await updateSyncStatus({
        id: scan.id,
        status: "FAILED" as SyncStatus,
        errorLog: error.message || "Unknown error during sync",
      });

      return false;
    }
  };

  // Main sync function
  const syncPendingScans = useCallback(async () => {
    if (!isOnline || !pendingScansData?.data?.length) return;

    const pendingScans = pendingScansData.data;
    const sortedScans = sortByPriority(pendingScans);
    
    setSyncState({
      isSyncing: true,
      currentScanId: null,
      progress: 0,
      total: sortedScans.length,
    });

    const newFailedScans: ScannedDocumentResponse[] = [];
    let completedCount = 0;

    for (const scan of sortedScans) {
      const success = await syncScan(scan);
      
      if (!success) {
        newFailedScans.push(scan);
      }
      
      completedCount++;
      setSyncState((prev) => ({
        ...prev,
        progress: completedCount,
      }));
    }

    // Update failed scans state
    if (newFailedScans.length > 0) {
      setFailedScans((prev) => [...prev, ...newFailedScans]);
      
      // Notify user about failed scans
      Alert.alert(
        "Sync Complete with Errors",
        `${newFailedScans.length} of ${sortedScans.length} scans failed to sync. Go to Profile > Sync Status to retry.`,
        [{ text: "OK" }]
      );
    }

    setSyncState((prev) => ({
      ...prev,
      isSyncing: false,
      currentScanId: null,
    }));

    // Refetch to get updated list
    refetch();
  }, [isOnline, pendingScansData, updateSyncStatus, refetch]);

  // Trigger sync when coming online
  useEffect(() => {
    if (isOnline && pendingScansData?.data?.length && !syncState.isSyncing) {
      // Check if there are any pending scans that need to be retried
      const hasPendingScans = pendingScansData.data.some(
        (scan) => scan.syncStatus === "PENDING"
      );
      
      if (hasPendingScans) {
        syncPendingScans();
      }
    }
  }, [isOnline, pendingScansData, syncState.isSyncing, syncPendingScans]);

  // Retry a specific failed scan
  const retryFailedScan = async (scanId: string) => {
    const scan = failedScans.find((s) => s.id === scanId);
    if (!scan) return;

    try {
      // Reset to pending
      await updateSyncStatus({
        id: scanId,
        status: "PENDING" as SyncStatus,
      });

      // Remove from failed list
      setFailedScans((prev) => prev.filter((s) => s.id !== scanId));

      // Try to sync immediately
      if (isOnline) {
        const success = await syncScan(scan);
        if (success) {
          Alert.alert("Success", "Scan synced successfully");
        } else {
          Alert.alert("Error", "Failed to sync. Will retry when online.");
        }
      } else {
        Alert.alert(
          "Queued for Sync",
          "Scan will be synced when you come back online."
        );
      }

      refetch();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to retry sync");
    }
  };

  // Retry all failed scans
  const retryAllFailed = async () => {
    if (!isOnline) {
      Alert.alert(
        "No Connection",
        "Please connect to the internet to retry failed scans."
      );
      return;
    }

    const scansToRetry = [...failedScans];
    setFailedScans([]);

    for (const scan of scansToRetry) {
      await retryFailedScan(scan.id);
    }
  };

  return {
    isOnline,
    pendingCount: pendingScansData?.count || 0,
    failedCount: failedScans.length,
    syncState,
    failedScans,
    syncPendingScans,
    retryFailedScan,
    retryAllFailed,
  };
};
