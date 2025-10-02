import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Link } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { Notification } from "@/lib/types";

const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get("/notifications");
  return data;
};

const NotificationListItem = ({ item }: { item: Notification }) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.patch(`/notifications/${item.id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handlePress = () => {
    if (!item.isRead) {
      mutation.mutate();
    }
    // Navigation is handled by the Link wrapper
  };

  const getIcon = (data: any) => {
    if (data?.taskId) return "clipboard-outline";
    if (data?.patientId) return "person-outline";
    return "notifications-outline";
  };

  const getHref = (data: any) => {
    if (data?.taskId) {
      return {
        pathname: "/tasks/[id]" as const,
        params: { id: data.taskId },
      };
    }
    if (data?.patientId) {
      return {
        pathname: "/patients/[id]" as const,
        params: { id: data.patientId },
      };
    }
    // Fallback for notifications without a specific linkable item
    return "/notifications" as const;
  };

  // Use memoization for the timestamp to avoid recalculating on every render
  const timeAgo = useMemo(() => {
    const date = new Date(item.createdAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  }, [item.createdAt]);

  return (
    <Link href={getHref(item.data)} asChild>
      <TouchableOpacity
        onPress={handlePress}
        className={`bg-white rounded-xl shadow-sm overflow-hidden mb-4 border-l-4 ${
          item.isRead ? "border-transparent" : "border-blue-500"
        }`}
      >
        <View className="flex-row items-start p-4">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center mr-4 mt-1 ${
              item.isRead ? "bg-gray-100" : "bg-blue-100"
            }`}
          >
            <Ionicons
              name={getIcon(item.data)}
              size={20}
              color={item.isRead ? "#6B7280" : "#3B82F6"}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800 leading-tight">
              {item.title}
            </Text>
            <Text className="text-sm text-gray-600 mt-1 leading-snug">
              {item.body}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 ml-2 whitespace-nowrap">
            {timeAgo}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery<Notification[], Error>({
    queryKey: ["notifications", user?.id],
    queryFn: fetchNotifications,
    enabled: !!user?.id,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading Notifications...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View className="flex-1 justify-center items-center p-8">
          <Ionicons name="cloud-offline-outline" size={60} color="#EF4444" />
          <Text className="text-lg font-semibold text-red-500 mt-4 text-center">
            Error fetching notifications
          </Text>
          <Text className="text-gray-500 mt-1 text-center">{error.message}</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-6 bg-blue-600 px-6 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (data?.length === 0) {
      return (
        <View className="flex-1 justify-center items-center p-8">
          <Ionicons name="notifications-off-outline" size={60} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-gray-700 mt-4">
            No Notifications Yet
          </Text>
          <Text className="text-gray-500 mt-1 text-center">
            You will see notifications about tasks, patients, and other important events here.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={groupedData}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text className="text-lg font-bold text-gray-500 mt-6 mb-2 px-4">{item.title}</Text>;
          }
          return <NotificationListItem item={item.notification} />;
        }}
        keyExtractor={(item, index) => item.id || `header-${index}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      />
    );
  };

  const groupedData = useMemo(() => {
    if (!data) return [];
    const groups: { [key: string]: any[] } = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    data.forEach((notification) => {
      const notificationDate = new Date(notification.createdAt);
      if (notificationDate.toDateString() === today.toDateString()) {
        groups.Today.push({ type: 'notification', notification, id: notification.id });
      } else if (notificationDate.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push({ type: 'notification', notification, id: notification.id });
      } else {
        groups.Older.push({ type: 'notification', notification, id: notification.id });
      }
    });

    const flatListReadyData: any[] = [];
    for (const title of ['Today', 'Yesterday', 'Older']) {
      if (groups[title].length > 0) {
        flatListReadyData.push({ type: 'header', title, id: title });
        flatListReadyData.push(...groups[title]);
      }
    }

    return flatListReadyData;
  }, [data]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center bg-gray-50">
        <Text className="text-3xl font-bold text-gray-900">Notifications</Text>
        <TouchableOpacity onPress={() => markAllAsReadMutation.mutate()}>
          <Text className="text-blue-600 font-semibold">Mark all as read</Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}
