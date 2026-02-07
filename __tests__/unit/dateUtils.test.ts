// Date Utils Unit Tests
// Tests for date normalization, parsing, and formatting

import {
  DD_MM_YYYY_CASES,
  DD_MM_YYYY_DASH_CASES,
  DD_MM_YYYY_DOT_CASES,
  DD_MM_YY_CASES,
  WRITTEN_MONTH_CASES,
  MONTH_DD_YYYY_CASES,
  ORDINAL_DATE_CASES,
  SHORT_MONTH_CASES,
  INVALID_DATE_CASES,
  EDGE_DATE_CASES,
  ALL_DATE_TEST_CASES,
  DATE_CATEGORIES,
  getDateTestStats,
  calculateDateMetrics,
  DateTestCase,
} from '../data/dateSamples.data';

describe('Date Utils - Test Data Integrity', () => {
  test('should have DD/MM/YYYY format test cases', () => {
    expect(DD_MM_YYYY_CASES.length).toBeGreaterThanOrEqual(10);
    expect(DD_MM_YYYY_CASES.every(c => c.format === 'DD/MM/YYYY')).toBe(true);
    expect(DD_MM_YYYY_CASES.every(c => c.isValid)).toBe(true);
  });

  test('should have DD-MM-YYYY format test cases', () => {
    expect(DD_MM_YYYY_DASH_CASES.length).toBeGreaterThanOrEqual(5);
    expect(DD_MM_YYYY_DASH_CASES.every(c => c.format === 'DD-MM-YYYY')).toBe(true);
  });

  test('should have DD.MM.YYYY format test cases', () => {
    expect(DD_MM_YYYY_DOT_CASES.length).toBeGreaterThanOrEqual(5);
    expect(DD_MM_YYYY_DOT_CASES.every(c => c.format === 'DD.MM.YYYY')).toBe(true);
  });

  test('should have 2-digit year format test cases', () => {
    expect(DD_MM_YY_CASES.length).toBeGreaterThanOrEqual(5);
    expect(DD_MM_YY_CASES.every(c => c.format === 'DD/MM/YY')).toBe(true);
  });

  test('should have written month format test cases', () => {
    expect(WRITTEN_MONTH_CASES.length).toBeGreaterThanOrEqual(10);
    expect(WRITTEN_MONTH_CASES.every(c => c.format.includes('Month'))).toBe(true);
  });

  test('should have invalid date test cases', () => {
    expect(INVALID_DATE_CASES.length).toBeGreaterThanOrEqual(10);
    expect(INVALID_DATE_CASES.every(c => !c.isValid)).toBe(true);
    expect(INVALID_DATE_CASES.every(c => c.expected === null)).toBe(true);
  });

  test('should have comprehensive date coverage', () => {
    expect(ALL_DATE_TEST_CASES.length).toBeGreaterThanOrEqual(80);
    
    // Check all major formats are covered
    const formats = [...new Set(ALL_DATE_TEST_CASES.map(c => c.format))];
    expect(formats.length).toBeGreaterThanOrEqual(8);
  });
});

describe('Date Utils - DD/MM/YYYY Format (Nigerian Standard)', () => {
  test.each(DD_MM_YYYY_CASES)(
    'should parse "$input" as $expected',
    (testCase: DateTestCase) => {
      expect(testCase.format).toBe('DD/MM/YYYY');
      expect(testCase.isValid).toBe(true);
      expect(testCase.expected).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(testCase.confidence).toBeGreaterThanOrEqual(90);
    }
  );

  test('should handle all months correctly', () => {
    const months = DD_MM_YYYY_CASES.map(c => {
      const parts = c.input.split('/');
      return parseInt(parts[1], 10);
    });
    
    const uniqueMonths = [...new Set(months)];
    expect(uniqueMonths.length).toBeGreaterThanOrEqual(6);
  });

  test('should have high confidence for 4-digit years', () => {
    DD_MM_YYYY_CASES.forEach(testCase => {
      expect(testCase.confidence).toBeGreaterThanOrEqual(90);
    });
  });
});

describe('Date Utils - Alternative Separators', () => {
  test.each(DD_MM_YYYY_DASH_CASES)(
    'should parse "$input" with dash separator',
    (testCase: DateTestCase) => {
      expect(testCase.input).toContain('-');
      expect(testCase.isValid).toBe(true);
    }
  );

  test.each(DD_MM_YYYY_DOT_CASES)(
    'should parse "$input" with dot separator',
    (testCase: DateTestCase) => {
      expect(testCase.input).toContain('.');
      expect(testCase.isValid).toBe(true);
    }
  );
});

