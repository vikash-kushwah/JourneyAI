'use server';

/**
 * @fileOverview Generates local travel suggestions based on user criteria.
 *
 * - generateLocalTravelSuggestions - A function that handles local travel suggestion generation.
 * - GenerateLocalTravelSuggestionsInput - The input type for the function.
 * - GenerateLocalTravelSuggestionsOutput - The return type for the function.
 */

import { ai, runPromptWithFallback } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateLocalTravelSuggestionsInputSchema = z.object({
  location: z.string().describe('The city or area for suggestions (e.g., "San Francisco, CA").'),
  date: z.string().describe('The specific date for suggestions in YYYY-MM-DD format.'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM (24-hour) format.')
    .describe('Start time for activities in HH:MM (e.g., "09:00").'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM (24-hour) format.')
    .describe('End time for activities in HH:MM (e.g., "18:00").'),
  modeOfTransport: z
    .enum(['public', 'private', 'own', 'walking', 'cycling', 'any'])
    .describe('Preferred mode of transportation.'),
  preferences: z
    .string()
    .optional()
    .describe(
      'User preferences or interests (e.g., "art museums, coffee shops, budget-friendly").',
    ),
});
export type GenerateLocalTravelSuggestionsInput = z.infer<
  typeof GenerateLocalTravelSuggestionsInputSchema
>;

const createSuggestedActivitySchema = () =>
  z.object({
    name: z.string().describe('Name of the activity/place.'),
    description: z.string().describe('Detailed description of the activity/place.'),
    category: z.string().describe('Broad category (e.g., "Food & Drink", "Culture").'),
    specificType: z.string().optional().describe('Specific type (e.g., "Museum", "Cafe").'),
    estimatedDuration: z
      .string()
      .describe(
        'Estimated time to spend (e.g., "1-2 hours"). Critical for fitting into user time window.',
      ),
    address: z.string().optional().describe('Full address or specific location.'),
    reasonWhySuggested: z
      .string()
      .optional()
      .describe('Specific reason why this fits user criteria.'),
    openingHours: z
      .string()
      .optional()
      .describe(
        'Relevant opening hours for {{{date}}} (e.g., "10 AM - 6 PM"). MUST be open during user\'s {{{startTime}}}-{{{endTime}}} window on {{{date}}}. If unsure, state "Verify opening hours".',
      ),
    estimatedCost: z.string().optional().describe('Estimated cost (e.g., "Free", "$10-20").'),
    bookingNeeded: z
      .string()
      .optional()
      .describe('Booking: "Recommended", "Required", or "Not usually needed".'),
    website: z.string().optional().describe('Official website URL, if available.'),
  });

const GenerateLocalTravelSuggestionsOutputSchema = z.object({
  title: z
    .string()
    .describe(
      "Catchy, personalized title for the plan (e.g., 'Your [StartTime]-[EndTime] in [Location]').",
    ),
  introduction: z
    .string()
    .optional()
    .describe('Brief intro paragraph (2-3 sentences) for the plan.'),
  suggestedItinerary: z
    .array(createSuggestedActivitySchema())
    .min(1)
    .max(5)
    .describe(
      "List of 1 to 5 suggested activities. MUST fit within user's time window {{{startTime}}}-{{{endTime}}}, including travel.",
    ),
  overallTimeManagementNotes: z
    .string()
    .optional()
    .describe(
      "Notes on fitting activities into time window. If sequential, MUST include estimated travel time AND mode between them. Sum durations and travel, state if fits user's available time from {{{startTime}}} to {{{endTime}}}. Mention buffer time.",
    ),
  transportationAdvice: z
    .string()
    .optional()
    .describe(
      "General advice for using {{{modeOfTransport}}} (or alternatives if 'any') in {{{location}}}. Markdown format: bold heading per mode (e.g., '**Taxis:**'), then bullet points for details (availability, cost, how to use). No specific inter-activity travel here.",
    ),
  alternativeSuggestion: createSuggestedActivitySchema()
    .optional()
    .describe('One alternative activity fitting criteria.'),
});
export type GenerateLocalTravelSuggestionsOutput = z.infer<
  typeof GenerateLocalTravelSuggestionsOutputSchema
>;

export async function generateLocalTravelSuggestions(
  input: GenerateLocalTravelSuggestionsInput,
): Promise<GenerateLocalTravelSuggestionsOutput> {
  return generateLocalTravelSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLocalTravelSuggestionsPrompt',
  input: { schema: GenerateLocalTravelSuggestionsInputSchema },
  output: { schema: GenerateLocalTravelSuggestionsOutputSchema },
  prompt: `You are an expert local tour guide AI. Generate a highly detailed and personalized list of travel suggestions or a mini-itinerary based on the user's criteria. The plan must be actionable and realistic for the given timeframe.

User Criteria:
- Location: {{{location}}}
- Date: {{{date}}}
- Available Time: From {{{startTime}}} to {{{endTime}}} (This is a strict window. Total duration of activities + travel MUST fit.)
- Preferred Mode of Transport: {{{modeOfTransport}}}
{{#if preferences}}
- User Preferences/Interests: {{{preferences}}}
{{/if}}

Your response MUST adhere to the 'GenerateLocalTravelSuggestionsOutputSchema'.

Key Instructions:
1.  **Time Constraint is CRITICAL**: The entire suggested itinerary, including all activity durations and any travel time between them, MUST be completable within the user's available time from {{{startTime}}} to {{{endTime}}} on {{{date}}}. Calculate the total available duration and ensure your plan fits.
2.  **Activity Details**: For each suggested activity (in 'suggestedItinerary' and 'alternativeSuggestion'), provide all schema fields. For 'openingHours', CRITICALLY check if it's open during the user's {{{startTime}}}-{{{endTime}}} window. If unsure, state "Verify opening hours".
3.  **Itinerary Size**: Suggest 1 to 5 primary activities in 'suggestedItinerary'.
4.  **Sequencing**: If multiple activities are suggested, try to sequence them logically.
5.  **Title and Introduction**: Provide a catchy 'title' and a brief 'introduction'.
6.  **Time Management Notes (overallTimeManagementNotes)**:
    *   Explain how the plan fits the time window.
    *   State estimated duration for each activity.
    *   **Crucially**: If suggesting sequential activities, explicitly mention *estimated travel time AND mode* between them. E.g., "Activity 1 (1hr). Travel to Activity 2 by taxi (15 mins, $5). Activity 2 (1.5hr)."
    *   Sum total time (activities + travel) and confirm it fits user's window, mentioning buffer. This manages the itinerary flow.
7.  **Transportation Advice (transportationAdvice)**:
    *   Provide general, concise guidance on using {{{modeOfTransport}}} (or alternatives if 'any') in {{{location}}}.
    *   **Format**: Markdown. Bold heading per mode (e.g., "**Taxis:**"). Under each, short bullet points for key details (availability, cost range, how to use).
    *   **Scope**: General usability of transport. Specific travel *between suggested activities* is for 'overallTimeManagementNotes'.
    *   If 'any' mode, describe 2-3 common modes. Keep bullets short and informative.
8.  **Alternative**: Include one 'alternativeSuggestion' fitting all criteria.
9.  **Relevance**: All suggestions must be relevant to {{{location}}} and preferences.

Example for startTime: "09:00", endTime: "12:00". User has 3 hours.
If suggesting A (1hr) and B (1.5hr), 'overallTimeManagementNotes' must detail travel A to B (e.g., "Travel A to B by bus (15 mins, $2)"), and total (A duration + travel + B duration) must be <= 3 hours.

Focus on quality, detail, and practicality.
`,
});

const generateLocalTravelSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateLocalTravelSuggestionsFlow',
    inputSchema: GenerateLocalTravelSuggestionsInputSchema,
    outputSchema: GenerateLocalTravelSuggestionsOutputSchema,
  },
  async (input) => {
    return runPromptWithFallback(prompt, input);
  },
);
