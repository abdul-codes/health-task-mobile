// Date Normalization Utility for Nigerian Healthcare Context
// Handles various date formats commonly used in Nigerian hospitals

export interface NormalizedDate {
  date: Date;
  originalFormat: string;
  confidence: number; // 0-100
  isValid: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
  duration: number; // in days
}

// Common Nigerian date formats
const DATE_PATTERNS = [
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (Most common in Nigeria)
  {
    pattern: /^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/,
    format: "DD/MM/YYYY",
    dayIndex: 1,
    monthIndex: 2,
    yearIndex: 3,
  },
  // DD/MM/YY or DD-MM-YY (2-digit year)
  {
    pattern: /^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2})$/,
    format: "DD/MM/YY",
    dayIndex: 1,
    monthIndex: 2,
    yearIndex: 3,
  },
  // MM/DD/YYYY (US format - less common but possible)
  {
    pattern: /^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/,
    format: "MM/DD/YYYY",
    dayIndex: 2,
    monthIndex: 1,
    yearIndex: 3,
  },
  // DD Month YYYY (e.g., "12 May 2024" or "12 May, 2024")
  {
    pattern: /^(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})$/,
    format: "DD Month YYYY",
    dayIndex: 1,
    monthIndex: 2,
    yearIndex: 3,
    isMonthName: true,
  },
  // Month DD, YYYY (e.g., "May 12, 2024")
  {
    pattern: /^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/,
    format: "Month DD, YYYY",
    dayIndex: 2,
    monthIndex: 1,
    yearIndex: 3,
    isMonthName: true,
  },
  // YYYY-MM-DD (ISO format)
  {
    pattern: /^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/,
    format: "YYYY-MM-DD",
    dayIndex: 3,
    monthIndex: 2,
    yearIndex: 1,
  },
  // DDth Month YYYY (e.g., "12th May 2024")
  {
    pattern: /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s*(\d{4})$/,
    format: "DDth Month YYYY",
    dayIndex: 1,
    monthIndex: 2,
    yearIndex: 3,
    isMonthName: true,
  },
];

// Month name mappings
const MONTH_NAMES: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sept: 8,
  sep: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

// Parse month name to month index (0-11)
function parseMonthName(monthName: string): number | null {
  const normalized = monthName.toLowerCase().trim();
  return MONTH_NAMES[normalized] ?? null;
}

// Validate if a date is reasonable (not in the future, not too old)
function isReasonableDate(date: Date): boolean {
  const now = new Date();
  const minDate = new Date("1900-01-01"); // No dates before 1900

  return date >= minDate && date <= now;
}

// Main normalization function
export function normalizeDate(value: string): NormalizedDate | null {
  if (!value || value.trim().length < 6) {
    return null;
  }

  const cleaned = value.trim();

  for (const datePattern of DATE_PATTERNS) {
    const match = cleaned.match(datePattern.pattern);

    if (match) {
      let day: number;
      let month: number;
      let year: number;

      if (datePattern.isMonthName) {
        day = parseInt(match[datePattern.dayIndex], 10);
        const monthName = match[datePattern.monthIndex];
        const parsedMonth = parseMonthName(monthName);

        if (parsedMonth === null) {
          continue;
        }
        month = parsedMonth;
        year = parseInt(match[datePattern.yearIndex], 10);
      } else {
        day = parseInt(match[datePattern.dayIndex], 10);
        month = parseInt(match[datePattern.monthIndex], 10) - 1; // JS months are 0-indexed
        year = parseInt(match[datePattern.yearIndex], 10);
      }

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      // Validate ranges
      if (month < 0 || month > 11 || day < 1 || day > 31) {
        continue;
      }

      const date = new Date(year, month, day);

      // Verify the date is valid (handles months with different days)
      if (
        date.getDate() !== day ||
        date.getMonth() !== month ||
        date.getFullYear() !== year
      ) {
        continue;
      }

      // Calculate confidence based on format clarity
      let confidence = 90;

      // Boost confidence for 4-digit years
      if (year > 999) {
        confidence += 5;
      }

      // Slightly lower confidence for 2-digit day/month
      if (day < 10 || month < 9) {
        confidence -= 2;
      }

      // Check if date is reasonable
      if (!isReasonableDate(date)) {
        confidence -= 15;
      }

      return {
        date,
        originalFormat: datePattern.format,
        confidence: Math.min(confidence, 100),
        isValid: true,
      };
    }
  }

  return null;
}

// Format a normalized date to display format
export function formatDate(
  date: Date,
  format: "short" | "medium" | "long" = "medium"
): string {
  if (format === "short") {
    return date.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } else if (format === "medium") {
    return date.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } else {
    return date.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  }
}

// Calculate age from birthdate
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

// Parse duration strings (e.g., "7 days", "2 weeks", "1 month")
export function parseDuration(value: string): DateRange | null {
  const patterns = [
    /(\d+)\s*(days?|d)\b/i,
    /(\d+)\s*(weeks?|w)\b/i,
    /(\d+)\s*(months?|m)\b/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      const start = new Date();
      let end = new Date();
      let duration = 0;

      if (unit.startsWith("d")) {
        end.setDate(end.getDate() + amount);
        duration = amount;
      } else if (unit.startsWith("w")) {
        end.setDate(end.getDate() + amount * 7);
        duration = amount * 7;
      } else if (unit.startsWith("m")) {
        end.setMonth(end.getMonth() + amount);
        // Calculate actual days
        duration = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return { start, end, duration };
    }
  }

  return null;
}

// Check if a date string is in a valid format
export function isValidDateFormat(value: string): boolean {
  return normalizeDate(value) !== null;
}

// Convert any date to ISO string (YYYY-MM-DD)
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Parse and normalize a date from OCR text
export function extractAndNormalizeDate(text: string): NormalizedDate | null {
  // Look for date patterns in text
  const datePatterns = [
    /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})/i,
    /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s*\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const normalized = normalizeDate(match[1]);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

// Batch normalize multiple dates
export function normalizeDates(values: string[]): (NormalizedDate | null)[] {
  return values.map((value) => normalizeDate(value));
}

// Get current date in Nigerian format
export function getCurrentDate(): NormalizedDate {
  const now = new Date();
  return {
    date: now,
    originalFormat: "ISO",
    confidence: 100,
    isValid: true,
  };
}