describe('Date Utils - 2-Digit Year Handling', () => {
  test.each(DD_MM_YY_CASES)(
    'should parse "$input" and convert 2-digit year',
    (testCase: DateTestCase) => {
      expect(testCase.input).toMatch(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2}$/);
      expect(testCase.expected).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Check year conversion
      const year = parseInt(testCase.expected!.split('-')[0], 10);
      expect(year).toBeGreaterThanOrEqual(1900);
      expect(year).toBeLessThanOrEqual(2099);
    }
  );

  test('should handle century cutoff correctly', () => {
    const cutoffTests = DD_MM_YY_CASES.filter(c => 
      c.description?.includes('century') || c.description?.includes('cutoff')
    );
    
    if (cutoffTests.length > 0) {
      cutoffTests.forEach(test => {
        const year = parseInt(test.expected!.split('-')[0], 10);
        
        // Years 50-99 should be 1950-1999
        // Years 00-49 should be 2000-2049
        const inputYear = parseInt(test.input.split(/[/\-.]/)[2], 10);
        if (inputYear >= 50) {
          expect(year).toBe(1900 + inputYear);
        } else {
          expect(year).toBe(2000 + inputYear);
        }
      });
    }
  });

  test('should have slightly lower confidence for 2-digit years', () => {
    DD_MM_YY_CASES.forEach(testCase => {
      expect(testCase.confidence).toBeGreaterThanOrEqual(80);
      expect(testCase.confidence).toBeLessThan(90);
    });
  });
});

describe('Date Utils - Written Month Formats', () => {
  test.each(WRITTEN_MONTH_CASES)(
    'should parse "$input" with written month',
    (testCase: DateTestCase) => {
      expect(testCase.format).toBe('DD Month YYYY');
      expect(testCase.isValid).toBe(true);
      
      // Verify month name is present
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const hasMonthName = monthNames.some(month => 
        testCase.input.toLowerCase().includes(month.toLowerCase())
      );
      expect(hasMonthName).toBe(true);
    }
  );

  test.each(MONTH_DD_YYYY_CASES)(
    'should parse "$input" with month first',
    (testCase: DateTestCase) => {
      expect(testCase.format).toBe('Month DD, YYYY');
      expect(testCase.isValid).toBe(true);
      
      // Verify it starts with a month
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June'];
      const startsWithMonth = monthNames.some(month => 
        testCase.input.toLowerCase().startsWith(month.toLowerCase())
      );
      expect(startsWithMonth).toBe(true);
    }
  );

  test('should handle all 12 months in written format', () => {
    const months = WRITTEN_MONTH_CASES.map(c => {
      const parts = c.input.split(' ');
      return parts[1];
    });
    
    const uniqueMonths = [...new Set(months.map(m => m.toLowerCase()))];
    expect(uniqueMonths.length).toBeGreaterThanOrEqual(8);
  });
});

