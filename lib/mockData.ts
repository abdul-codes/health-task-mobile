// Shared mock data for tasks
// This file contains mock task data used across the tasks screens for testing purposes

export type Priority = 'Critical' | 'High' | 'Normal' | 'Low';
export type Status = 'New' | 'In Progress' | 'Completed';

export interface MockTask {
  id: string;
  title: string;
  description?: string; // Added optional description field
  patient: {
    name: string;
    roomNumber: string;
    createdBy?: {
      role: string;
      firstName: string;
    };
  };
  priority: Priority;
  status: Status;
  dueDate: string;
}

export const mockTasks: MockTask[] = [
  { 
    id: "task101", 
    title: "Administer Medication", 
    description: "Administer prescribed medication to patient. Check for allergies and monitor for adverse reactions.",
    patient: { 
      name: "John Doe", 
      roomNumber: "301A",
      createdBy: { role: "Doctor", firstName: "Sarah" }
    }, 
    priority: "Critical", 
    status: "New", 
    dueDate: "2025-06-16T10:00:00Z" 
  },
  { 
    id: "task102", 
    title: "Check Vital Signs", 
    description: "Monitor and record patient's vital signs including blood pressure, temperature, and heart rate.",
    patient: { 
      name: "Jane Smith", 
      roomNumber: "302B",
      createdBy: { role: "Nurse", firstName: "Michael" }
    }, 
    priority: "High", 
    status: "New", 
    dueDate: "2025-06-16T10:15:00Z" 
  },
  { 
    id: "task103", 
    title: "Update Patient Chart", 
    description: "Update patient medical chart with latest test results and treatment notes.",
    patient: { 
      name: "Robert Brown", 
      roomNumber: "305A",
      createdBy: { role: "Doctor", firstName: "Emily" }
    }, 
    priority: "Normal", 
    status: "In Progress", 
    dueDate: "2025-06-16T10:30:00Z" 
  },
  { 
    id: "task104", 
    title: "Prepare for Discharge", 
    description: "Complete discharge paperwork and provide patient with post-care instructions.",
    patient: { 
      name: "Emily White", 
      roomNumber: "303C",
      createdBy: { role: "Nurse", firstName: "David" }
    }, 
    priority: "Normal", 
    status: "New", 
    dueDate: "2025-06-16T11:00:00Z" 
  },
  { 
    id: "task105", 
    title: "Change IV Drip", 
    description: "Replace IV drip bag and check insertion site for signs of infection.",
    patient: { 
      name: "Michael Johnson", 
      roomNumber: "301A",
      createdBy: { role: "Nurse", firstName: "Lisa" }
    }, 
    priority: "Low", 
    status: "Completed", 
    dueDate: "2025-06-16T11:30:00Z" 
  },
  { 
    id: "task106", 
    title: "Physical Therapy Session", 
    description: "Conduct scheduled physical therapy session focusing on mobility exercises.",
    patient: { 
      name: "Sarah Connor", 
      roomNumber: "307C",
      createdBy: { role: "Therapist", firstName: "James" }
    }, 
    priority: "High", 
    status: "In Progress", 
    dueDate: "2025-06-16T13:00:00Z"
  },
  { 
    id: "task107", 
    title: "Consult with Specialist", 
    description: "Schedule and coordinate consultation with cardiology specialist.",
    patient: { 
      name: "John Doe", 
      roomNumber: "301A",
      createdBy: { role: "Doctor", firstName: "Sarah" }
    }, 
    priority: "Critical", 
    status: "In Progress", 
    dueDate: "2025-06-16T14:00:00Z"
  }
];

// Helper function to find a task by ID
export const findTaskById = (id: string): MockTask | undefined => {
  return mockTasks.find(task => task.id === id);
};