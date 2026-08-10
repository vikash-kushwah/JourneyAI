import type { GenerateTravelPlanInput, GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';
import type { GenerateLocalTravelSuggestionsInput, GenerateLocalTravelSuggestionsOutput } from '@/ai/flows/generate-local-travel-suggestions';
import type { SummarizeUserReviewsInput, SummarizeUserReviewsOutput } from '@/ai/flows/summarize-user-reviews';
import { generateTravelPlan } from '@/ai/flows/generate-travel-plan';
import { generateLocalTravelSuggestions } from '@/ai/flows/generate-local-travel-suggestions';
import { summarizeUserReviews } from '@/ai/flows/summarize-user-reviews';

const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || '';
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || '';
};

export async function callGenerateTravelPlan(input: GenerateTravelPlanInput): Promise<GenerateTravelPlanOutput> {
  const backendUrl = getBackendUrl();
  if (backendUrl) {
    const res = await fetch(`${backendUrl}/api/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to generate travel plan (${res.status})`);
    }
    return await res.json();
  }
  return await generateTravelPlan(input);
}

export async function callGenerateLocalTravelSuggestions(input: GenerateLocalTravelSuggestionsInput): Promise<GenerateLocalTravelSuggestionsOutput> {
  const backendUrl = getBackendUrl();
  if (backendUrl) {
    const res = await fetch(`${backendUrl}/api/generate-local-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to generate local travel suggestions (${res.status})`);
    }
    return await res.json();
  }
  return await generateLocalTravelSuggestions(input);
}

export async function callSummarizeUserReviews(input: SummarizeUserReviewsInput): Promise<SummarizeUserReviewsOutput> {
  const backendUrl = getBackendUrl();
  if (backendUrl) {
    const res = await fetch(`${backendUrl}/api/summarize-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to summarize reviews (${res.status})`);
    }
    return await res.json();
  }
  return await summarizeUserReviews(input);
}
