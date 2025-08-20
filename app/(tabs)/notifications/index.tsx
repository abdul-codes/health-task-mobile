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
    // Handle navigation based on notification data
  };

  const getIcon = (data: any) => {
    if (data?.taskId) return "clipboard-outline";
    if (data?.patientId) return "person-outline";
    return "notifications-outline";
  };

  return (
    <Link href={item.data?.taskId ? `/tasks/${item.data.taskId}` : "/notifications"} asChild>
      <TouchableOpacity onPress={handlePress}>
        <View
          className={`flex-row items-center p-4 mb-4 rounded-xl ${
            item.isRead ? "bg-white" : "bg-blue-50"
          }`}
        >
          <View className='w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4'>
            <Ionicons name={getIcon(item.data)} size={24} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">{item.title}</Text>
            <Text className="text-base text-gray-600 mt-1">{item.body}</Text>
            <Text className="text-sm text-gray-400 mt-2">
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
          {!item.isRead && (
            <View className="w-3 h-3 bg-blue-500 rounded-full ml-4" />
          )}
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
