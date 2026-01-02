import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

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

  const roleConfig = {
    [UserRole.Admin]: { color: 'text-purple-600', bg: 'bg-purple-100' },
    [UserRole.Doctor]: { color: 'text-green-600', bg: 'bg-green-100' },
    [UserRole.Nurse]: { color: 'text-blue-600', bg: 'bg-blue-100' },
    [UserRole.Labtech]: { color: 'text-orange-600', bg: 'bg-orange-100' },
  };

  const currentRoleConfig = user?.role ? roleConfig[user.role] : roleConfig[UserRole.Nurse];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#4A9FB8', '#2E7D9A']} className="p-5 pb-24 rounded-b-3xl">
          <View className="flex-row justify-between items-center">
            <Text className="text-3xl font-bold text-white">Profile</Text>
            
            {/* Admin Users Button */}
            {user?.role === UserRole.Admin && (
              <Link href="/users" asChild>
                <TouchableOpacity className="bg-white/20 px-3 py-2 rounded-full flex-row items-center">
                  <Ionicons name="people-outline" size={18} color="white" />
                  <Text className="text-white font-semibold ml-2 text-sm">Users</Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        </LinearGradient>

        {/* Profile Details */}
        <View className="items-center -mt-16 px-6">
          <Image
            source={{ uri: user?.profilePicture || 'https://i.pravatar.cc/150?u=' + user?.email }}
            className="w-28 h-28 rounded-full mb-5 border-4 border-white shadow-lg"
            accessibilityLabel="User profile picture"
          />
          
          <Text className="text-2xl font-bold text-gray-900 capitalize text-center">
            {user?.firstName} {user?.lastName}
          </Text>
          
          <Text className="text-base text-gray-500 mt-2 mb-4 text-center">
            {user?.email}
          </Text>
          
          {/* Role and Department */}
          <View className="flex-row items-center justify-center space-x-3 mb-8">
            <View className={`px-4 py-2 rounded-full ${currentRoleConfig.bg}`}>
              <Text className={`text-base font-semibold ${currentRoleConfig.color}`}>
                {user?.role}
              </Text>
            </View>
            
            {user?.department && (
              <View className="px-4 py-2 rounded-full bg-gray-100">
                <Text className="text-base font-semibold text-gray-600">
                  {user.department.name}
                </Text>
              </View>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            className="w-full flex-row items-center justify-center bg-red-500 p-4 rounded-xl shadow-lg mb-6 mt-6" 
            onPress={handleLogout}
            accessibilityLabel="Logout button"
          >
            <Ionicons name="log-out-outline" size={22} color="white" />
            <Text className="text-white ml-3 text-base font-semibold">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
