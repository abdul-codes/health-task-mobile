import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, TaskStatus } from '@/lib/types';
import api from '@/lib/api';

// Statistics interface
interface UserStatistics {
  tasksCreated: number;
  tasksAssigned: number;
  tasksCompleted: number;
  patientsAssigned: number;
}

const StatCard = ({ 
  title, 
  count, 
  icon, 
  color = 'text-blue-600',
  bgColor = 'bg-blue-50'
}: {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  bgColor?: string;
}) => (
  <View className="bg-white rounded-xl p-4 shadow-sm flex-1 mx-1">
    <View className={`w-12 h-12 ${bgColor} rounded-full items-center justify-center mb-3`}>
      <Ionicons name={icon} size={24} color={color.replace('text-', '#')} />
    </View>
    <Text className="text-2xl font-bold text-gray-900 mb-1">{count}</Text>
    <Text className="text-sm text-gray-600 font-medium">{title}</Text>
  </View>
);

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  // IMPROVED: Use a dedicated statistics endpoint (fallback to current method if endpoint doesn't exist)
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<UserStatistics>({
    queryKey: ['userStatistics', user?.id], // More specific query key
    queryFn: async (): Promise<UserStatistics> => {
      try {
        // Try to use the dedicated statistics endpoint first
        const { data } = await api.get('/users/statistics');
        return data as UserStatistics;
      } catch (apiError) {
        // Fallback to the current method if the endpoint doesn't exist
        console.log('Statistics endpoint not available, using fallback method');
        const [tasksResponse, patientsResponse] = await Promise.all([
          api.get('/tasks'),
          api.get('/patients'),
        ]);

        const allTasks = tasksResponse.data;
        const allPatients = patientsResponse.data;

        // Calculate statistics
        const tasksCreated = allTasks.filter((task: any) => task.createdBy?.id === user?.id).length;
        const tasksAssigned = allTasks.filter((task: any) => task.assignedTo?.id === user?.id).length;
        const tasksCompleted = allTasks.filter((task: any) => 
          task.status === TaskStatus.COMPLETED && 
          (task.createdBy?.id === user?.id || task.assignedTo?.id === user?.id)
        ).length;
        
        const patientsAssigned = allPatients.filter((patient: any) => 
          patient.createdBy?.id === user?.id
        ).length;

        return {
          tasksCreated,
          tasksAssigned,
          tasksCompleted,
          patientsAssigned,
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - statistics don't change frequently
    gcTime: 10 * 60 * 1000, // FIXED: Changed from 'cacheTime' to 'gcTime'
    retry: 1, // Only retry once for better performance
  });

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

          {/* Statistics Section */}
          <View className="w-full">
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Your Statistics
            </Text>
            
            {statsLoading ? (
              <View className="bg-white rounded-xl p-8 shadow-sm items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-500 mt-2">Loading statistics...</Text>
              </View>
            ) : statsError ? (
              <View className="bg-white rounded-xl p-8 shadow-sm items-center">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-600 mt-2 font-semibold">Failed to load statistics</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">
                  Please check your connection and try again
                </Text>
              </View>
            ) : (
              <>
                {/* First Row */}
                <View className="flex-row mb-4">
                  <StatCard 
                    title="Tasks Created" 
                    count={stats?.tasksCreated ?? 0}
                    icon="add-circle-outline"
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                  />
                  <StatCard 
                    title="Tasks Assigned" 
                    count={stats?.tasksAssigned ?? 0}
                    icon="person-outline"
                    color="text-green-600" 
                    bgColor="bg-green-50"
                  />
                </View>
                
                {/* Second Row */}
                <View className="flex-row mb-6">
                  <StatCard 
                    title="Tasks Completed" 
                    count={stats?.tasksCompleted ?? 0}
                    icon="checkmark-circle-outline"
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                  />
                  <StatCard 
                    title="Patients Managed" 
                    count={stats?.patientsAssigned ?? 0}
                    icon="people-outline"
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                  />
                </View>
              </>
            )}
          </View>

          {/* Quick Actions */}
          <View className="w-full mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
              Quick Actions
            </Text>
            
            <View className="space-y-3">
              <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={22} color="#374151" />
                  <Text className="text-base text-gray-800 ml-4">Edit Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed-outline" size={22} color="#374151" />
                  <Text className="text-base text-gray-800 ml-4">Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="notifications-outline" size={22} color="#374151" />
                  <Text className="text-base text-gray-800 ml-4">Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            className="w-full flex-row items-center justify-center bg-red-500 p-4 rounded-xl shadow-lg mb-8" 
            onPress={handleLogout}
            accessibilityLabel="Logout button"
          >
            <Ionicons name="log-out-outline" size={22} color="white" />
            <Text className="text-white ml-3 text-lg font-semibold">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
