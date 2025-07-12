import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function PatientsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>
          Patients
        </Text>
      </View>
    </SafeAreaView>
  );
}