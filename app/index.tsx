import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router'; // Import router from expo-router
import "../global.css";

// Remove these React Navigation types - not needed with Expo Router
// type RootStackParamList = {
//   Login: undefined;
//   Register: undefined;
// };

// type WelcomeScreenProps = {
//   navigation: NativeStackNavigationProp<RootStackParamList>;
// };

// Remove the props parameter - Expo Router doesn't use navigation props
const WelcomeScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header Section */}
      <LinearGradient
        colors={['#2E7D9A', '#4A9FB8']}
        className="h-2/5 justify-center items-center px-5"
      >
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-white/20 justify-center items-center mb-4 border-2 border-white/30">
            <Text className="text-3xl font-bold text-white">H+</Text>
          </View>
          <Text className="text-3xl font-bold text-white mb-2">HealthTask</Text>
          <Text className="text-base text-white/90 text-center italic">
            Managing Care, Streamlining Tasks
          </Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View className="flex-1 px-5 justify-between">
        <View className="pt-8">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
            Welcome to HealthTask
          </Text>
          <Text className="text-base text-secondary text-center leading-6 mb-8 px-2">
            Streamline your hospital operations with real-time task management,
            secure communication, and efficient workflow coordination.
          </Text>

          <View className="mb-5">
            <FeatureItem 
              icon="📋" 
              title="Task Management" 
              description="Assign and track tasks in real-time"
            />
            <FeatureItem 
              icon="🔔" 
              title="Instant Notifications" 
              description="Stay updated with critical alerts"
            />
            <FeatureItem 
              icon="👥" 
              title="Team Collaboration" 
              description="Coordinate seamlessly with your team"
            />
            <FeatureItem 
              icon="🔒" 
              title="Secure & Compliant" 
              description="HIPAA-compliant data protection"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="pb-8">
          <TouchableOpacity 
            className="bg-primary py-4 rounded-xl mb-3 shadow-lg"
            onPress={() => router.push('/login')} // Use router.push instead
          >
            <Text className="text-white text-lg font-semibold text-center">
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white py-4 rounded-xl mb-3 border-2 border-primary"
            onPress={() => router.push('/register')} // Use router.push instead
          >
            <Text className="text-primary text-lg font-semibold text-center">
              Create Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="py-3"
            onPress={() => {/* Handle guest tour */}}
          >
            <Text className="text-secondary text-base text-center underline">
              Take a Tour
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

type FeatureItemProps = {
  icon: string;
  title: string;
  description: string;
};

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => (
  <View className="flex-row items-center py-3 px-4 bg-white rounded-xl mb-3 shadow-sm">
    <Text className="text-2xl mr-4">{icon}</Text>
    <View className="flex-1">
      <Text className="text-base font-semibold text-gray-800 mb-1">
        {title}
      </Text>
      <Text className="text-sm text-secondary leading-4">
        {description}
      </Text>
    </View>
  </View>
);

export default WelcomeScreen;