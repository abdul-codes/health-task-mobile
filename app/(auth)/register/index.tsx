import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { registerSchema, type RegisterFormData } from '@/lib/validations';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { label: 'Select Role', value: '' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Nurse', value: 'nurse' },
    { label: 'Lab Tech', value: 'labtech' },
  ];

  // Using the centralized validation schema from lib/validations.ts

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => {
      // Send firstName and lastName as separate fields to match your database model
      return api.post("/auth/register", { 
        firstName: data.firstName, 
        lastName: data.lastName, 
        email: data.email, 
        password: data.password, 
        role: data.role 
      });
    },
    onSuccess: () => {
      Alert.alert("Success", "Registration successful, please log in");
      router.push("/login");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.response?.data?.message || "Registration failed");
      setIsLoading(false);
    },
  });

  const handleRegister = () => {
    setIsLoading(true);
    
    // Validate form data with Zod
    const result = registerSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      role
    });
    
    if (!result.success) {
      // Get the first validation error
      const errorMessage = result.error.errors[0]?.message || "Please check your information";
      Alert.alert("Validation Error", errorMessage);
      setIsLoading(false);
      return;
    }
    
    // If validation passes, proceed with the mutation
    registerMutation.mutate(result.data);
  };
  

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="flex-1 justify-center py-8">
            {/* Header */}
            <View className="mb-8">
              <View className="items-center mb-8">
                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="person-add" size={40} color="#10B981" />
                </View>
                <Text className="text-3xl font-bold text-gray-900 mb-2">
                  Create Account
                </Text>
                <Text className="text-gray-600 text-center">
                  Join our hospital management system
                </Text>
              </View>

              {/* Registration Form */}
              <View className="space-y-4">
                {/* First Name Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">First Name</Text>
                  <View className="relative">
                    <TextInput
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 pr-12"
                      placeholder="Enter your first name"
                      placeholderTextColor="#9CA3AF"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                    <View className="absolute right-4 top-4">
                      <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                    </View>
                  </View>
                </View>

                {/* Last Name Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Last Name</Text>
                  <View className="relative">
                    <TextInput
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 pr-12"
                      placeholder="Enter your last name"
                      placeholderTextColor="#9CA3AF"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                    <View className="absolute right-4 top-4">
                      <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                    </View>
                  </View>
                </View>

                {/* Email Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Email</Text>
                  <View className="relative">
                    <TextInput
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 pr-12"
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                    <View className="absolute right-4 top-4">
                      <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                    </View>
                  </View>
                </View>

                {/* Role Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Role</Text>
                  <View className="bg-gray-50 border border-gray-200 rounded-xl">
                    <Picker
                      selectedValue={role}
                      onValueChange={setRole}
                      style={{ height: 56 }}
                    >
                      {roles.map((roleOption) => (
                        <Picker.Item
                          key={roleOption.value}
                          label={roleOption.label}
                          value={roleOption.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Password Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Password</Text>
                  <View className="relative">
                    <TextInput
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 pr-12"
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password-new"
                    />
                    <TouchableOpacity
                      className="absolute right-4 top-4"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-500 text-sm mt-1">
                    Password must be at least 6 characters
                  </Text>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  className={`w-full py-4 rounded-xl items-center justify-center mt-6 ${
                    isLoading || registerMutation.isPending ? 'bg-green-400' : 'bg-green-600'
                  }`}
                  onPress={handleRegister}
                  disabled={isLoading || registerMutation.isPending}
                >
                  {isLoading || registerMutation.isPending ? (
                    <Text className="text-white font-semibold text-lg">
                      Creating Account...
                    </Text>
                  ) : (
                    <Text className="text-white font-semibold text-lg">
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Login Link */}
                <View className="flex-row justify-center items-center mt-6">
                  <Text className="text-gray-600">Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/login')}
                  >
                    <Text className="text-green-600 font-semibold">Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
