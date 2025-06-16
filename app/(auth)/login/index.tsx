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
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

 const registerMutation = useMutation({
    mutationFn: () => {
      return api.post("/auth/login", { email, password });
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

  const handleLogin = () => {
    if ( !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setIsLoading(true);
    registerMutation.mutate();
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
          {/* Header */}
          <View className="flex-1 justify-center min-h-screen">
            <View className="mb-12">
              <View className="items-center mb-8">
                <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="medical" size={40} color="#3B82F6" />
                </View>
                <Text className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </Text>
                <Text className="text-gray-600 text-center">
                  Sign in to your hospital account
                </Text>
              </View>

              {/* Login Form */}
              <View className="space-y-4">
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

                {/* Password Field */}
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Password</Text>
                  <View className="relative">
                    <TextInput
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 pr-12"
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
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
                </View>

                {/* Forgot Password */}
                <TouchableOpacity className="self-end">
                  <Text className="text-blue-600 font-medium">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  className={`w-full py-4 rounded-xl items-center justify-center mt-6 ${
                    isLoading ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text className="text-white font-semibold text-lg">
                      Signing In...
                    </Text>
                  ) : (
                    <Text className="text-white font-semibold text-lg">
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View className="flex-row justify-center items-center mt-8">
                  <Text className="text-gray-600">Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/register')}
                  >
                    <Text className="text-blue-600 font-semibold">Sign Up</Text>
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