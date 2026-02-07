// Synthetic Date Test Data
// Various date formats commonly found in Nigerian medical documents

export interface DateTestCase {
  input: string;
  expected: string | null; // ISO date string (YYYY-MM-DD) or null if invalid
  format: string;
  confidence: number;
  description?: string;
  isValid: boolean;
}

// DD/MM/YYYY Format - Most common in Nigeria
export const DD_MM_YYYY_CASES: DateTestCase[] = [
  { input: '12/05/2024', expected: '2024-05-12', format: 'DD/MM/YYYY', confidence: 95, isValid: true },
  { input: '01/01/2024', expected: '2024-01-01', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'New Year' },
  { input: '31/12/2024', expected: '2024-12-31', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'End of year' },
  { input: '29/02/2024', expected: '2024-02-29', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'Leap year valid' },
  { input: '15/06/2024', expected: '2024-06-15', format: 'DD/MM/YYYY', confidence: 95, isValid: true },
  { input: '25/12/2024', expected: '2024-12-25', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'Christmas' },
  { input: '05/03/2024', expected: '2024-03-05', format: 'DD/MM/YYYY', confidence: 95, isValid: true },
  { input: '10/11/2024', expected: '2024-11-10', format: 'DD/MM/YYYY', confidence: 95, isValid: true },
  { input: '20/08/2024', expected: '2024-08-20', format: 'DD/MM/YYYY', confidence: 95, isValid: true },
  { input: '03/09/2024', expected: '2024-09-03', format: 'DD/MM/YYYY', confidence: 95, isValid: true },
];

// DD-MM-YYYY Format
export const DD_MM_YYYY_DASH_CASES: DateTestCase[] = [
  { input: '12-05-2024', expected: '2024-05-12', format: 'DD-MM-YYYY', confidence: 95, isValid: true },
  { input: '01-01-2024', expected: '2024-01-01', format: 'DD-MM-YYYY', confidence: 95, isValid: true },
  { input: '31-12-2024', expected: '2024-12-31', format: 'DD-MM-YYYY', confidence: 95, isValid: true },
  { input: '15-03-2024', expected: '2024-03-15', format: 'DD-MM-YYYY', confidence: 95, isValid: true },
  { input: '20-07-2024', expected: '2024-07-20', format: 'DD-MM-YYYY', confidence: 95, isValid: true },
];

// DD.MM.YYYY Format
export const DD_MM_YYYY_DOT_CASES: DateTestCase[] = [
  { input: '12.05.2024', expected: '2024-05-12', format: 'DD.MM.YYYY', confidence: 95, isValid: true },
  { input: '01.01.2024', expected: '2024-01-01', format: 'DD.MM.YYYY', confidence: 95, isValid: true },
  { input: '31.12.2024', expected: '2024-12-31', format: 'DD.MM.YYYY', confidence: 95, isValid: true },
  { input: '25.03.2024', expected: '2024-03-25', format: 'DD.MM.YYYY', confidence: 95, isValid: true },
  { input: '10.08.2024', expected: '2024-08-10', format: 'DD.MM.YYYY', confidence: 95, isValid: true },
];

// DD/MM/YY Format (2-digit year)
export const DD_MM_YY_CASES: DateTestCase[] = [
  { input: '12/05/24', expected: '2024-05-12', format: 'DD/MM/YY', confidence: 85, isValid: true },
  { input: '01/01/24', expected: '2024-01-01', format: 'DD/MM/YY', confidence: 85, isValid: true },
  { input: '31/12/24', expected: '2024-12-31', format: 'DD/MM/YY', confidence: 85, isValid: true },
  { input: '15/06/99', expected: '1999-06-15', format: 'DD/MM/YY', confidence: 85, isValid: true, description: '20th century date' },
  { input: '20/03/50', expected: '1950-03-20', format: 'DD/MM/YY', confidence: 80, isValid: true, description: 'Mid-century cutoff' },
];

