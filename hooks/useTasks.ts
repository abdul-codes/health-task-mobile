// hooks/useTasks.ts
import { useQuery } from '@tanstack/react-query';
import { Task, TaskPriority, TaskStatus, UserRole } from '@/lib/types';

const fetchTaskById = async (taskId: string): Promise<Task> => {
    const response = await fetch(`192.168.214.201:8000/tasks/${taskId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch task');
    }
    return response.json();
};

export const useTask = (taskId: string) => {
 //   return useQuery<Task, Error>({
    return useQuery({
        queryKey: ['task', taskId],
        queryFn: () => fetchTaskById(taskId),
        enabled: !!taskId, // Only run query if taskId exists
    });
};

// Mock Task
// You can create a new file like lib/api.ts or services/tasks.ts


// This is a MOCK API call. Replace it with your actual fetch/axios call.
 const getTaskById = async (taskId: string): Promise<Task> => {
    console.log(`Fetching task with ID: ${taskId}`);

    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, this would be:
    // const response = await fetch(`https://yourapi.com/tasks/${taskId}`);
    // if (!response.ok) {
    //   throw new Error('Network response was not ok');
    // }
    // return response.json();

    // --- MOCK DATA FOR DEMONSTRATION ---
    if (taskId === '404') {
        throw new Error('Task not found');
    }

    const mockTask: Task = {
        id: taskId,
        title: `Fetched Task ${taskId}`,
        description: 'This data was fetched from a simulated API using TanStack Query.',
        priority: TaskPriority.CRITICAL,
        status: TaskStatus.PENDING,
        dueDate: new Date().toISOString(),
        patient: {
            id: 'patient-1',
            name: 'John Doe',
            dob: '1980-01-01',
            roomNumber: '101',
            medicalRecord: 'MR123456',
            createdAt: new Date().toISOString(),
            createdBy: {
                id: 'user-1',
                email: 'jane@example.com',
                firstName: 'Jane',
                lastName: 'Doe',
                role: UserRole.Doctor,
                isApproved: true
            }
        },
        createdAt: '',
        createdBy: {
            id: 'user-2',
            email: 'admin@example.com',
            firstName: 'Alice',
            lastName: 'Smith',
            role: UserRole.Admin,
            isApproved: true
        }
    };
    return mockTask
}

export default getTaskById