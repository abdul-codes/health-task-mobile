import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

import { LinearGradient } from 'expo-linear-gradient';

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
      <LinearGradient colors={['#4A9FB8', '#2E7D9A']} className="p-5 pb-24 rounded-b-3xl">
        <Text className="text-3xl font-bold text-white text-center">Profile</Text>
      </LinearGradient>

      {/* Profile Details */}
      <View className="items-center -mt-16">
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?u=emilycarter' }}
          className="w-28 h-28 rounded-full mb-5 border-4 border-white shadow-lg"
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

      {/* Action Menu */}
      <View className="px-6 mt-8">
        <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm mb-4 flex-row items-center">
          <Ionicons name="person-outline" size={22} color="#374151" />
          <Text className="text-lg text-gray-800 ml-4">Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm mb-4 flex-row items-center">
          <Ionicons name="lock-closed-outline" size={22} color="#374151" />
          <Text className="text-lg text-gray-800 ml-4">Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm mb-4 flex-row items-center">
          <Ionicons name="notifications-outline" size={22} color="#374151" />
          <Text className="text-lg text-gray-800 ml-4">Notification Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm mb-4 flex-row items-center">
          <Ionicons name="shield-checkmark-outline" size={22} color="#374151" />
          <Text className="text-lg text-gray-800 ml-4">Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Spacer to push logout button to the bottom */}
      <View className="flex-1" />

      {/* Logout Button */}
      <View className="p-6">
        <TouchableOpacity 
          className="flex-row items-center justify-center bg-red-500 p-4 rounded-xl shadow-lg" 
          onPress={handleLogout}
          accessibilityLabel="Logout button"
        >
          <Ionicons name="log-out-outline" size={22} color="white" />
          <Text className="text-white ml-3 text-lg font-semibold">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
