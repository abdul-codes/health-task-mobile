import { DocumentType, ExtractedField, OCRResult } from "@/lib/types";
import { ABBREVIATIONS } from "./medicalDictionary";

export interface ParsedDocument {
  documentType: DocumentType;
  fields: ExtractedField[];
  rawText: string;
  confidence: number;
}

interface ParserConfig {
  patterns: Record<string, RegExp>;
  requiredFields: string[];
  documentType: DocumentType;
}

// Document type detection patterns
const DOCUMENT_TYPE_PATTERNS: Record<DocumentType, RegExp[]> = {
  PATIENT_RECORD: [
    /patient\s+(info|information|record|data)/i,
    /name\s*:\s*[a-z]/i,
    /(age|dob|date of birth)\s*:/i,
    /(phone|contact|tel)\s*:/i,
    /(address|location)\s*:/i,
    /(sex|gender)\s*:/i,
    /biodata/i,
  ],
  PRESCRIPTION: [
    /prescription/i,
    /rx/i,
    /medications?\s*:/i,
    /drugs?\s*:/i,
    /dosage/i,
    /frequency/i,
    /(mg|ml|tablet|capsule|syrup)\s*\d+/i,
    /take\s+(one|two|three|four|1|2|3|4)/i,
    /(od|bd|tds|qid|prn)\s+/i,
  ],
  LAB_RESULT: [
    /(lab|laboratory)\s+(result|test|report)/i,
    /test\s+(result|value|report)/i,
    /(pcv|hb|wbc|rbc|plt)\s*:/i,
    /(reference\s+range|ref\s*range|normal\s*range)/i,
    /investigations?/i,
    /(fbc|fbc|chemistry|electrolytes)/i,
  ],
  TASK_NOTE: [
    /task/i,
    /note/i,
    /instruction/i,
    /follow\s*up/i,
    /reminder/i,
    /to\s*do/i,
  ],
};