// Written Month Formats
export const WRITTEN_MONTH_CASES: DateTestCase[] = [
  { input: '12 May 2024', expected: '2024-05-12', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '1 January 2024', expected: '2024-01-01', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '31 December 2024', expected: '2024-12-31', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '15 March 2024', expected: '2024-03-15', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '20 July 2024', expected: '2024-07-20', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '10 February 2024', expected: '2024-02-10', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '25 August 2024', expected: '2024-08-25', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '5 September 2024', expected: '2024-09-05', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '18 October 2024', expected: '2024-10-18', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '22 November 2024', expected: '2024-11-22', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '8 April 2024', expected: '2024-04-08', format: 'DD Month YYYY', confidence: 90, isValid: true },
  { input: '30 June 2024', expected: '2024-06-30', format: 'DD Month YYYY', confidence: 90, isValid: true },
];

// Month DD, YYYY Format
export const MONTH_DD_YYYY_CASES: DateTestCase[] = [
  { input: 'May 12, 2024', expected: '2024-05-12', format: 'Month DD, YYYY', confidence: 90, isValid: true },
  { input: 'January 1, 2024', expected: '2024-01-01', format: 'Month DD, YYYY', confidence: 90, isValid: true },
  { input: 'December 31, 2024', expected: '2024-12-31', format: 'Month DD, YYYY', confidence: 90, isValid: true },
  { input: 'March 15, 2024', expected: '2024-03-15', format: 'Month DD, YYYY', confidence: 90, isValid: true },
  { input: 'July 20, 2024', expected: '2024-07-20', format: 'Month DD, YYYY', confidence: 90, isValid: true },
  { input: 'February 29, 2024', expected: '2024-02-29', format: 'Month DD, YYYY', confidence: 90, isValid: true, description: 'Leap year' },
];

// Ordinal Date Formats (e.g., 12th May 2024)
export const ORDINAL_DATE_CASES: DateTestCase[] = [
  { input: '12th May 2024', expected: '2024-05-12', format: 'DDth Month YYYY', confidence: 88, isValid: true },
  { input: '1st January 2024', expected: '2024-01-01', format: 'DDst Month YYYY', confidence: 88, isValid: true },
  { input: '2nd February 2024', expected: '2024-02-02', format: 'DDnd Month YYYY', confidence: 88, isValid: true },
  { input: '3rd March 2024', expected: '2024-03-03', format: 'DDrd Month YYYY', confidence: 88, isValid: true },
  { input: '31st December 2024', expected: '2024-12-31', format: 'DDst Month YYYY', confidence: 88, isValid: true },
  { input: '21st June 2024', expected: '2024-06-21', format: 'DDst Month YYYY', confidence: 88, isValid: true },
  { input: '22nd July 2024', expected: '2024-07-22', format: 'DDnd Month YYYY', confidence: 88, isValid: true },
  { input: '23rd August 2024', expected: '2024-08-23', format: 'DDrd Month YYYY', confidence: 88, isValid: true },
];

// Short Month Names
export const SHORT_MONTH_CASES: DateTestCase[] = [
  { input: '12 Jan 2024', expected: '2024-01-12', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '15 Feb 2024', expected: '2024-02-15', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '20 Mar 2024', expected: '2024-03-20', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '10 Apr 2024', expected: '2024-04-10', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '5 Jun 2024', expected: '2024-06-05', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '25 Jul 2024', expected: '2024-07-25', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '1 Aug 2024', expected: '2024-08-01', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '18 Sep 2024', expected: '2024-09-18', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '30 Oct 2024', expected: '2024-10-30', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '12 Nov 2024', expected: '2024-11-12', format: 'DD Mon YYYY', confidence: 88, isValid: true },
  { input: '24 Dec 2024', expected: '2024-12-24', format: 'DD Mon YYYY', confidence: 88, isValid: true },
];

