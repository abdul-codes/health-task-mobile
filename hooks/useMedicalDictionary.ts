import { useMemo, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import {
  MEDICATIONS,
  DIAGNOSES,
  ABBREVIATIONS,
  LAB_TESTS,
  MedicalTerm,
} from "@/utils/medicalDictionary";

interface FuzzyMatchResult {
  term: string;
  score: number;
  confidence: number; // 0-100
  category: MedicalTerm["category"];
  isAbbreviation: boolean;
}

interface UseMedicalDictionaryReturn {
  findClosestTerm: (
    input: string,
    category?: MedicalTerm["category"]
  ) => FuzzyMatchResult | null;
  correctTerm: (
    input: string,
    category?: MedicalTerm["category"],
    threshold?: number
  ) => string | null;
  getSuggestions: (
    input: string,
    category?: MedicalTerm["category"],
    limit?: number
  ) => FuzzyMatchResult[];
  expandAbbreviation: (abbrev: string) => string | null;
  isMedicalTerm: (input: string) => boolean;
}

const FUSE_OPTIONS: Fuse.IFuseOptions<MedicalTerm> = {
  keys: ["term", "aliases"],
  threshold: 0.4, // 0 = exact match, 1 = match anything
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  shouldSort: true,
};

export const useMedicalDictionary = (): UseMedicalDictionaryReturn => {
  // Create Fuse indices for each category
  const fuseIndices = useRef<{
    all: Fuse<MedicalTerm>;
    medications: Fuse<MedicalTerm>;
    diagnoses: Fuse<MedicalTerm>;
  }>();

  // Initialize Fuse indices once
  if (!fuseIndices.current) {
    fuseIndices.current = {
      all: new Fuse([...MEDICATIONS, ...DIAGNOSES], FUSE_OPTIONS),
      medications: new Fuse(MEDICATIONS, FUSE_OPTIONS),
      diagnoses: new Fuse(DIAGNOSES, FUSE_OPTIONS),
    };
  }

  // Convert Fuse score (0-1, lower is better) to confidence percentage (0-100, higher is better)
  const scoreToConfidence = useCallback((score: number): number => {
    // Fuse score: 0 = perfect match, 1 = no match
    // We want: 100 = perfect match, 0 = no match
    const confidence = Math.round((1 - score) * 100);
    return Math.min(Math.max(confidence, 0), 100);
  }, []);

  // Find closest matching medical term
  const findClosestTerm = useCallback(
    (
      input: string,
      category?: MedicalTerm["category"]
    ): FuzzyMatchResult | null => {
      if (!input || input.length < 2) {
        return null;
      }

      const normalizedInput = input.trim().toLowerCase();

      // First check if it's an exact abbreviation
      if (ABBREVIATIONS[normalizedInput.toUpperCase()]) {
        return {
          term: ABBREVIATIONS[normalizedInput.toUpperCase()],
          score: 0,
          confidence: 100,
          category: "abbreviation",
          isAbbreviation: true,
        };
      }

      // Select the appropriate fuse index
      let fuse: Fuse<MedicalTerm>;
      if (category === "medication") {
        fuse = fuseIndices.current!.medications;
      } else if (category === "diagnosis") {
        fuse = fuseIndices.current!.diagnoses;
      } else {
        fuse = fuseIndices.current!.all;
      }

      // Search for matches
      const results = fuse.search(normalizedInput, { limit: 1 });

      if (results.length === 0) {
        return null;
      }

      const bestMatch = results[0];
      const matchedTerm = bestMatch.item;
      const score = bestMatch.score ?? 1;

      return {
        term: matchedTerm.term,
        score: score,
        confidence: scoreToConfidence(score),
        category: matchedTerm.category,
        isAbbreviation: false,
      };
    },
    [scoreToConfidence]
  );

  // Correct a term if confidence is high enough
  const correctTerm = useCallback(
    (
      input: string,
      category?: MedicalTerm["category"],
      threshold: number = 70
    ): string | null => {
      const match = findClosestTerm(input, category);

      if (!match) {
        return null;
      }

      // Only return correction if confidence is above threshold
      if (match.confidence >= threshold) {
        return match.term;
      }

      return null;
    },
    [findClosestTerm]
  );

  // Get multiple suggestions for a term
  const getSuggestions = useCallback(
    (
      input: string,
      category?: MedicalTerm["category"],
      limit: number = 5
    ): FuzzyMatchResult[] => {
      if (!input || input.length < 2) {
        return [];
      }

      const normalizedInput = input.trim().toLowerCase();

      // Select the appropriate fuse index
      let fuse: Fuse<MedicalTerm>;
      if (category === "medication") {
        fuse = fuseIndices.current!.medications;
      } else if (category === "diagnosis") {
        fuse = fuseIndices.current!.diagnoses;
      } else {
        fuse = fuseIndices.current!.all;
      }

      // Search for matches
      const results = fuse.search(normalizedInput, { limit });

      return results.map((result) => ({
        term: result.item.term,
        score: result.score ?? 1,
        confidence: scoreToConfidence(result.score ?? 1),
        category: result.item.category,
        isAbbreviation: false,
      }));
    },
    [scoreToConfidence]
  );

  // Expand an abbreviation to its full form
  const expandAbbreviation = useCallback((abbrev: string): string | null => {
    const normalizedAbbrev = abbrev.trim().toUpperCase();
    return ABBREVIATIONS[normalizedAbbrev] || null;
  }, []);

  // Check if a term exists in the medical dictionary
  const isMedicalTerm = useCallback((input: string): boolean => {
    if (!input || input.length < 2) {
      return false;
    }

    const normalizedInput = input.trim().toLowerCase();

    // Check abbreviations
    if (ABBREVIATIONS[normalizedInput.toUpperCase()]) {
      return true;
    }

    // Check lab tests
    if (
      LAB_TESTS.some(
        (test) => test.toLowerCase() === normalizedInput
      )
    ) {
      return true;
    }

    // Check medications and diagnoses with fuzzy match
    const allTerms = [...MEDICATIONS, ...DIAGNOSES];
    return allTerms.some(
      (term) =>
        term.term.toLowerCase() === normalizedInput ||
        term.aliases?.some(
          (alias) => alias.toLowerCase() === normalizedInput
        )
    );
  }, []);

  return useMemo(
    () => ({
      findClosestTerm,
      correctTerm,
      getSuggestions,
      expandAbbreviation,
      isMedicalTerm,
    }),
    [
      findClosestTerm,
      correctTerm,
      getSuggestions,
      expandAbbreviation,
      isMedicalTerm,
    ]
  );
};
