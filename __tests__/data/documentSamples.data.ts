// Synthetic Document Samples Test Data
// Sample documents for testing document parser accuracy

import { DocumentType, ExtractedField } from '@/lib/types';

export interface DocumentTestCase {
  name: string;
  text: string;
  documentType: DocumentType;
  expectedFields: Record<string, { value: string; confidence: number }>;
  description?: string;
}

// Patient Record Samples (various formats)
export const PATIENT_SAMPLES: DocumentTestCase[] = [
  {
    name: 'Standard Patient Record',
    text: `Patient Name: John Doe
Age: 45
Gender: Male
Phone: +234 801 234 5678
Address: 123 Lagos Street, Ikeja
Date: 12/05/2024`,
    documentType: 'PATIENT_RECORD' as DocumentType,
    expectedFields: {
      name: { value: 'John Doe', confidence: 95 },
      age: { value: '45', confidence: 98 },
      gender: { value: 'Male', confidence: 95 },
      phone: { value: '+234 801 234 5678', confidence: 90 },
    },
    description: 'Standard Nigerian hospital patient registration form',
  },
  {
    name: 'Patient Record with Full Details',
    text: `Name: Jane Smith
Age: 32 years old
Sex: Female
Contact: 08012345678
Address: 45 Abuja Road, Port Harcourt
Occupation: Teacher
Next of Kin: Mr. James Smith
Blood Group: O+
Genotype: AA
Date: 15-03-2024`,
    documentType: 'PATIENT_RECORD' as DocumentType,
    expectedFields: {
      name: { value: 'Jane Smith', confidence: 95 },
      age: { value: '32', confidence: 95 },
      gender: { value: 'Female', confidence: 95 },
      phone: { value: '08012345678', confidence: 90 },
      bloodGroup: { value: 'O+', confidence: 95 },
      genotype: { value: 'AA', confidence: 95 },
    },
    description: 'Comprehensive patient record with all fields',
  },
  {
    name: 'Patient Record - Alternative Format',
    text: `Biodata:
Patient: Michael Johnson
DOB: 10/08/1980
Sex: M
Tel: +234-803-555-0123
Home Address: Plot 12, Banana Island, Lagos
Date Registered: 20.06.2024`,
    documentType: 'PATIENT_RECORD' as DocumentType,
    expectedFields: {
      name: { value: 'Michael Johnson', confidence: 90 },
      phone: { value: '+234-803-555-0123', confidence: 90 },
    },
    description: 'Alternative layout with different field labels',
  },
  {
    name: 'Patient Record - Minimal Info',
    text: `Name: Sarah Williams
Age: 28
Phone: 07031234567
Date: 01/01/2024`,
    documentType: 'PATIENT_RECORD' as DocumentType,
    expectedFields: {
      name: { value: 'Sarah Williams', confidence: 95 },
      age: { value: '28', confidence: 98 },
      phone: { value: '07031234567', confidence: 90 },
    },
    description: 'Minimal patient information',
  },
  {
    name: 'Patient Record with Nigerian Phone Format',
    text: `Patient Information
Name: Chinedu Okonkwo
Age: 55
Gender: Male
Phone Number: +234 706 789 0123
Address: No. 25 Adetokunbo Ademola Street, Victoria Island, Lagos
Date: 25/12/2023`,
    documentType: 'PATIENT_RECORD' as DocumentType,
    expectedFields: {
      name: { value: 'Chinedu Okonkwo', confidence: 95 },
      age: { value: '55', confidence: 98 },
      gender: { value: 'Male', confidence: 95 },
      phone: { value: '+234 706 789 0123', confidence: 90 },
    },
    description: 'Typical Nigerian name and address format',
  },
];