// Parser configurations for each document type
const PARSER_CONFIGS: Record<DocumentType, ParserConfig> = {
  PATIENT_RECORD: {
    documentType: "PATIENT_RECORD",
    patterns: {
      name: /(?:patient\s+)?name\s*[:\-]?\s*([A-Za-z\s\-\.]+)(?:\n|\r|$|,|;)/i,
      age: /(?:age|years?\s*old?)\s*[:\-]?\s*(\d{1,3})(?:\s*years?|\s*y)?(?:\n|\r|$|,|;)/i,
      dob: /(?:dob|date\s+of\s+birth|birth\s+date|born)\s*[:\-]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})(?:\n|\r|$|,|;)/i,
      gender: /(?:sex|gender)\s*[:\-]?\s*(male|female|m|f)(?:\n|\r|$|,|;)/i,
      phone: /(?:phone|tel|contact|mobile)\s*[:\-]?\s*([\+\d\s\-\(\)]+)(?:\n|\r|$|,|;)/i,
      address: /(?:address|location|residence|home)\s*[:\-]?\s*([A-Za-z0-9\s,\.\-]+)(?:\n|\r|$|;)/i,
      occupation: /(?:occupation|job|work|profession)\s*[:\-]?\s*([A-Za-z\s\-\.]+)(?:\n|\r|$|,|;)/i,
      nextOfKin: /(?:next\s+of\s+kin|nok|emergency\s+contact)\s*[:\-]?\s*([A-Za-z\s\-\.]+)(?:\n|\r|$|,|;)/i,
      bloodGroup: /(?:blood\s*group|bg)\s*[:\-]?\s*([ABO][\+\-]?)(?:\n|\r|$|,|;)/i,
      genotype: /(?:genotype|geno)\s*[:\-]?\s*(AA|AS|SS|AC|SC)(?:\n|\r|$|,|;)/i,
    },
    requiredFields: ["name"],
  },
  PRESCRIPTION: {
    documentType: "PRESCRIPTION",
    patterns: {
      medication: /(?:medication|drug|medicine|rx|tab|tablet|cap|capsule|syrup|susp|injection|inj)\s*[:\-]?\s*([A-Za-z\s\-\.]+)(?:\d|\n|\r|$|,|;)/i,
      dosage: /(?:dosage|dose|strength)\s*[:\-]?\s*(\d+\s*(mg|ml|g|mcg|units?|%)(?:\s*\/\s*\d+\s*(mg|ml|g|mcg|units?|%))*)(?:\n|\r|$|,|;)/i,
      frequency: /(?:frequency|how\s+often|times?\s+(?:a\s+day|daily|per\s+day))\s*[:\-]?\s*(\d+|once|twice|three|four|1|2|3|4)(?:\s*(?:times?|x))?(?:\n|\r|$|,|;)/i,
      duration: /(?:duration|for|days?|weeks?|months?)\s*[:\-]?\s*(\d+)\s*(days?|weeks?|months?|d|w|m)(?:\n|\r|$|,|;)/i,
      route: /(?:route|how\s+to\s+take|via)\s*[:\-]?\s*(oral|iv|im|sc|po|pr|pv|topical|ointment|cream|sublingual|subling|subl)(?:\n|\r|$|,|;)/i,
      instructions: /(?:instructions?|directions?|note|advice)\s*[:\-]?\s*([A-Za-z\s,\.\-]+)(?:\n|\r|$|;)/i,
      quantity: /(?:quantity|qty|amount|number)\s*[:\-]?\s*(\d+)(?:\s*(?:tablet|tab|capsule|cap|bottle|pack))?(?:\n|\r|$|,|;)/i,
    },
    requiredFields: ["medication"],
  },
  LAB_RESULT: {
    documentType: "LAB_RESULT",
    patterns: {
      testType: /(?:test|investigation|assay)\s*[:\-]?\s*(PCV|HB|HGB|WBC|RBC|PLT|FBC|CBC|LFT|RFT|TFT|LIPID|Glucose|FBS|RBS|HbA1c|Urea|Creatinine|Electrolytes|ESR|CRP|Urinalysis|U\/A|MCS|Blood Culture|Malaria|MP|Widal|HIV|HBsAg|HCV|CD4|Viral Load)(?:\n|\r|$|,|;)/i,
      result: /(?:result|value|reading)\s*[:\-]?\s*([\d\.\s]+(?:\^?\d+)?\s*(?:g\/dL|mm\/L|%|mg\/dL|mmol\/L|U\/L|cells\/uL|mL|fl|pg)?)(?:\n|\r|$|,|;)/i,
      referenceRange: /(?:ref(?:erence)?\s*range|normal\s*range|range)\s*[:\-]?\s*([\d\-\.\s]+(?:\^?\d+)?\s*(?:g\/dL|mm\/L|%|mg\/dL|mmol\/L|U\/L)?)(?:\n|\r|$|,|;)/i,
      unit: /(?:unit|units?)\s*[:\-]?\s*([\w\/\^]+)(?:\n|\r|$|,|;)/i,
      labDate: /(?:date|dated|report\s+date)\s*[:\-]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})(?:\n|\r|$|,|;)/i,
    },
    requiredFields: ["testType", "result"],
  },
  TASK_NOTE: {
    documentType: "TASK_NOTE",
    patterns: {
      title: /(?:title|subject|task|about)\s*[:\-]?\s*([A-Za-z\s\-\.]+)(?:\n|\r|$|,|;)/i,
      description: /(?:description|details|note|content|body)\s*[:\-]?\s*([A-Za-z0-9\s,\.\-\(\)]+)(?:\n|\r|$|;)/i,
      priority: /(?:priority|urgency|importance)\s*[:\-]?\s*(high|medium|low|critical|urgent)(?:\n|\r|$|,|;)/i,
      dueDate: /(?:due|deadline|complete\s+by|finish\s+by)\s*[:\-]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})(?:\n|\r|$|,|;)/i,
      assignee: /(?:assign(?:ed)?\s*(?:to)?|for|responsible)\s*[:\-]?\s*([A-Za-z\s\-\.]+)(?:\n|\r|$|,|;)/i,
    },
    requiredFields: ["title"],
  },
};

// Detect document type based on text content
export function detectDocumentType(text: string): DocumentType {
  const scores: Record<DocumentType, number> = {
    PATIENT_RECORD: 0,
    PRESCRIPTION: 0,
    LAB_RESULT: 0,
    TASK_NOTE: 0,
  };

  for (const [type, patterns] of Object.entries(DOCUMENT_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        scores[type as DocumentType]++;
      }
    }
  }

  // Return the type with highest score
  let maxScore = 0;
  let detectedType: DocumentType = "PATIENT_RECORD";

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type as DocumentType;
    }
  }

  return detectedType;
}

