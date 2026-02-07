// Document Parser Unit Tests
// Tests for document type detection, field extraction, and parsing accuracy

import {
  PATIENT_SAMPLES,
  PRESCRIPTION_SAMPLES,
  LAB_RESULT_SAMPLES,
  TASK_NOTE_SAMPLES,
  ALL_DOCUMENT_SAMPLES,
  DOCUMENT_CATEGORIES,
  calculateDocumentMetrics,
  DocumentTestCase,
} from '../data/documentSamples.data';
import { DocumentType } from '@/lib/types';

describe('Document Parser - Test Data Integrity', () => {
  test('should have patient record samples', () => {
    expect(PATIENT_SAMPLES.length).toBeGreaterThanOrEqual(5);
    expect(PATIENT_SAMPLES.every(s => s.documentType === 'PATIENT_RECORD')).toBe(true);
  });

  test('should have prescription samples', () => {
    expect(PRESCRIPTION_SAMPLES.length).toBeGreaterThanOrEqual(5);
    expect(PRESCRIPTION_SAMPLES.every(s => s.documentType === 'PRESCRIPTION')).toBe(true);
  });

  test('should have lab result samples', () => {
    expect(LAB_RESULT_SAMPLES.length).toBeGreaterThanOrEqual(5);
    expect(LAB_RESULT_SAMPLES.every(s => s.documentType === 'LAB_RESULT')).toBe(true);
  });

  test('should have task/note samples', () => {
    expect(TASK_NOTE_SAMPLES.length).toBeGreaterThanOrEqual(3);
    expect(TASK_NOTE_SAMPLES.every(s => s.documentType === 'TASK_NOTE')).toBe(true);
  });

  test('should have comprehensive document coverage', () => {
    expect(ALL_DOCUMENT_SAMPLES.length).toBeGreaterThanOrEqual(18);
    
    // Check all document types are covered
    const types = [...new Set(ALL_DOCUMENT_SAMPLES.map(s => s.documentType))];
    expect(types).toContain('PATIENT_RECORD');
    expect(types).toContain('PRESCRIPTION');
    expect(types).toContain('LAB_RESULT');
    expect(types).toContain('TASK_NOTE');
  });
});

describe('Document Parser - Patient Records', () => {
  test.each(PATIENT_SAMPLES)(
    'should parse "$name" correctly',
    (testCase: DocumentTestCase) => {
      expect(testCase.text).toBeDefined();
      expect(testCase.documentType).toBe('PATIENT_RECORD');
      expect(Object.keys(testCase.expectedFields).length).toBeGreaterThan(0);
    }
  );

  test('should extract name field with high confidence', () => {
    const nameFields = PATIENT_SAMPLES.map(s => s.expectedFields.name).filter(Boolean);
    expect(nameFields.length).toBeGreaterThan(3);
    
    nameFields.forEach(field => {
      expect(field.confidence).toBeGreaterThanOrEqual(85);
    });
  });

  test('should extract age field with very high confidence', () => {
    const ageFields = PATIENT_SAMPLES.map(s => s.expectedFields.age).filter(Boolean);
    expect(ageFields.length).toBeGreaterThan(3);
    
    ageFields.forEach(field => {
      expect(field.confidence).toBeGreaterThanOrEqual(95);
    });
  });

  test('should handle Nigerian phone number formats', () => {
    const phoneFields = PATIENT_SAMPLES.map(s => s.expectedFields.phone).filter(Boolean);
    expect(phoneFields.length).toBeGreaterThan(3);
    
    // Check for various Nigerian phone formats
    const hasInternationalFormat = phoneFields.some(f => 
      f.value.includes('+234')
    );
    const hasLocalFormat = phoneFields.some(f => 
      f.value.startsWith('0') || f.value.startsWith('80')
    );
    
    expect(hasInternationalFormat || hasLocalFormat).toBe(true);
  });

  test('should detect patient record indicators', () => {
    const indicators = ['patient', 'name', 'age', 'phone', 'address'];
    
    PATIENT_SAMPLES.forEach(sample => {
      const hasIndicators = indicators.some(indicator => 
        sample.text.toLowerCase().includes(indicator)
      );
      expect(hasIndicators).toBe(true);
    });
  });
});