// Prescription Samples
export const PRESCRIPTION_SAMPLES: DocumentTestCase[] = [
  {
    name: 'Simple Paracetamol Prescription',
    text: `Rx:
Paracetamol 500mg
1 tab TDS for 5 days
Take after meals
Dr. A.B. Johnson
Date: 10/06/2024`,
    documentType: 'PRESCRIPTION' as DocumentType,
    expectedFields: {
      medication: { value: 'Paracetamol', confidence: 90 },
      dosage: { value: '500mg', confidence: 92 },
      frequency: { value: 'three', confidence: 85 },
      duration: { value: '5', confidence: 88 },
    },
    description: 'Standard fever medication prescription',
  },
  {
    name: 'Malaria Treatment Prescription',
    text: `PRESCRIPTION

Patient: John Doe
Age: 30

Medications:
1. Artemether-Lumefantrine (Coartem) 20/120mg
   - 4 tablets stat, then 4 tablets after 8 hours
   - Then 4 tablets BD for 2 days
   
2. Paracetamol 500mg
   - 2 tablets TDS PRN for fever

Instructions: Complete full course even if feeling better

Dr. Sarah Williams
Date: 15/03/2024`,
    documentType: 'PRESCRIPTION' as DocumentType,
    expectedFields: {
      medication: { value: 'Artemether-Lumefantrine', confidence: 85 },
      dosage: { value: '20/120mg', confidence: 90 },
      frequency: { value: 'twice', confidence: 85 },
    },
    description: 'Complex malaria treatment with multiple medications',
  },
  {
    name: 'Antibiotic Prescription',
    text: `Rx

Amoxicillin 500mg
1 capsule TDS for 7 days
Take with food

Metronidazole 400mg
1 tablet BD for 5 days
Avoid alcohol

Dr. James Peterson
Date: 20-04-2024`,
    documentType: 'PRESCRIPTION' as DocumentType,
    expectedFields: {
      medication: { value: 'Amoxicillin', confidence: 90 },
      dosage: { value: '500mg', confidence: 92 },
      frequency: { value: 'three', confidence: 85 },
      duration: { value: '7', confidence: 88 },
    },
    description: 'Dual antibiotic therapy',
  },
  {
    name: 'Chronic Condition Prescription',
    text: `PRESCRIPTION

Patient: Mary Johnson
Hypertension Management

Amlodipine 5mg
1 tablet OD (Morning)
Duration: 30 days (1 month)
Refill: 3 times

Instructions:
- Take same time daily
- Monitor BP weekly
- Return for review in 1 month

Dr. Michael Brown
Date: 01/05/2024`,
    documentType: 'PRESCRIPTION' as DocumentType,
    expectedFields: {
      medication: { value: 'Amlodipine', confidence: 90 },
      dosage: { value: '5mg', confidence: 92 },
      frequency: { value: '1', confidence: 90 },
      duration: { value: '30', confidence: 85 },
    },
    description: 'Long-term hypertension medication',
  },
  {
    name: 'Syrup Prescription for Child',
    text: `Paediatric Prescription

Patient: Emmanuel, 5 years old
Weight: 18kg

1. Amoxicillin Syrup 125mg/5ml
   - 10ml TDS for 5 days
   
2. Paracetamol Syrup 120mg/5ml
   - 5ml PRN for fever (max 4 times daily)

Dr. Linda Okonkwo
Date: 12/07/2024`,
    documentType: 'PRESCRIPTION' as DocumentType,
    expectedFields: {
      medication: { value: 'Amoxicillin', confidence: 85 },
      dosage: { value: '125mg/5ml', confidence: 90 },
      frequency: { value: 'three', confidence: 85 },
      duration: { value: '5', confidence: 88 },
    },
    description: 'Paediatric liquid medication prescription',
  },
];