// Expand abbreviations in text
function expandAbbreviations(text: string): string {
  let expanded = text;
  
  for (const [abbrev, full] of Object.entries(ABBREVIATIONS)) {
    // Match abbreviations that are standalone words
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
    expanded = expanded.replace(regex, full);
  }
  
  return expanded;
}

// Extract fields using regex patterns
function extractFields(
  text: string,
  config: ParserConfig
): ExtractedField[] {
  const fields: ExtractedField[] = [];
  
  // Expand abbreviations first
  const expandedText = expandAbbreviations(text);
  
  for (const [fieldName, pattern] of Object.entries(config.patterns)) {
    const match = expandedText.match(pattern);
    
    if (match && match[1]) {
      const value = match[1].trim();
      
      // Calculate confidence based on match quality
      let confidence = 85; // Base confidence
      
      // Higher confidence for exact matches
      if (match[0].toLowerCase().includes(fieldName.toLowerCase())) {
        confidence += 5;
      }
      
      // Lower confidence if value is very short
      if (value.length < 2) {
        confidence -= 20;
      }
      
      // Lower confidence if value contains unusual characters
      if (/[^\w\s\-\.\/\(\)\+\,\%\^\°]/.test(value)) {
        confidence -= 10;
      }
      
      fields.push({
        name: fieldName,
        value: value,
        confidence: Math.min(Math.max(confidence, 0), 100),
        isVerified: false,
      });
    }
  }
  
  return fields;
}

// Main parser function
export function parseDocument(ocrResult: OCRResult): ParsedDocument {
  const text = ocrResult.text;
  const documentType = detectDocumentType(text);
  const config = PARSER_CONFIGS[documentType];
  
  const fields = extractFields(text, config);
  
  // Calculate overall confidence
  const avgFieldConfidence = fields.length > 0
    ? fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length
    : 0;
  
  const overallConfidence = (ocrResult.confidence + avgFieldConfidence) / 2;
  
  return {
    documentType,
    fields,
    rawText: text,
    confidence: overallConfidence,
  };
}

// Parse specific field types with enhanced logic
export function parseDate(value: string): Date | null {
  // Nigerian date formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const datePatterns = [
    /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})/,
    /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2})/, // 2-digit year
  ];
  
  for (const pattern of datePatterns) {
    const match = value.match(pattern);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
      let year = parseInt(match[3], 10);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      const date = new Date(year, month, day);
      
      // Validate the date
      if (
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        return date;
      }
    }
  }
  
  return null;
}

export function parseDosage(value: string): { amount: number; unit: string } | null {
  const match = value.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|units?|%)/i);
  
  if (match) {
    return {
      amount: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
    };
  }
  
  return null;
}

export function parseFrequency(value: string): { times: number; per: string } | null {
  // Handle numeric frequencies
  const numericMatch = value.match(/(\d+)/);
  if (numericMatch) {
    return {
      times: parseInt(numericMatch[1], 10),
      per: "day",
    };
  }
  
  // Handle word frequencies
  const wordMap: Record<string, number> = {
    once: 1,
    twice: 2,
    three: 3,
    four: 4,
  };
  
  const lowerValue = value.toLowerCase();
  for (const [word, times] of Object.entries(wordMap)) {
    if (lowerValue.includes(word)) {
      return { times, per: "day" };
    }
  }
  
  return null;
}

export function parsePhoneNumber(value: string): string | null {
  // Nigerian phone number patterns
  const patterns = [
    /\+234\s*\d{10}/, // +234 format
    /0\d{10}/, // 0XXXXXXXXXX format
    /\d{3}[\s\-]?\d{3}[\s\-]?\d{4}/, // XXX-XXX-XXXX format
  ];
  
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      // Normalize to +234 format
      let phone = match[0].replace(/\s+/g, "");
      if (phone.startsWith("0")) {
        phone = "+234" + phone.substring(1);
      }
      return phone;
    }
  }
  
  return null;
}

export function parseBloodPressure(value: string): { systolic: number; diastolic: number } | null {
  const match = value.match(/(\d{2,3})\s*[\/\-]\s*(\d{2,3})/);
  
  if (match) {
    const systolic = parseInt(match[1], 10);
    const diastolic = parseInt(match[2], 10);
    
    // Validate reasonable BP values
    if (systolic >= 70 && systolic <= 250 && diastolic >= 40 && diastolic <= 150) {
      return { systolic, diastolic };
    }
  }
  
  return null;
}