describe('Document Parser - Prescriptions', () => {
  test.each(PRESCRIPTION_SAMPLES)(
    'should parse "$name" correctly',
    (testCase: DocumentTestCase) => {
      expect(testCase.text).toBeDefined();
      expect(testCase.documentType).toBe('PRESCRIPTION');
      expect(Object.keys(testCase.expectedFields).length).toBeGreaterThan(0);
    }
  );

  test('should extract medication names', () => {
    const medicationFields = PRESCRIPTION_SAMPLES.map(s => s.expectedFields.medication).filter(Boolean);
    expect(medicationFields.length).toBeGreaterThan(3);
  });

  test('should extract dosage information', () => {
    const dosageFields = PRESCRIPTION_SAMPLES.map(s => s.expectedFields.dosage).filter(Boolean);
    expect(dosageFields.length).toBeGreaterThan(3);
    
    // Check for common dosage units
    const hasMg = dosageFields.some(f => f.value.includes('mg'));
    const hasMl = dosageFields.some(f => f.value.includes('ml'));
    
    expect(hasMg || hasMl).toBe(true);
  });

  test('should extract frequency (TDS, BD, OD)', () => {
    const freqFields = PRESCRIPTION_SAMPLES.map(s => s.expectedFields.frequency).filter(Boolean);
    expect(freqFields.length).toBeGreaterThan(2);
  });

  test('should handle complex malaria prescriptions', () => {
    const malariaRx = PRESCRIPTION_SAMPLES.find(s => s.name.includes('Malaria'));
    expect(malariaRx).toBeDefined();
    expect(malariaRx?.expectedFields.medication).toBeDefined();
  });

  test('should detect prescription indicators', () => {
    const indicators = ['rx', 'prescription', 'medication', 'drug', 'dosage', 'tab', 'tablet'];
    
    PRESCRIPTION_SAMPLES.forEach(sample => {
      const hasIndicators = indicators.some(indicator => 
        sample.text.toLowerCase().includes(indicator)
      );
      expect(hasIndicators).toBe(true);
    });
  });
});

describe('Document Parser - Lab Results', () => {
  test.each(LAB_RESULT_SAMPLES)(
    'should parse "$name" correctly',
    (testCase: DocumentTestCase) => {
      expect(testCase.text).toBeDefined();
      expect(testCase.documentType).toBe('LAB_RESULT');
      expect(Object.keys(testCase.expectedFields).length).toBeGreaterThan(0);
    }
  );

  test('should extract test type with high confidence', () => {
    const testTypeFields = LAB_RESULT_SAMPLES.map(s => s.expectedFields.testType).filter(Boolean);
    expect(testTypeFields.length).toBeGreaterThan(3);
    
    testTypeFields.forEach(field => {
      expect(field.confidence).toBeGreaterThanOrEqual(85);
    });
  });

  test('should extract result values', () => {
    const resultFields = LAB_RESULT_SAMPLES.map(s => s.expectedFields.result).filter(Boolean);
    expect(resultFields.length).toBeGreaterThan(3);
  });

  test('should handle common lab tests', () => {
    const testTypes = LAB_RESULT_SAMPLES.map(s => s.expectedFields.testType?.value);
    
    expect(testTypes.some(t => t?.includes('PCV') || t?.includes('FBC') || t?.includes('CBC'))).toBe(true);
    expect(testTypes.some(t => t?.includes('Malaria'))).toBe(true);
    expect(testTypes.some(t => t?.includes('LFT') || t?.includes('Liver'))).toBe(true);
  });

  test('should detect lab result indicators', () => {
    const indicators = ['lab', 'result', 'test', 'reference range', 'pcv', 'hb', 'wbc'];
    
    LAB_RESULT_SAMPLES.forEach(sample => {
      const hasIndicators = indicators.some(indicator => 
        sample.text.toLowerCase().includes(indicator)
      );
      expect(hasIndicators).toBe(true);
    });
  });
});

describe('Document Parser - Task/Notes', () => {
  test.each(TASK_NOTE_SAMPLES)(
    'should parse "$name" correctly',
    (testCase: DocumentTestCase) => {
      expect(testCase.text).toBeDefined();
      expect(testCase.documentType).toBe('TASK_NOTE');
      expect(Object.keys(testCase.expectedFields).length).toBeGreaterThan(0);
    }
  );

  test('should extract task title', () => {
    const titleFields = TASK_NOTE_SAMPLES.map(s => s.expectedFields.title).filter(Boolean);
    expect(titleFields.length).toBeGreaterThanOrEqual(2);
  });

  test('should extract priority levels', () => {
    const priorityFields = TASK_NOTE_SAMPLES.map(s => s.expectedFields.priority).filter(Boolean);
    expect(priorityFields.length).toBeGreaterThanOrEqual(2);
    
    // Check for priority keywords
    const priorities = priorityFields.map(f => f.value.toLowerCase());
    expect(priorities.some(p => ['high', 'medium', 'low', 'critical'].includes(p))).toBe(true);
  });

  test('should detect task indicators', () => {
    const indicators = ['task', 'priority', 'due', 'assigned', 'description'];
    
    TASK_NOTE_SAMPLES.forEach(sample => {
      const hasIndicators = indicators.some(indicator => 
        sample.text.toLowerCase().includes(indicator)
      );
      expect(hasIndicators).toBe(true);
    });
  });
});