// Lab Result Samples
export const LAB_RESULT_SAMPLES: DocumentTestCase[] = [
  {
    name: 'Full Blood Count Report',
    text: `LABORATORY REPORT

Patient: John Doe
Date: 15/03/2024

TEST                    RESULT          REFERENCE RANGE
PCV                     42%             36-46%
Haemoglobin (Hb)        14.2 g/dL       12-16 g/dL
WBC                     6.5 x10^9/L     4-11 x10^9/L
RBC                     5.2 x10^12/L    4.5-6.0 x10^12/L
Platelets               250 x10^9/L     150-400 x10^9/L

Comment: Results within normal limits

Lab Technician: A.S. Mohammed
Signature: ___________`,
    documentType: 'LAB_RESULT' as DocumentType,
    expectedFields: {
      testType: { value: 'PCV', confidence: 95 },
      result: { value: '42', confidence: 92 },
      referenceRange: { value: '36-46%', confidence: 90 },
    },
    description: 'Standard FBC report with all parameters',
  },
  {
    name: 'Malaria Test Report',
    text: `LABORATORY INVESTIGATION REPORT

Patient Name: Jane Smith
Age/Sex: 28/F
Lab No: 2024031501
Date: 15 March 2024

Malaria Parasite Test:
Result: POSITIVE (+)
Species: Plasmodium falciparum
Parasite Density: 1250 parasites/µL

Blood Film:
Ring forms seen
Gametocytes present

Recommendation: Treat with ACTs

Dr. (Mrs) Amina Bello
Consultant Haematologist`,
    documentType: 'LAB_RESULT' as DocumentType,
    expectedFields: {
      testType: { value: 'Malaria', confidence: 95 },
      result: { value: 'POSITIVE', confidence: 90 },
      labDate: { value: '15 March 2024', confidence: 90 },
    },
    description: 'Malaria parasite detection report',
  },
  {
    name: 'Blood Chemistry Report',
    text: `CHEMISTRY REPORT

Patient: Michael Brown
Date: 20/04/2024

TEST                    RESULT          UNIT            REF RANGE
Fasting Blood Sugar     95              mg/dL           70-100
Random Blood Sugar      140             mg/dL           <140
HbA1c                   5.8%            %               <6.5%
Urea                    25              mg/dL           15-45
Creatinine              1.0             mg/dL           0.7-1.3
Sodium                  140             mmol/L          135-145
Potassium               4.2             mmol/L          3.5-5.0

Impression: Normal renal function and glycemic control

Dr. S.O. Adeyemi
Pathologist`,
    documentType: 'LAB_RESULT' as DocumentType,
    expectedFields: {
      testType: { value: 'FBS', confidence: 90 },
      result: { value: '95', confidence: 92 },
      referenceRange: { value: '70-100', confidence: 90 },
    },
    description: 'Comprehensive metabolic panel',
  },
  {
    name: 'Liver Function Test',
    text: `LIVER FUNCTION TEST REPORT

Patient: Sarah Williams
Date: 01/05/2024

INVESTIGATION           RESULT          NORMAL RANGE
Total Bilirubin         0.8             0.1-1.2 mg/dL
Direct Bilirubin        0.3             0.0-0.3 mg/dL
Indirect Bilirubin      0.5             0.1-0.9 mg/dL
SGOT (AST)              28              10-40 U/L
SGPT (ALT)              32              7-56 U/L
Alkaline Phosphatase    85              44-147 U/L
Total Protein           7.2             6.0-8.3 g/dL
Albumin                 4.5             3.5-5.0 g/dL
Globulin                2.7             2.0-3.5 g/dL

Comment: Normal liver function

Laboratory Scientist: K.O. Nwosu
Date: 02/05/2024`,
    documentType: 'LAB_RESULT' as DocumentType,
    expectedFields: {
      testType: { value: 'LFT', confidence: 95 },
      result: { value: '0.8', confidence: 92 },
      referenceRange: { value: '0.1-1.2 mg/dL', confidence: 90 },
    },
    description: 'Complete liver function panel',
  },
  {
    name: 'Urinalysis Report',
    text: `URINALYSIS REPORT

Patient: David Okonkwo
Sex/Age: M/35
Lab No: U2024071205
Date: 12 July 2024

Physical Examination:
Color: Yellow
Appearance: Clear

Chemical Examination:
pH: 6.0 (Normal: 4.5-8.0)
Specific Gravity: 1.020 (Normal: 1.005-1.030)
Protein: Negative
Glucose: Negative
Ketones: Negative
Blood: Negative
Bilirubin: Negative
Nitrite: Negative
Leukocytes: Negative

Microscopy:
Pus cells: 0-2 /HPF
Red cells: Nil
Epithelial cells: Few
Casts: Nil
Crystals: Nil
Bacteria: Nil

Impression: Normal urinalysis

Medical Lab Scientist: Nkechi Okafor
Date: 12/07/2024`,
    documentType: 'LAB_RESULT' as DocumentType,
    expectedFields: {
      testType: { value: 'Urinalysis', confidence: 95 },
      result: { value: 'Yellow', confidence: 90 },
    },
    description: 'Comprehensive urine analysis',
  },
];

