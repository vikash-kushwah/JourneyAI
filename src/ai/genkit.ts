import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

interface CachedModels {
  models: string[];
  timestamp: number;
}

let modelCache: CachedModels | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute cache to reduce API calls

/**
 * Dynamically fetches live models available for the user's API key from Google Generative AI API.
 * Automatically filters models supporting generateContent and ranks them by version & speed.
 */
export async function getLiveAvailableModels(): Promise<string[]> {
  const now = Date.now();
  if (modelCache && now - modelCache.timestamp < CACHE_TTL_MS && modelCache.models.length > 0) {
    return modelCache.models;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn(
      '[JourneyAI Dynamic Models] No GOOGLE_API_KEY set, using default fallback candidate list.',
    );
    return getDefaultCandidateList();
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch models: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.models)) {
      throw new Error('Invalid response payload from Google AI models API');
    }

    const rawModels: Array<{ name: string; supportedGenerationMethods?: string[] }> = data.models;

    // Filter models supporting text/content generation and exclude non-text modal models
    const validModels = rawModels
      .filter((m) => {
        const name = m.name.toLowerCase();
        const methods = m.supportedGenerationMethods || [];
        const canGenerate = methods.includes('generateContent');
        const isSpecialized =
          name.includes('tts') ||
          name.includes('clip') ||
          name.includes('robotics') ||
          name.includes('computer-use');
        return canGenerate && !isSpecialized;
      })
      .map((m) => m.name.replace(/^models\//, 'googleai/'));

    // Sort models dynamically: Flash models first, higher version numbers first (3.6 > 2.5 > 2.0 > 1.5)
    const sortedModels = sortModelsByPreference(validModels);

    if (sortedModels.length > 0) {
      modelCache = { models: sortedModels, timestamp: now };
      console.log(
        `[JourneyAI Dynamic Models] Dynamically fetched ${sortedModels.length} live models. Top preference: "${sortedModels[0]}"`,
      );
      return sortedModels;
    }
  } catch (err) {
    console.warn(
      '[JourneyAI Dynamic Models] Failed to fetch live models from Google AI API, falling back to static candidates:',
      err,
    );
  }

  return getDefaultCandidateList();
}

function getDefaultCandidateList(): string[] {
  return [
    process.env.GEMINI_MODEL,
    'googleai/gemini-2.0-flash',
    'googleai/gemini-2.5-flash',
    'googleai/gemini-2.0-flash-lite',
    'googleai/gemini-1.5-flash',
    'googleai/gemini-1.5-pro',
  ].filter(Boolean) as string[];
}

function sortModelsByPreference(models: string[]): string[] {
  const userOverride = process.env.GEMINI_MODEL;

  return [...models].sort((a, b) => {
    if (userOverride) {
      if (a === userOverride) return -1;
      if (b === userOverride) return 1;
    }

    // Prefer Flash / fast models over Pro models for quick web response times
    const aIsFlash = a.includes('flash');
    const bIsFlash = b.includes('flash');

    if (aIsFlash && !bIsFlash) return -1;
    if (!aIsFlash && bIsFlash) return 1;

    // Extract numerical versions (e.g. 3.6, 2.5, 2.0, 1.5)
    const getVersion = (name: string) => {
      const match = name.match(/gemini-(\d+(?:\.\d+)?)/i);
      return match ? parseFloat(match[1]) : 0;
    };

    const versionA = getVersion(a);
    const versionB = getVersion(b);

    if (versionA !== versionB) {
      return versionB - versionA; // Higher version first
    }

    return a.localeCompare(b);
  });
}

let activeWorkingModel: string | null = null;

/**
 * Executes a Genkit prompt function with automatic dynamic model discovery & fallback.
 * Fetches live models dynamically, starts with the latest & fastest model,
 * and automatically switches models when rate limits (429), quota limits, or model errors occur.
 */
export async function runPromptWithFallback<I, O>(
  promptFn: (input: I, opts?: { model?: string }) => Promise<{ output: O | null }>,
  input: I,
): Promise<O> {
  const liveModels = await getLiveAvailableModels();

  // If we already have a confirmed working model from a previous request, put it first
  const modelsToTry =
    activeWorkingModel && liveModels.includes(activeWorkingModel)
      ? [activeWorkingModel, ...liveModels.filter((m) => m !== activeWorkingModel)]
      : liveModels;

  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[JourneyAI Dynamic AI] Attempting prompt execution with model: "${modelName}"`);
      const response = await promptFn(input, { model: modelName });
      if (response && response.output) {
        activeWorkingModel = modelName;
        console.log(
          `[JourneyAI Dynamic AI] Successfully generated response using model: "${modelName}"`,
        );
        return response.output;
      }
    } catch (err) {
      console.warn(
        `[JourneyAI Dynamic AI] Model "${modelName}" encountered limit/error. Automatically switching to next available model...`,
      );
      lastError = err;
    }
  }

  // Final fallback: invoke default without explicit model parameter
  try {
    console.log(`[JourneyAI Dynamic AI] Default fallback attempt without explicit model parameter`);
    const response = await promptFn(input);
    if (response && response.output) {
      return response.output;
    }
  } catch (err) {
    lastError = err;
  }

  throw (
    lastError ||
    new Error('All dynamically discovered free Gemini models failed or reached quota limits.')
  );
}