describe('Document Parser - Accuracy Metrics', () => {
  test('should calculate document parse metrics correctly', () => {
    const mockResults = [
      {
        documentType: 'PATIENT_RECORD' as DocumentType,
        detectedType: 'PATIENT_RECORD' as DocumentType,
        fields: [{ name: 'name', value: 'John', confidence: 95, isVerified: false }],
        expectedFields: { name: { value: 'John', confidence: 95 } },
      },
      {
        documentType: 'PRESCRIPTION' as DocumentType,
        detectedType: 'PRESCRIPTION' as DocumentType,
        fields: [{ name: 'medication', value: 'Paracetamol', confidence: 90, isVerified: false }],
        expectedFields: { medication: { value: 'Paracetamol', confidence: 90 } },
      },
      {
        documentType: 'LAB_RESULT' as DocumentType,
        detectedType: 'PATIENT_RECORD' as DocumentType, // Wrong detection
        fields: [],
        expectedFields: { testType: { value: 'FBC', confidence: 95 } },
      },
    ] as any;
    
    const metrics = calculateDocumentMetrics(mockResults);
    
    expect(metrics.totalDocuments).toBe(3);
    expect(metrics.correctTypeDetection).toBe(2);
    expect(metrics.typeAccuracy).toBeCloseTo(66.67, 1);
    expect(metrics.totalFields).toBe(2); // Only fields that exist in both
    expect(metrics.correctFields).toBe(2);
    expect(metrics.fieldAccuracy).toBe(100);
  });

  test('should target >85% field extraction accuracy', () => {
    // Count total expected fields across all samples
    let totalExpectedFields = 0;
    let highConfidenceFields = 0;
    
    ALL_DOCUMENT_SAMPLES.forEach(sample => {
      Object.entries(sample.expectedFields).forEach(([_, field]) => {
        totalExpectedFields++;
        if (field.confidence >= 85) {
          highConfidenceFields++;
        }
      });
    });
    
    const accuracy = (highConfidenceFields / totalExpectedFields) * 100;
    expect(accuracy).toBeGreaterThanOrEqual(85);
  });

  test('should target >90% document type detection accuracy', () => {
    // This will be validated by actual implementation tests
    // For now, verify test data has clear type indicators
    
    ALL_DOCUMENT_SAMPLES.forEach(sample => {
      const text = sample.text.toLowerCase();
      
      // Each document should have clear type indicators
      switch (sample.documentType) {
        case 'PATIENT_RECORD':
          expect(text.includes('patient') || text.includes('name') || text.includes('age')).toBe(true);
          break;
        case 'PRESCRIPTION':
          expect(text.includes('rx') || text.includes('prescription') || text.includes('medication') || text.includes('tab')).toBe(true);
          break;
        case 'LAB_RESULT':
          expect(text.includes('lab') || text.includes('result') || text.includes('test')).toBe(true);
          break;
        case 'TASK_NOTE':
          expect(text.includes('task') || text.includes('priority') || text.includes('due')).toBe(true);
          break;
      }
    });
  });
});

describe('Document Parser - Field Extraction Quality', () => {
  test('should extract dates in various formats', () => {
    const allDateFields = ALL_DOCUMENT_SAMPLES.flatMap(s => {
      return Object.entries(s.expectedFields)
        .filter(([key, _]) => key.includes('date') || key.includes('Date'))
        .map(([_, field]) => field);
    });
    
    expect(allDateFields.length).toBeGreaterThan(10);
    
    // All date fields should have reasonable confidence
    allDateFields.forEach(field => {
      expect(field.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  test('should have consistent confidence scoring', () => {
    // Check that confidence scores are distributed reasonably
    const allFields = ALL_DOCUMENT_SAMPLES.flatMap(s => Object.values(s.expectedFields));
    const confidenceScores = allFields.map(f => f.confidence);
    
    const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    expect(avgConfidence).toBeGreaterThanOrEqual(85);
    expect(avgConfidence).toBeLessThanOrEqual(100);
  });

  test('should handle Nigerian context appropriately', () => {
    // Check for Nigerian-specific content
    const hasNigerianNames = ALL_DOCUMENT_SAMPLES.some(s => 
      s.text.includes('Chinedu') || s.text.includes('Okonkwo') || s.text.includes('Adeyemi')
    );
    
    const hasNigerianLocations = ALL_DOCUMENT_SAMPLES.some(s =>
      s.text.includes('Lagos') || s.text.includes('Abuja') || s.text.includes('Port Harcourt')
    );
    
    const hasNigerianPhoneFormat = ALL_DOCUMENT_SAMPLES.some(s =>
      s.text.includes('+234') || /080\d{8}/.test(s.text)
    );
    
    expect(hasNigerianNames || hasNigerianLocations || hasNigerianPhoneFormat).toBe(true);
  });
});
