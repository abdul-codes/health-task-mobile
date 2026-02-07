// Synthetic Medical Terms Test Data
// Comprehensive test cases for medical dictionary fuzzy matching

export interface MedicalTestCase {
  input: string;
  expected: string;
  category: 'medication' | 'diagnosis' | 'abbreviation';
  confidenceThreshold?: number;
  description?: string;
}

// Perfect spellings - should match with 100% confidence
export const PERFECT_SPELLINGS: MedicalTestCase[] = [
  { input: 'Paracetamol', expected: 'Paracetamol', category: 'medication' },
  { input: 'Malaria', expected: 'Malaria', category: 'diagnosis' },
  { input: 'Hypertension', expected: 'Hypertension', category: 'diagnosis' },
  { input: 'Amlodipine', expected: 'Amlodipine', category: 'medication' },
  { input: 'Metformin', expected: 'Metformin', category: 'medication' },
  { input: 'Typhoid', expected: 'Typhoid', category: 'diagnosis' },
  { input: 'Gastroenteritis', expected: 'Gastroenteritis', category: 'diagnosis' },
  { input: 'Amoxicillin', expected: 'Amoxicillin', category: 'medication' },
  { input: 'Ciprofloxacin', expected: 'Ciprofloxacin', category: 'medication' },
  { input: 'Artemether', expected: 'Artemether', category: 'medication' },
  { input: 'Lumefantrine', expected: 'Lumefantrine', category: 'medication' },
  { input: 'Metronidazole', expected: 'Metronidazole', category: 'medication' },
  { input: 'Ibuprofen', expected: 'Ibuprofen', category: 'medication' },
  { input: 'Aspirin', expected: 'Aspirin', category: 'medication' },
  { input: 'Diabetes', expected: 'Diabetes', category: 'diagnosis' },
  { input: 'Asthma', expected: 'Asthma', category: 'diagnosis' },
  { input: 'Pneumonia', expected: 'Pneumonia', category: 'diagnosis' },
  { input: 'Tuberculosis', expected: 'Tuberculosis', category: 'diagnosis' },
  { input: 'Anemia', expected: 'Anemia', category: 'diagnosis' },
  { input: 'Meningitis', expected: 'Meningitis', category: 'diagnosis' },
];

