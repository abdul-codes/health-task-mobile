import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  // UX Enhancement: Add a confirmation dialog before logging out.
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: logout,
          style: "destructive",
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="p-5 border-b border-gray-200 bg-white">
        <Text className="text-3xl font-bold text-gray-800">Profile</Text>
      </View>

      {/* Profile Details */}
      <View className="items-center p-8">
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?u=emilycarter' }}
          className="w-28 h-28 rounded-full mb-5"
          // A11y Enhancement: Add an accessibility label for screen readers.
          accessibilityLabel="User profile picture"
        />
        <Text className="text-2xl font-bold text-gray-900 capitalize">
          {user?.firstName} {user?.lastName}
        </Text>
        <Text className="text-base text-gray-500 mt-2">{user?.email}</Text>
        
        {/* UX Enhancement: Display the user's role and department for context. */}
        <View className="mt-4 flex-row items-center space-x-2">
            <Text className="text-base font-semibold text-blue-600 bg-blue-100 px-4 py-1 rounded-full">
                {user?.role}
            </Text>
            {user?.department && (
                <Text className="text-base font-semibold text-purple-600 bg-purple-100 px-4 py-1 rounded-full">
                    {user.department.name}
                </Text>
            )}
        </View>
      </View>

      {/* Spacer to push logout button to the bottom */}
      <View className="flex-1" />

      {/* Logout Button */}
      <View className="p-5">
        <TouchableOpacity 
          // UX Enhancement: Refined button style to be less alarming.
          className="flex-row items-center justify-center bg-red-50 p-4 rounded-xl border border-red-200" 
          onPress={handleLogout}
          accessibilityLabel="Logout button"
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text className="text-red-600 ml-3 text-lg font-semibold">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