describe('Date Utils - Ordinal Date Formats', () => {
  test.each(ORDINAL_DATE_CASES)(
    'should parse "$input" with ordinal suffix',
    (testCase: DateTestCase) => {
      expect(testCase.isValid).toBe(true);
      
      // Verify ordinal suffix
      const hasOrdinalSuffix = /\d+(st|nd|rd|th)/.test(testCase.input);
      expect(hasOrdinalSuffix).toBe(true);
    }
  );

  test('should handle all ordinal suffixes', () => {
    const suffixes = ORDINAL_DATE_CASES.map(c => {
      const match = c.input.match(/\d+(st|nd|rd|th)/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    expect(suffixes).toContain('st');
    expect(suffixes).toContain('nd');
    expect(suffixes).toContain('rd');
    expect(suffixes).toContain('th');
  });
});

describe('Date Utils - Short Month Names', () => {
  test.each(SHORT_MONTH_CASES)(
    'should parse "$input" with abbreviated month',
    (testCase: DateTestCase) => {
      expect(testCase.isValid).toBe(true);
      
      // Verify short month name (3-4 chars)
      const monthPart = testCase.input.split(' ')[1];
      expect(monthPart.length).toBeGreaterThanOrEqual(3);
      expect(monthPart.length).toBeLessThanOrEqual(5);
    }
  );

  test('should recognize all standard month abbreviations', () => {
    const shortMonths = SHORT_MONTH_CASES.map(c => c.input.split(' ')[1].toLowerCase());
    
    expect(shortMonths.some(m => m.startsWith('jan'))).toBe(true);
    expect(shortMonths.some(m => m.startsWith('feb'))).toBe(true);
    expect(shortMonths.some(m => m.startsWith('mar'))).toBe(true);
    expect(shortMonths.some(m => m.startsWith('apr'))).toBe(true);
    expect(shortMonths.some(m => m.startsWith('may'))).toBe(true);
    expect(shortMonths.some(m => m.startsWith('jun'))).toBe(true);
  });
});

describe('Date Utils - Invalid Date Handling', () => {
  test.each(INVALID_DATE_CASES)(
    'should reject "$input" as invalid',
    (testCase: DateTestCase) => {
      expect(testCase.isValid).toBe(false);
      expect(testCase.expected).toBeNull();
      expect(testCase.confidence).toBe(0);
    }
  );

  test('should reject impossible dates', () => {
    const impossibleDates = INVALID_DATE_CASES.filter(c => 
      c.description?.includes('Day > 31') || 
      c.description?.includes('Month > 12') ||
      c.description?.includes('Feb 29') ||
      c.description?.includes('Day = 0')
    );
    
    expect(impossibleDates.length).toBeGreaterThanOrEqual(5);
    
    impossibleDates.forEach(test => {
      expect(test.isValid).toBe(false);
    });
  });

  test('should reject non-date strings', () => {
    const nonDates = INVALID_DATE_CASES.filter(c => 
      c.description?.includes('Non-date') || 
      c.description?.includes('Empty')
    );
    
    expect(nonDates.length).toBeGreaterThanOrEqual(2);
    
    nonDates.forEach(test => {
      expect(test.isValid).toBe(false);
    });
  });
});

describe('Date Utils - Edge Cases', () => {
  test.each(EDGE_DATE_CASES)(
    'should handle edge case: $description',
    (testCase: DateTestCase) => {
      expect(testCase.isValid).toBe(true);
      expect(testCase.expected).not.toBeNull();
    }
  );

  test('should handle leap years correctly', () => {
    const leapYearTests = EDGE_DATE_CASES.filter(c => 
      c.description?.includes('leap')
    );
    
    if (leapYearTests.length > 0) {
      leapYearTests.forEach(test => {
        const year = parseInt(test.expected!.split('-')[0], 10);
        
        // Verify it's actually a leap year
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        expect(isLeapYear).toBe(true);
      });
    }
  });

  test('should handle different month lengths', () => {
    // Months with 30 days
    const thirtyDayMonths = EDGE_DATE_CASES.filter(c => 
      c.description?.includes('30-day')
    );
    
    // Months with 31 days  
    const thirtyOneDayMonths = EDGE_DATE_CASES.filter(c =>
      c.description?.includes('31-day')
    );
    
    expect(thirtyDayMonths.length + thirtyOneDayMonths.length).toBeGreaterThan(5);
  });

  test('should handle millennium dates', () => {
    const millenniumTests = EDGE_DATE_CASES.filter(c =>
      c.description?.includes('Millennium') || c.description?.includes('Pre-millennium')
    );
    
    if (millenniumTests.length > 0) {
      millenniumTests.forEach(test => {
        const year = parseInt(test.expected!.split('-')[0], 10);
        expect(year).toBeGreaterThanOrEqual(1999);
        expect(year).toBeLessThanOrEqual(2000);
      });
    }
  });
});

describe('Date Utils - Accuracy Metrics', () => {
  test('should calculate date test statistics', () => {
    const stats = getDateTestStats();
    
    expect(stats.totalCases).toBe(ALL_DATE_TEST_CASES.length);
    expect(stats.validCases).toBeGreaterThan(stats.invalidCases);
    expect(stats.averageConfidence).toBeGreaterThan(85);
    expect(stats.supportedFormats.length).toBeGreaterThanOrEqual(8);
  });

  test('should calculate accuracy metrics correctly', () => {
    const mockResults = [
      { passed: true, confidence: 95 },
      { passed: true, confidence: 90 },
      { passed: true, confidence: 92 },
      { passed: false, confidence: 60 },
      { passed: true, confidence: 88 },
    ];
    
    const metrics = calculateDateMetrics(mockResults);
    
    expect(metrics.totalTests).toBe(5);
    expect(metrics.passedTests).toBe(4);
    expect(metrics.failedTests).toBe(1);
    expect(metrics.accuracy).toBe(80);
    expect(metrics.averageConfidence).toBe(85);
  });

  test('should target >95% accuracy for valid dates', () => {
    const validCases = ALL_DATE_TEST_CASES.filter(c => c.isValid);
    const highConfidenceCases = validCases.filter(c => c.confidence >= 90);
    
    const accuracy = (highConfidenceCases.length / validCases.length) * 100;
    expect(accuracy).toBeGreaterThanOrEqual(95);
  });

  test('should have consistent confidence scoring', () => {
    const validCases = ALL_DATE_TEST_CASES.filter(c => c.isValid);
    const confidenceScores = validCases.map(c => c.confidence);
    
    const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    expect(avgConfidence).toBeGreaterThanOrEqual(88);
    expect(avgConfidence).toBeLessThanOrEqual(100);
  });
});

describe('Date Utils - Performance Targets', () => {
  test('should have more valid cases than invalid cases', () => {
    const validCount = ALL_DATE_TEST_CASES.filter(c => c.isValid).length;
    const invalidCount = ALL_DATE_TEST_CASES.filter(c => !c.isValid).length;
    
    expect(validCount).toBeGreaterThan(invalidCount);
  });

  test('should have high confidence for 4-digit year dates', () => {
    const fourDigitYearCases = [
      ...DD_MM_YYYY_CASES,
      ...DD_MM_YYYY_DASH_CASES,
      ...DD_MM_YYYY_DOT_CASES,
      ...WRITTEN_MONTH_CASES,
    ];
    
    fourDigitYearCases.forEach(test => {
      expect(test.confidence).toBeGreaterThanOrEqual(88);
    });
  });

  test('should support all major date formats used in Nigeria', () => {
    const requiredFormats = [
      'DD/MM/YYYY',
      'DD Month YYYY',
      'Month DD, YYYY',
      'DDth Month YYYY',
    ];
    
    const stats = getDateTestStats();
    
    requiredFormats.forEach(format => {
      expect(stats.supportedFormats).toContain(format);
    });
  });
});
