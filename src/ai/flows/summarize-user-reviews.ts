// Summarize User Reviews Flow
'use server';

/**
 * @fileOverview Summarizes user reviews for a given place using AI.
 *
 * - summarizeUserReviews - A function that summarizes user reviews for a place.
 * - SummarizeUserReviewsInput - The input type for the summarizeUserReviews function.
 * - SummarizeUserReviewsOutput - The return type for the summarizeUserReviews function.
 */

import { ai, runPromptWithFallback } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeUserReviewsInputSchema = z.object({
  placeName: z.string().describe('The name of the place to summarize reviews for.'),
  reviews: z.array(z.string()).describe('An array of user reviews for the place.'),
});
export type SummarizeUserReviewsInput = z.infer<typeof SummarizeUserReviewsInputSchema>;

const SummarizeUserReviewsOutputSchema = z.object({
  summary: z.string().describe('A summary of the user reviews.'),
});
export type SummarizeUserReviewsOutput = z.infer<typeof SummarizeUserReviewsOutputSchema>;

export async function summarizeUserReviews(
  input: SummarizeUserReviewsInput,
): Promise<SummarizeUserReviewsOutput> {
  return summarizeUserReviewsFlow(input);
}

const summarizeUserReviewsPrompt = ai.definePrompt({
  name: 'summarizeUserReviewsPrompt',
  input: { schema: SummarizeUserReviewsInputSchema },
  output: { schema: SummarizeUserReviewsOutputSchema },
  prompt: `Summarize the following user reviews for {{placeName}}:\n\n{{#each reviews}}\n- {{{this}}}\n{{/each}}\n\nProvide a concise summary highlighting the main points and overall sentiment expressed in the reviews.`,
});

const summarizeUserReviewsFlow = ai.defineFlow(
  {
    name: 'summarizeUserReviewsFlow',
    inputSchema: SummarizeUserReviewsInputSchema,
    outputSchema: SummarizeUserReviewsOutputSchema,
  },
  async (input) => {
    return runPromptWithFallback(summarizeUserReviewsPrompt, input);
  },
);
