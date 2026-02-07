import { useState, useCallback } from "react";
import TextRecognition, {
  TextRecognitionResult,
} from "@react-native-ml-kit/text-recognition";
import { InteractionManager } from "react-native";
import { OCRResult, OCRBlock } from "@/lib/types";

interface UseOCRReturn {
  recognizeText: (imageUri: string) => Promise<OCRResult | null>;
  isProcessing: boolean;
  error: string | null;
  progress: number;
}

export const useOCR = (): UseOCRReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const calculateConfidence = (result: TextRecognitionResult): number => {
    if (!result.blocks || result.blocks.length === 0) {
      return 0;
    }

    const totalConfidence = result.blocks.reduce((sum, block) => {
      return sum + (block.confidence || 0);
    }, 0);

    return totalConfidence / result.blocks.length;
  };

  const mapBlocks = (result: TextRecognitionResult): OCRBlock[] => {
    if (!result.blocks) {
      return [];
    }

    return result.blocks.map((block) => ({
      text: block.text,
      confidence: block.confidence || 0,
      boundingBox: {
        left: block.frame?.left || 0,
        top: block.frame?.top || 0,
        width: block.frame?.width || 0,
        height: block.frame?.height || 0,
      },
    }));
  };

  const recognizeText = useCallback(
    async (imageUri: string): Promise<OCRResult | null> => {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      try {
        setProgress(10);

        const result = await new Promise<TextRecognitionResult>(
          (resolve, reject) => {
            InteractionManager.runAfterInteractions(async () => {
              try {
                const recognitionResult =
                  await TextRecognition.recognize(imageUri);
                resolve(recognitionResult);
              } catch (err) {
                reject(err);
              }
            });
          }
        );

        setProgress(60);

        if (!result || !result.text) {
          setError("No text detected in the image");
          return null;
        }

        setProgress(80);

        const confidence = calculateConfidence(result);
        const blocks = mapBlocks(result);

        setProgress(100);

        return {
          text: result.text,
          confidence: confidence,
          blocks: blocks,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to recognize text in the image";
        setError(errorMessage);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    recognizeText,
    isProcessing,
    error,
    progress,
  };
};
