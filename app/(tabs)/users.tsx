import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  ScrollView, // Added missing import
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department: string | null;
  profilePicture: string | null;
  phoneNumber: string | null;
  createdAt: string;
}

const roleColors = {
  [UserRole.Admin]: { bg: 'bg-purple-100', text: 'text-purple-800', icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap },
  [UserRole.Doctor]: { bg: 'bg-green-100', text: 'text-green-800', icon: 'medical' as keyof typeof Ionicons.glyphMap },
  [UserRole.Nurse]: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'heart' as keyof typeof Ionicons.glyphMap },
  [UserRole.Labtech]: { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'flask' as keyof typeof Ionicons.glyphMap },
};

const UserCard = ({ user }: { user: User }) => {
  const roleConfig = roleColors[user.role];
  const joinDate = new Date(user.createdAt).toLocaleDateString();

  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="relative">
          {user.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center">
              <Text className="text-gray-600 font-bold text-lg">
                {user.firstName[0]}{user.lastName[0]}
              </Text>
            </View>
          )}
          
          {/* Role icon badge */}
          <View className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full items-center justify-center ${roleConfig.bg}`}>
            <Ionicons name={roleConfig.icon} size={12} color={roleConfig.text.replace('text-', '#')} />
          </View>
        </View>

        {/* User Info */}
        <View className="flex-1 ml-4">
          <Text className="text-lg font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </Text>
          <Text className="text-sm text-gray-600 mb-1">
            {user.email}
          </Text>
          
          {/* Role Badge */}
          <View className={`self-start px-3 py-1 rounded-full ${roleConfig.bg}`}>
            <Text className={`text-xs font-semibold uppercase ${roleConfig.text}`}>
              {user.role}
            </Text>
          </View>
        </View>

        {/* Contact Icon */}
        <TouchableOpacity 
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          onPress={() => Alert.alert('Contact', `Email: ${user.email}`)}
        >
          <Ionicons name="mail-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Additional Info */}
      <View className="mt-3 pt-3 border-t border-gray-100 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-500 ml-1">
            Joined {joinDate}
          </Text>
        </View>
        
        {user.department && (
          <View className="flex-row items-center">
            <Ionicons name="business-outline" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-500 ml-1">
              {user.department}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function AllUsersScreen() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');

  // FIXED: Move all hooks before any conditional logic
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User[]>({
    queryKey: ['allUsers', currentUser?.id],
    queryFn: async () => {
      const { data } = await api.get('/users', {
        params: { limit: 100 }
      });
      return data.users;
    },
    enabled: !!currentUser?.id && currentUser?.role === UserRole.Admin, // Only fetch if admin
  });

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by role
    if (selectedRole !== 'ALL') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, selectedRole, searchQuery]);

  // Group users by role for statistics
  const userStats = useMemo(() => {
    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: users.length,
      doctors: stats[UserRole.Doctor] || 0,
      nurses: stats[UserRole.Nurse] || 0,
      labtechs: stats[UserRole.Labtech] || 0,
      admins: stats[UserRole.Admin] || 0,
    };
  }, [users]);

  // FIXED: Handle admin check after all hooks
  if (currentUser?.role !== UserRole.Admin) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 p-8">
        <Ionicons name="shield-outline" size={80} color="#DC2626" />
        <Text className="text-xl font-bold text-red-600 mt-4 text-center">
          Access Denied
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          Only administrators can view the user directory.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading users...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 p-8">
        <Ionicons name="cloud-offline-outline" size={60} color="#EF4444" />
        <Text className="text-lg font-semibold text-red-500 mt-4 text-center">
          Error loading users
        </Text>
        <Text className="text-gray-500 mt-1 text-center">{error?.message}</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-6 bg-blue-600 px-6 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 ml-2">
            User Directory
          </Text>
        </View>
      </View>

      {/* Statistics Cards */}
      <View className="px-4 py-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            <View className="bg-white rounded-xl p-3 shadow-sm min-w-[80px] items-center">
              <Text className="text-2xl font-bold text-blue-600">{userStats.total}</Text>
              <Text className="text-xs text-gray-500">Total</Text>
            </View>
            <View className="bg-white rounded-xl p-3 shadow-sm min-w-[80px] items-center">
              <Text className="text-2xl font-bold text-green-600">{userStats.doctors}</Text>
              <Text className="text-xs text-gray-500">Doctors</Text>
            </View>
            <View className="bg-white rounded-xl p-3 shadow-sm min-w-[80px] items-center">
              <Text className="text-2xl font-bold text-blue-600">{userStats.nurses}</Text>
              <Text className="text-xs text-gray-500">Nurses</Text>
            </View>
            <View className="bg-white rounded-xl p-3 shadow-sm min-w-[80px] items-center">
              <Text className="text-2xl font-bold text-orange-600">{userStats.labtechs}</Text>
              <Text className="text-xs text-gray-500">Lab Techs</Text>
            </View>
            <View className="bg-white rounded-xl p-3 shadow-sm min-w-[80px] items-center">
              <Text className="text-2xl font-bold text-purple-600">{userStats.admins}</Text>
              <Text className="text-xs text-gray-500">Admins</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Search and Filter */}
      <View className="px-4 mb-4">
        {/* Search Bar */}
        <View className="bg-white rounded-xl px-4 py-3 mb-3 border border-gray-200 flex-row items-center">
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users by name or email..."
            className="flex-1 ml-3 text-base text-gray-800"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Role Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            {['ALL', UserRole.Doctor, UserRole.Nurse, UserRole.Labtech, UserRole.Admin].map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => setSelectedRole(role as UserRole | 'ALL')}
                className={`px-4 py-2 rounded-full border ${
                  selectedRole === role
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    selectedRole === role ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {role === 'ALL' ? 'All Users' : role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={({ item }) => <UserCard user={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-8">
            <Ionicons name="people-outline" size={60} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-700 mt-4">
              No users found
            </Text>
            <Text className="text-gray-500 mt-1 text-center">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No users match the selected filter.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