// Common misspellings - should be corrected with 80-95% confidence
export const MISSPELLED_TERMS: MedicalTestCase[] = [
  { input: 'Paracetamole', expected: 'Paracetamol', category: 'medication', confidenceThreshold: 80 },
  { input: 'Paracetemol', expected: 'Paracetamol', category: 'medication', confidenceThreshold: 85 },
  { input: 'Paracetaol', expected: 'Paracetamol', category: 'medication', confidenceThreshold: 80 },
  { input: 'Malana', expected: 'Malaria', category: 'diagnosis', confidenceThreshold: 85 },
  { input: 'Malarria', expected: 'Malaria', category: 'diagnosis', confidenceThreshold: 85 },
  { input: 'Mallaria', expected: 'Malaria', category: 'diagnosis', confidenceThreshold: 85 },
  { input: 'Hypertenshion', expected: 'Hypertension', category: 'diagnosis', confidenceThreshold: 80 },
  { input: 'Hypertenson', expected: 'Hypertension', category: 'diagnosis', confidenceThreshold: 85 },
  { input: 'Hypertention', expected: 'Hypertension', category: 'diagnosis', confidenceThreshold: 85 },
  { input: 'Amlodopine', expected: 'Amlodipine', category: 'medication', confidenceThreshold: 85 },
  { input: 'Amlodipin', expected: 'Amlodipine', category: 'medication', confidenceThreshold: 90 },
  { input: 'Amlodpine', expected: 'Amlodipine', category: 'medication', confidenceThreshold: 85 },
  { input: 'Artemeter', expected: 'Artemether', category: 'medication', confidenceThreshold: 90 },
  { input: 'Artmether', expected: 'Artemether', category: 'medication', confidenceThreshold: 85 },
  { input: 'Metronidazol', expected: 'Metronidazole', category: 'medication', confidenceThreshold: 95 },
  { input: 'Metronidazle', expected: 'Metronidazole', category: 'medication', confidenceThreshold: 90 },
  { input: 'Metformn', expected: 'Metformin', category: 'medication', confidenceThreshold: 90 },
  { input: 'Metformine', expected: 'Metformin', category: 'medication', confidenceThreshold: 90 },
  { input: 'Typhiod', expected: 'Typhoid', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Typhoide', expected: 'Typhoid', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Amoxicilin', expected: 'Amoxicillin', category: 'medication', confidenceThreshold: 95 },
  { input: 'Amoxycillin', expected: 'Amoxicillin', category: 'medication', confidenceThreshold: 90 },
  { input: 'Ciprofloxacn', expected: 'Ciprofloxacin', category: 'medication', confidenceThreshold: 90 },
  { input: 'Ciprofloxacin', expected: 'Ciprofloxacin', category: 'medication', confidenceThreshold: 100 },
  { input: 'Gastroenteritis', expected: 'Gastroenteritis', category: 'diagnosis', confidenceThreshold: 95 },
  { input: 'Gastroentritis', expected: 'Gastroenteritis', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Lumefantrne', expected: 'Lumefantrine', category: 'medication', confidenceThreshold: 90 },
  { input: 'Lumefantrin', expected: 'Lumefantrine', category: 'medication', confidenceThreshold: 95 },
  { input: 'Ibuprofun', expected: 'Ibuprofen', category: 'medication', confidenceThreshold: 90 },
  { input: 'Ibroprofen', expected: 'Ibuprofen', category: 'medication', confidenceThreshold: 85 },
  { input: 'Diabetis', expected: 'Diabetes', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Diabete', expected: 'Diabetes', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Asma', expected: 'Asthma', category: 'diagnosis', confidenceThreshold: 85 },
  { input: 'Asthama', expected: 'Asthma', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Pnumonia', expected: 'Pneumonia', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Pneumonia', expected: 'Pneumonia', category: 'diagnosis', confidenceThreshold: 100 },
  { input: 'Tuberculossis', expected: 'Tuberculosis', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Tuberculoss', expected: 'Tuberculosis', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Anaemia', expected: 'Anemia', category: 'diagnosis', confidenceThreshold: 95 },
  { input: 'Anema', expected: 'Anemia', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Menengitis', expected: 'Meningitis', category: 'diagnosis', confidenceThreshold: 90 },
  { input: 'Meningites', expected: 'Meningitis', category: 'diagnosis', confidenceThreshold: 90 },
];

// Nigerian context abbreviations and variations
export const NIGERIAN_VARIANTS: MedicalTestCase[] = [
  { input: 'PCM', expected: 'Paracetamol', category: 'abbreviation', description: 'Common abbreviation for Paracetamol in Nigeria' },
  { input: 'PCM', expected: 'Paracetamol', category: 'medication' },
  { input: 'Typhoid', expected: 'Typhoid Fever', category: 'diagnosis' },
  { input: 'Typhoid Fever', expected: 'Typhoid Fever', category: 'diagnosis' },
  { input: 'BP', expected: 'Blood Pressure', category: 'abbreviation' },
  { input: 'HBP', expected: 'Hypertension', category: 'abbreviation', description: 'High Blood Pressure' },
  { input: 'OD', expected: 'Once Daily', category: 'abbreviation' },
  { input: 'BD', expected: 'Twice Daily', category: 'abbreviation' },
  { input: 'BID', expected: 'Twice Daily', category: 'abbreviation' },
  { input: 'TDS', expected: 'Three Times Daily', category: 'abbreviation' },
  { input: 'TID', expected: 'Three Times Daily', category: 'abbreviation' },
  { input: 'QID', expected: 'Four Times Daily', category: 'abbreviation' },
  { input: 'PRN', expected: 'As Needed', category: 'abbreviation' },
  { input: 'SOS', expected: 'As Needed', category: 'abbreviation' },
  { input: 'STAT', expected: 'Immediately', category: 'abbreviation' },
  { input: 'AC', expected: 'Before Meals', category: 'abbreviation' },
  { input: 'PC', expected: 'After Meals', category: 'abbreviation' },
  { input: 'HS', expected: 'At Bedtime', category: 'abbreviation' },
  { input: 'Apollo', expected: 'Conjunctivitis', category: 'diagnosis', description: 'Nigerian slang for Conjunctivitis' },
  { input: 'Sugar Disease', expected: 'Diabetes', category: 'diagnosis', description: 'Common term for diabetes in Nigeria' },
  { input: 'PCV', expected: 'Packed Cell Volume', category: 'abbreviation' },
  { input: 'Hb', expected: 'Hemoglobin', category: 'abbreviation' },
  { input: 'HGB', expected: 'Hemoglobin', category: 'abbreviation' },
  { input: 'WBC', expected: 'White Blood Cell', category: 'abbreviation' },
  { input: 'RBC', expected: 'Red Blood Cell', category: 'abbreviation' },
  { input: 'PLT', expected: 'Platelets', category: 'abbreviation' },
  { input: 'FBC', expected: 'Full Blood Count', category: 'abbreviation' },
  { input: 'CBC', expected: 'Complete Blood Count', category: 'abbreviation' },
  { input: 'LFT', expected: 'Liver Function Test', category: 'abbreviation' },
  { input: 'RFT', expected: 'Renal Function Test', category: 'abbreviation' },
  { input: 'TFT', expected: 'Thyroid Function Test', category: 'abbreviation' },
  { input: 'FBS', expected: 'Fasting Blood Sugar', category: 'abbreviation' },
  { input: 'RBS', expected: 'Random Blood Sugar', category: 'abbreviation' },
  { input: 'Pt', expected: 'Patient', category: 'abbreviation' },
  { input: 'Hx', expected: 'History', category: 'abbreviation' },
  { input: 'Rx', expected: 'Prescription', category: 'abbreviation' },
  { input: 'Dx', expected: 'Diagnosis', category: 'abbreviation' },
];

// OCR Error Patterns (simulating handwriting recognition errors)
export const OCR_ERRORS: MedicalTestCase[] = [
  { input: 'Paracetamo1', expected: 'Paracetamol', category: 'medication', description: 'l read as 1' },
  { input: 'ParacetamoI', expected: 'Paracetamol', category: 'medication', description: 'l read as I' },
  { input: 'Ma1aria', expected: 'Malaria', category: 'diagnosis', description: 'l read as 1' },
  { input: 'H y p e r t e n s i o n', expected: 'Hypertension', category: 'diagnosis', description: 'Spacing errors from handwriting' },
  { input: 'Aml0dipine', expected: 'Amlodipine', category: 'medication', description: 'o read as 0' },
  { input: 'Artem3ther', expected: 'Artemether', category: 'medication', description: 'e read as 3' },
  { input: 'Metronidaz0le', expected: 'Metronidazole', category: 'medication', description: 'o read as 0' },
  { input: 'Metf0rmin', expected: 'Metformin', category: 'medication', description: 'o read as 0' },
  { input: 'Diabet3s', expected: 'Diabetes', category: 'diagnosis', description: 'e read as 3' },
  { input: 'As7hma', expected: 'Asthma', category: 'diagnosis', description: 't read as 7' },
  { input: 'Pneum0nia', expected: 'Pneumonia', category: 'diagnosis', description: 'o read as 0' },
  { input: 'Tubercu10sis', expected: 'Tuberculosis', category: 'diagnosis', description: 'l read as 1 and o as 0' },
  { input: 'Anem1a', expected: 'Anemia', category: 'diagnosis', description: 'i read as 1' },
  { input: 'Men1ngitis', expected: 'Meningitis', category: 'diagnosis', description: 'i read as 1' },
  { input: 'Mening1tis', expected: 'Meningitis', category: 'diagnosis', description: 'i read as 1' },
  { input: 'C1profloxacin', expected: 'Ciprofloxacin', category: 'medication', description: 'i read as 1' },
  { input: 'Am0xicillin', expected: 'Amoxicillin', category: 'medication', description: 'o read as 0' },
  { input: 'Lumefan7rine', expected: 'Lumefantrine', category: 'medication', description: 't read as 7' },
  { input: 'Ibu profen', expected: 'Ibuprofen', category: 'medication', description: 'Space inserted' },
  { input: 'Gastro enteritis', expected: 'Gastroenteritis', category: 'diagnosis', description: 'Space inserted in compound word' },
];

// Edge cases and tricky inputs
export const EDGE_CASES: MedicalTestCase[] = [
  { input: '', expected: '', category: 'medication', description: 'Empty string' },
  { input: 'A', expected: '', category: 'medication', description: 'Single character' },
  { input: 'XYZ123', expected: '', category: 'medication', description: 'Non-medical gibberish' },
  { input: 'Panadol', expected: 'Paracetamol', category: 'medication', description: 'Brand name' },
  { input: 'Tylenol', expected: 'Paracetamol', category: 'medication', description: 'Brand name' },
  { input: 'Flagyl', expected: 'Metronidazole', category: 'medication', description: 'Brand name' },
  { input: 'Augmentin', expected: 'Augmentin', category: 'medication', description: 'Brand name in dictionary' },
  { input: 'Daonil', expected: 'Glibenclamide', category: 'medication', description: 'Brand name' },
  { input: 'Glucophage', expected: 'Metformin', category: 'medication', description: 'Brand name' },
  { input: 'Norvasc', expected: 'Amlodipine', category: 'medication', description: 'Brand name' },
  { input: 'Zantac', expected: 'Ranitidine', category: 'medication', description: 'Brand name' },
  { input: 'Clarityne', expected: 'Loratadine', category: 'medication', description: 'Brand name' },
  { input: 'Piriton', expected: 'Chlorpheniramine', category: 'medication', description: 'Brand name' },
  { input: 'Coartem', expected: 'Artemether', category: 'medication', description: 'Combination brand' },
  { input: 'Bilharzia', expected: 'Schistosomiasis', category: 'diagnosis', description: 'Common name' },
];

// Combine all test cases for comprehensive testing
export const ALL_MEDICAL_TESTS: MedicalTestCase[] = [
  ...PERFECT_SPELLINGS,
  ...MISSPELLED_TERMS,
  ...NIGERIAN_VARIANTS,
  ...OCR_ERRORS,
  ...EDGE_CASES,
];

// Test metrics tracking
export interface TestMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  accuracy: number;
  averageConfidence: number;
}

export function calculateMetrics(results: { passed: boolean; confidence: number }[]): TestMetrics {
  const totalTests = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = totalTests - passed;
  const accuracy = (passed / totalTests) * 100;
  const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;

  return {
    totalTests,
    passed,
    failed,
    accuracy,
    averageConfidence,
  };
}