// Invalid Dates (should return null)
export const INVALID_DATE_CASES: DateTestCase[] = [
  { input: '32/01/2024', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Day > 31' },
  { input: '15/13/2024', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Month > 12' },
  { input: '29/02/2023', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Feb 29 in non-leap year' },
  { input: '00/05/2024', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Day = 0' },
  { input: '15/00/2024', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Month = 0' },
  { input: '', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Empty string' },
  { input: 'abc', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Non-date text' },
  { input: '2024-13-01', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Invalid month in ISO format' },
  { input: '2024-01-32', expected: null, format: 'invalid', confidence: 0, isValid: false, description: 'Invalid day in ISO format' },
  { input: '15/05', expected: null, format: 'incomplete', confidence: 0, isValid: false, description: 'Missing year' },
];

// Edge Cases
export const EDGE_DATE_CASES: DateTestCase[] = [
  { input: '01/01/2000', expected: '2000-01-01', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'Millennium' },
  { input: '31/12/1999', expected: '1999-12-31', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'Pre-millennium' },
  { input: '28/02/2023', expected: '2023-02-28', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'Non-leap year Feb' },
  { input: '30/04/2024', expected: '2024-04-30', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: '30-day month' },
  { input: '31/05/2024', expected: '2024-05-31', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: '31-day month' },
  { input: '30/06/2024', expected: '2024-06-30', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'June 30' },
  { input: '31/07/2024', expected: '2024-07-31', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'July 31' },
  { input: '31/08/2024', expected: '2024-08-31', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'August 31' },
  { input: '30/09/2024', expected: '2024-09-30', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'September 30' },
  { input: '31/10/2024', expected: '2024-10-31', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'October 31' },
  { input: '30/11/2024', expected: '2024-11-30', format: 'DD/MM/YYYY', confidence: 95, isValid: true, description: 'November 30' },
];

// Combine all date test cases
export const ALL_DATE_TEST_CASES: DateTestCase[] = [
  ...DD_MM_YYYY_CASES,
  ...DD_MM_YYYY_DASH_CASES,
  ...DD_MM_YYYY_DOT_CASES,
  ...DD_MM_YY_CASES,
  ...WRITTEN_MONTH_CASES,
  ...MONTH_DD_YYYY_CASES,
  ...ORDINAL_DATE_CASES,
  ...SHORT_MONTH_CASES,
  ...INVALID_DATE_CASES,
  ...EDGE_DATE_CASES,
];

// Export by category for targeted testing
export const DATE_CATEGORIES = {
  DD_MM_YYYY: DD_MM_YYYY_CASES,
  DD_MM_YYYY_DASH: DD_MM_YYYY_DASH_CASES,
  DD_MM_YYYY_DOT: DD_MM_YYYY_DOT_CASES,
  DD_MM_YY: DD_MM_YY_CASES,
  WRITTEN_MONTH: WRITTEN_MONTH_CASES,
  MONTH_DD_YYYY: MONTH_DD_YYYY_CASES,
  ORDINAL: ORDINAL_DATE_CASES,
  SHORT_MONTH: SHORT_MONTH_CASES,
  INVALID: INVALID_DATE_CASES,
  EDGE: EDGE_DATE_CASES,
};

// Statistics
export interface DateTestStats {
  totalCases: number;
  validCases: number;
  invalidCases: number;
  averageConfidence: number;
  supportedFormats: string[];
}

export function getDateTestStats(): DateTestStats {
  const validCases = ALL_DATE_TEST_CASES.filter(c => c.isValid);
  const invalidCases = ALL_DATE_TEST_CASES.filter(c => !c.isValid);
  const avgConfidence = validCases.reduce((sum, c) => sum + c.confidence, 0) / validCases.length;
  
  const formats = [...new Set(ALL_DATE_TEST_CASES.map(c => c.format))];
  
  return {
    totalCases: ALL_DATE_TEST_CASES.length,
    validCases: validCases.length,
    invalidCases: invalidCases.length,
    averageConfidence: Math.round(avgConfidence * 100) / 100,
    supportedFormats: formats,
  };
}

// Calculate accuracy metrics
export interface DateAccuracyMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  accuracy: number;
  averageConfidence: number;
}

export function calculateDateMetrics(results: { passed: boolean; confidence: number }[]): DateAccuracyMetrics {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const accuracy = (passedTests / totalTests) * 100;
  const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;
  
  return {
    totalTests,
    passedTests,
    failedTests,
    accuracy: Math.round(accuracy * 100) / 100,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
  };
}
