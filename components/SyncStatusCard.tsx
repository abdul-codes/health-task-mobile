import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAutoSync } from "@/hooks/useAutoSync";

export const SyncStatusCard: React.FC = () => {
  const {
    isOnline,
    pendingCount,
    failedCount,
    syncState,
    retryAllFailed,
  } = useAutoSync();

  const hasIssues = pendingCount > 0 || failedCount > 0;
  const isSyncing = syncState.isSyncing;
  const progress = syncState.total > 0 
    ? Math.round((syncState.progress / syncState.total) * 100) 
    : 0;

  return (
    <View className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Status */}
      <View className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View 
            className={`w-3 h-3 rounded-full mr-2 ${
              isOnline ? "bg-emerald-500" : "bg-red-500"
            }`} 
          />
          <Text className="font-semibold text-gray-900">
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
        
        {isSyncing && (
          <View className="flex-row items-center">
            <Ionicons name="sync" size={16} color="#10B981" className="animate-spin" />
            <Text className="text-emerald-600 text-sm font-medium ml-1">
              Syncing...
            </Text>
          </View>
        )}
      </View>

      {/* Sync Progress */}
      {isSyncing && (
        <View className="px-4 py-3 bg-emerald-50">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-emerald-800">
              {syncState.progress} of {syncState.total} scans
            </Text>
            <Text className="text-sm font-semibold text-emerald-800">
              {progress}%
            </Text>
          </View>
          <View className="h-2 bg-emerald-200 rounded-full overflow-hidden">
            <View 
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>
      )}

      {/* Count Badges */}
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-row space-x-3">
          {/* Pending Badge */}
          <View className="flex-row items-center bg-yellow-50 px-3 py-2 rounded-lg">
            <Ionicons name="time-outline" size={18} color="#F59E0B" />
            <Text className="text-yellow-700 font-semibold ml-2">
              {pendingCount}
            </Text>
            <Text className="text-yellow-600 text-sm ml-1">pending</Text>
          </View>

          {/* Failed Badge */}
          <View 
            className={`flex-row items-center px-3 py-2 rounded-lg ${
              failedCount > 0 ? "bg-red-50" : "bg-gray-50"
            }`}
          >
            <Ionicons 
              name="alert-circle-outline" 
              size={18} 
              color={failedCount > 0 ? "#EF4444" : "#9CA3AF"} 
            />
            <Text 
              className={`font-semibold ml-2 ${
                failedCount > 0 ? "text-red-700" : "text-gray-600"
              }`}
            >
              {failedCount}
            </Text>
            <Text 
              className={`text-sm ml-1 ${
                failedCount > 0 ? "text-red-600" : "text-gray-500"
              }`}
            >
              failed
            </Text>
          </View>
        </View>

        {/* Retry All Button */}
        {failedCount > 0 && (
          <TouchableOpacity
            onPress={retryAllFailed}
            disabled={!isOnline}
            className={`flex-row items-center px-3 py-2 rounded-lg ${
              isOnline 
                ? "bg-red-100 active:bg-red-200" 
                : "bg-gray-100 opacity-50"
            }`}
          >
            <Ionicons name="refresh" size={16} color="#DC2626" />
            <Text className="text-red-700 font-medium text-sm ml-1">
              Retry All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Message */}
      {!isOnline && hasIssues && (
        <View className="px-4 pb-4">
          <View className="bg-gray-50 px-3 py-2 rounded-lg flex-row items-center">
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm ml-2">
              Sync will resume when connection is restored
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
