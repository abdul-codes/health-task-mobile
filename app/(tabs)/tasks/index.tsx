// app/(tabs)/tasks/index.tsx
// All Tasks Screen - Updated to use shared mock data
// 
// Changes made:
// 1. Moved mock data to shared mockData.ts file for consistency
// 2. Updated imports to use shared types and data
// 3. Updated TaskListItem interface to use MockTask type
// 4. Ensured smooth data flow between task list and detail screens

import { Feather, Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

// --- Import Shared Mock Data ---
// Using shared mock data for consistency across task screens
import { MockTask, mockTasks, Priority, Status } from '../../../lib/mockData';



// --- Reusable Components ---

interface TaskListItemProps {
  item: MockTask;
}

const TaskListItem = ({ item }: TaskListItemProps) => {
    // Define styles for different priorities and statuses
    const priorityStyles: Record<Priority, string> = {
        Critical: "bg-red-100 text-red-700",
        High: "bg-yellow-100 text-yellow-700",
        Normal: "bg-blue-100 text-blue-700",
        Low: "bg-gray-100 text-gray-700",
    };
    const statusStyles: Record<Status, string> = {
        New: "bg-green-100 text-green-700",
        'In Progress': "bg-purple-100 text-purple-700",
        Completed: "bg-gray-200 text-gray-500",
    };

    const formattedDate = new Date(item.dueDate).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });

    return (
        <Link href={`/tasks/${item.id}`} asChild>
            <TouchableOpacity className="bg-white p-4 rounded-xl mb-4 shadow-sm active:bg-gray-100">
                <Text className="text-lg font-semibold text-gray-800 mb-2">{item.title}</Text>
                <View className="flex-row items-center mb-3">
                    <Feather name="calendar" size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-500 ml-2">Due: {formattedDate}</Text>
                </View>
                <View className="flex-row items-center space-x-2">
                    <View className={`px-3 py-1 rounded-full ${priorityStyles[item.priority]}`}>
                        <Text className={`text-xs font-bold ${priorityStyles[item.priority].split(' ')[1]}`}>{item.priority}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${statusStyles[item.status]}`}>
                        <Text className={`text-xs font-bold ${statusStyles[item.status].split(' ')[1]}`}>{item.status}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    )
};


// --- Main Tasks List Screen ---

export default function TasksScreen() {
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<Status | 'All'>('All');

    const filteredTasks = useMemo(() => {
        if (activeFilter === 'All') {
            return mockTasks;
        }
        return mockTasks.filter(task => task.status === activeFilter);
    }, [activeFilter]);

    const filterOptions: (Status | 'All')[] = ['All', 'New', 'In Progress', 'Completed'];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
            {/* Configure the header for this screen */}
            <Stack.Screen options={{ headerShown: false }} />

            <View className="p-5 flex-1 mt-10">
                {/* --- Custom Header --- */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-3xl font-bold text-gray-800">Tasks</Text>
                    <View className="flex-row space-x-3 ">
                        <TouchableOpacity
                            onPress={() => setFilterModalVisible(true)}
                            className="flex-row items-center bg-white px-4 py-2 rounded-full shadow-sm"
                        >
                            <Ionicons name="filter" size={18} color="#374151" />
                            <Text className="text-base font-semibold text-gray-700 ml-2">Filter</Text>
                        </TouchableOpacity>
                        {/* <Link href="/tasks/create" asChild>
                            <TouchableOpacity className="flex-row items-center bg-blue-500 px-2 py-2 rounded-full shadow-sm">
                                <Ionicons name="add" size={18} color="white" />
                                <Text className="text-base font-semibold text-white ml-2"></Text>
                            </TouchableOpacity>
                        </Link> */}
                    </View>
                </View>

                {/* --- Task List --- */}
                <FlatList
                    data={filteredTasks}
                    renderItem={({ item }) => <TaskListItem item={item} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* --- Filter Modal --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={filterModalVisible}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <Pressable
                    onPress={() => setFilterModalVisible(false)}
                    className="flex-1 justify-end bg-black/40"
                >
                    <View className="bg-white rounded-t-2xl p-5 shadow-lg">
                        <Text className="text-xl font-bold text-center mb-5">Filter by Status</Text>
                        {filterOptions.map(option => (
                            <TouchableOpacity
                                key={option}
                                onPress={() => {
                                    setActiveFilter(option);
                                    setFilterModalVisible(false);
                                }}
                                className={`p-4 rounded-lg mb-2 ${activeFilter === option ? 'bg-blue-100' : 'bg-gray-100'}`}
                            >
                                <Text className={`text-center font-semibold ${activeFilter === option ? 'text-blue-600' : 'text-gray-800'}`}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