// Task/Note Samples
export const TASK_NOTE_SAMPLES: DocumentTestCase[] = [
  {
    name: 'Simple Task',
    text: `Task: Follow up on Patient John Doe
Description: Check BP readings and medication compliance
Due Date: 20/06/2024
Priority: High
Assigned to: Nurse Sarah`,
    documentType: 'TASK_NOTE' as DocumentType,
    expectedFields: {
      title: { value: 'Follow up on Patient John Doe', confidence: 90 },
      description: { value: 'Check BP readings and medication compliance', confidence: 85 },
      dueDate: { value: '20/06/2024', confidence: 90 },
      priority: { value: 'High', confidence: 95 },
    },
    description: 'Standard patient follow-up task',
  },
  {
    name: 'Doctor\'s Instructions',
    text: `Medical Notes - Patient: Jane Smith

Instructions:
1. Monitor blood sugar daily
2. Continue Metformin 500mg BD
3. Diet: Low carb, high fiber
4. Exercise: 30 mins walking daily
5. Review in 2 weeks

Date: 15/03/2024
Doctor: Dr. Williams`,
    documentType: 'TASK_NOTE' as DocumentType,
    expectedFields: {
      title: { value: 'Medical Notes - Patient: Jane Smith', confidence: 85 },
      description: { value: 'Monitor blood sugar daily', confidence: 80 },
    },
    description: 'Doctor notes with multiple instructions',
  },
  {
    name: 'Ward Task List',
    text: `WARD 5 - DAILY TASKS
Date: 12/07/2024

Priority: CRITICAL
- Administer IV antibiotics to Bed 3
- Check vitals for all patients q4h

Priority: HIGH  
- Discharge paperwork for Bed 8
- Arrange transfer for Bed 12 to ICU

Priority: MEDIUM
- Restock medication trolley
- Update patient charts

Assigned: Nurse on Duty`,
    documentType: 'TASK_NOTE' as DocumentType,
    expectedFields: {
      title: { value: 'WARD 5 - DAILY TASKS', confidence: 90 },
      dueDate: { value: '12/07/2024', confidence: 92 },
      priority: { value: 'CRITICAL', confidence: 95 },
    },
    description: 'Nursing task list with priorities',
  },
];

// Combine all samples
export const ALL_DOCUMENT_SAMPLES: DocumentTestCase[] = [
  ...PATIENT_SAMPLES,
  ...PRESCRIPTION_SAMPLES,
  ...LAB_RESULT_SAMPLES,
  ...TASK_NOTE_SAMPLES,
];

// Export by category for targeted testing
export const DOCUMENT_CATEGORIES = {
  PATIENT: PATIENT_SAMPLES,
  PRESCRIPTION: PRESCRIPTION_SAMPLES,
  LAB: LAB_RESULT_SAMPLES,
  TASK: TASK_NOTE_SAMPLES,
};

// Metrics calculation for document parsing
export interface DocumentParseMetrics {
  totalDocuments: number;
  correctTypeDetection: number;
  totalFields: number;
  correctFields: number;
  typeAccuracy: number;
  fieldAccuracy: number;
  averageConfidence: number;
}

export function calculateDocumentMetrics(
  results: {
    documentType: DocumentType;
    detectedType: DocumentType;
    fields: ExtractedField[];
    expectedFields: Record<string, { value: string; confidence: number }>;
  }[]
): DocumentParseMetrics {
  let totalFields = 0;
  let correctFields = 0;
  let totalConfidence = 0;
  let confidenceCount = 0;

  const correctTypeDetection = results.filter(
    r => r.documentType === r.detectedType
  ).length;

  results.forEach(result => {
    Object.entries(result.expectedFields).forEach(([fieldName, expected]) => {
      totalFields++;
      const extracted = result.fields.find(f => f.name === fieldName);
      
      if (extracted) {
        totalConfidence += extracted.confidence;
        confidenceCount++;
        
        if (extracted.value.toLowerCase() === expected.value.toLowerCase()) {
          correctFields++;
        }
      }
    });
  });

  return {
    totalDocuments: results.length,
    correctTypeDetection,
    totalFields,
    correctFields,
    typeAccuracy: (correctTypeDetection / results.length) * 100,
    fieldAccuracy: totalFields > 0 ? (correctFields / totalFields) * 100 : 0,
    averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
  };
}
