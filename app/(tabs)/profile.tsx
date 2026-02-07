import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAutoSync } from '@/hooks/useAutoSync';
import { UserRole } from '@/lib/types';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isOnline, pendingCount, failedCount, syncState, retryAllFailed } = useAutoSync();

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

          {/* Sync Status Section */}
          <View className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <View className="p-4 bg-gray-50 border-b border-gray-100 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="sync-outline" size={20} color="#4A9FB8" />
                <Text className="text-lg font-semibold text-gray-800 ml-2">Sync Status</Text>
              </View>
              <View className={`px-2 py-1 rounded-full flex-row items-center ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                <View className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <Text className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>

            {/* Banner for pending/failed items */}
            {(pendingCount > 0 || failedCount > 0) && (
              <View className={`px-4 py-3 ${failedCount > 0 ? 'bg-red-50' : 'bg-blue-50'} flex-row items-center justify-between`}>
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name={failedCount > 0 ? "warning" : "time-outline"} 
                    size={18} 
                    color={failedCount > 0 ? "#DC2626" : "#2563EB"} 
                  />
                  <Text className={`text-sm font-medium ml-2 ${failedCount > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                    {failedCount > 0 
                      ? `${failedCount} failed sync${failedCount !== 1 ? 's' : ''}` 
                      : `${pendingCount} pending upload${pendingCount !== 1 ? 's' : ''}`}
                  </Text>
                </View>
                {syncState.isSyncing && (
                  <Text className="text-xs text-gray-500">
                    Syncing {syncState.progress}/{syncState.total}...
                  </Text>
                )}
              </View>
            )}

            <View className="p-4">
              <View className="flex-row justify-between mb-4">
                <View className="items-center flex-1">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="cloud-upload-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-500 ml-1">Pending</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-800">{pendingCount}</Text>
                </View>
                <View className="w-px bg-gray-200 mx-2" />
                <View className="items-center flex-1">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="close-circle-outline" size={16} color={failedCount > 0 ? "#DC2626" : "#6B7280"} />
                    <Text className={`text-sm ml-1 ${failedCount > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>Failed</Text>
                  </View>
                  <Text className={`text-2xl font-bold ${failedCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {failedCount}
                  </Text>
                </View>
              </View>

              {failedCount > 0 && (
                <TouchableOpacity
                  className="w-full bg-red-50 border border-red-200 p-3 rounded-xl mb-3 flex-row items-center justify-center"
                  onPress={retryAllFailed}
                >
                  <Ionicons name="refresh" size={18} color="#DC2626" />
                  <Text className="text-red-600 font-semibold ml-2">Retry Failed Uploads</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="w-full bg-gray-100 p-3 rounded-xl flex-row items-center justify-center"
                onPress={() => router.push('/sync-status')}
              >
                <Text className="text-gray-700 font-semibold">View Detailed Sync Status</Text>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" className="ml-1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            className="w-full flex-row items-center justify-center bg-red-500 p-4 rounded-xl shadow-lg mb-6" 
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
