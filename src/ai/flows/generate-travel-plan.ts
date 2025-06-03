
'use server';

/**
 * @fileOverview A travel plan generation AI agent.
 *
 * - generateTravelPlan - A function that handles the travel plan generation process.
 * - GenerateTravelPlanInput - The input type for the generateTravelPlan function.
 * - GenerateTravelPlanOutput - The return type for the generateTravelPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTravelPlanInputSchema = z.object({
  destination: z.string().describe('The destination for the travel plan.'),
  startDate: z.string().describe('The start date of the trip in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date of the trip in YYYY-MM-DD format.'),
  purpose: z.enum(['work', 'exam', 'travel', 'holiday']).describe('The purpose of the trip.'),
  companions: z.array(z.enum(['alone', 'friends', 'family'])).describe('The companions for the trip.'),
  modeOfTransport: z.enum(['public', 'private', 'own']).describe('The preferred mode of transport for inter-city travel or primary mode within destination if applicable for the whole trip.'),
  source: z.string().describe('The source location for the travel plan.'),
  targetCurrency: z.string().optional().describe('The preferred currency for the estimated cost (e.g., USD, EUR, JPY). If provided, the AI should attempt to provide the cost in this currency.'),
});
export type GenerateTravelPlanInput = z.infer<typeof GenerateTravelPlanInputSchema>;

const ActivitySchema = z.object({
  name: z.string().describe('Name of the activity or place.'),
  description: z.string().describe('A detailed description of the activity or place, highlighting its significance or appeal.'),
  type: z.string().describe('Category of the activity (e.g., "Museum", "Restaurant", "Park", "Historical Site", "Shopping", "Cultural Experience").'),
  estimatedDuration: z.string().optional().describe('Estimated time to spend at this activity/place (e.g., "1-2 hours", "30 minutes").'),
  address: z.string().optional().describe('The address or general location of the activity/place.'),
  notes: z.string().optional().describe('Any additional notes, tips, or booking information for this activity (e.g., "Book tickets online to avoid queues", "Try the local specialty dish here").')
});

const DailyItinerarySchema = z.object({
  day: z.number().describe('The day number (e.g., Day 1, Day 2).'),
  date: z.string().optional().describe('The specific date for this day of the itinerary (YYYY-MM-DD format), derived from start and end dates specified by the user.'),
  theme: z.string().optional().describe('A theme for the day, if applicable (e.g., "Historical Exploration", "Culinary Delights", "Nature & Relaxation").'),
  morningActivities: z.array(ActivitySchema).describe('Activities planned for the morning (approx. 9 AM - 12 PM).'),
  afternoonActivities: z.array(ActivitySchema).describe('Activities planned for the afternoon (approx. 1 PM - 5 PM).'),
  eveningActivities: z.array(ActivitySchema).describe('Activities planned for the evening (approx. 6 PM onwards, including dinner).'),
  dailySummary: z.string().describe('A brief summary of what the day entails and its flow.')
});

const TransportationDetailsSchema = z.object({
  gettingToDestination: z.string().describe('Detailed suggestions for traveling from the source ({{{source}}}) to the main destination ({{{destination}}}), considering the user\'s preferred modeOfTransport ({{{modeOfTransport}}}) for this leg. Include options (e.g., flight, train, car), estimated time, potential carriers/companies if known, and rough cost ideas if possible.'),
  interCityTravel: z.string().optional().describe('If the itinerary involves multiple cities or major areas within the destination region (beyond day trips from a single base), provide advice on traveling between them. Mention recommended modes, estimated times, and costs if possible. If not applicable, state so.'),
  localTransportInDestination: z.string().describe('Recommendations for getting around within the primary destination city/area (e.g., "Utilize the efficient metro system with a 3-day pass for $X", "Rent a car for flexibility in rural areas - note on parking availability and cost", "Taxis and ride-sharing are readily available, average cost per short trip is Y to Z"). Consider common options, costs, and any specific advice for the {{{destination}}}.')
});

const GenerateTravelPlanOutputSchema = z.object({
  tripTitle: z.string().describe('A catchy and descriptive title for the overall travel plan. Example: "An Adventurous Week in the Swiss Alps" or "Cultural Immersion in Kyoto: A 5-Day Journey".'),
  overallSummary: z.string().describe('A comprehensive summary (2-3 paragraphs) of the entire trip, its main highlights, the kind of experiences the traveler can expect, and the overall tone/pace of the trip.'),
  dailyItinerary: z.array(DailyItinerarySchema).describe('A detailed day-by-day itinerary. Each day should include a date (derived from user\'s start/end dates), a theme (optional), and separate lists for morning, afternoon, and evening activities. Each activity should have a name, detailed description, type, estimated duration, address (if applicable), and any relevant notes.'),
  transportationDetails: TransportationDetailsSchema.describe('Comprehensive transportation advice covering travel to destination, inter-city (if applicable), and local transport.'),
  accommodationRecommendations: z.array(z.string()).optional().describe('General suggestions for types of accommodation suitable for the trip (e.g., "Boutique hotels in the city center", "Cozy B&Bs in the countryside", "Budget-friendly hostels near transport hubs"). If appropriate, mention 1-2 specific, well-known examples with rough price indicators (e.g., "$$-$$$ per night") but avoid exhaustive lists.'),
  estimatedCost: z.number().describe('The estimated total cost of the trip, EXCLUDING travel to the destination from the source. This should cover accommodation (mid-range assumed unless purpose suggests otherwise), food, activities, and local transport for the duration of the trip at the destination. If a targetCurrency was specified by the user, provide the cost in that currency.'),
  currency: z.string().describe('The currency for the estimated cost (e.g., USD, EUR, JPY). This should match the user\'s targetCurrency if provided, otherwise default to USD or the most appropriate local currency.'),
  bestTimeToVisit: z.string().optional().describe('Brief note on the best time to visit the destination, considering seasons, weather, and potential events, especially if it differs from the user-specified dates or if the user dates are flexible.'),
  packingList: z.array(z.string()).optional().describe('A general packing list tailored to the destination, season (derived from dates), and planned activities (e.g., "Comfortable walking shoes", "Rain jacket", "Adapter for Type G outlets", "Swimsuit").'),
  localCustomsOrTips: z.array(z.string()).optional().describe('Important local customs, etiquette, safety tips, or other useful advice for the traveler (e.g., "Tipping is customary at 15-20%", "Learn a few basic phrases in the local language", "Be mindful of pickpockets in crowded areas").'),
  emergencyContacts: z.array(z.object({ name: z.string().describe("Type of emergency service, e.g., 'Police', 'Ambulance', 'General Emergency'"), number: z.string().describe("Local emergency number") })).optional().describe('Generic emergency contact numbers for the destination (e.g., local police, ambulance - NOT personal contacts).')
});
export type GenerateTravelPlanOutput = z.infer<typeof GenerateTravelPlanOutputSchema>;

export async function generateTravelPlan(input: GenerateTravelPlanInput): Promise<GenerateTravelPlanOutput> {
  return generateTravelPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTravelPlanPrompt',
  input: {schema: GenerateTravelPlanInputSchema},
  output: {schema: GenerateTravelPlanOutputSchema},
  prompt: `You are an expert travel planner AI. Generate a highly detailed and personalized travel plan based on the user's preferences.

  User Preferences:
  - Destination: {{{destination}}}
  - Trip Start Date: {{{startDate}}}
  - Trip End Date: {{{endDate}}}
  - Purpose: {{{purpose}}}
  - Companions: {{#each companions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Mode of Transport (for inter-city/main travel): {{{modeOfTransport}}}
  - Source: {{{source}}}
  {{#if targetCurrency}}- Preferred Currency for Estimate: {{{targetCurrency}}}{{/if}}

  Please provide the following in your plan, adhering strictly to the output schema:

  1.  **tripTitle**: Create a catchy and descriptive title for the travel plan.
  2.  **overallSummary**: Write a comprehensive summary (2-3 paragraphs) of the trip, its highlights, expected experiences, and overall pace.
  3.  **dailyItinerary**:
      *   For each day from {{{startDate}}} to {{{endDate}}}, create a daily plan.
      *   Include the day number (Day 1, Day 2, etc.) and the specific date (YYYY-MM-DD).
      *   Assign an optional theme for the day if it makes sense (e.g., "Historical Immersion," "Nature Escape").
      *   List distinct activities for morning, afternoon, and evening.
      *   For each activity, provide:
          *   \\\`name\\\`: Name of the place or activity.
          *   \\\`description\\\`: Detailed description (what it is, why it's interesting).
          *   \\\`type\\\`: Category (e.g., Museum, Restaurant, Park, Historical Site).
          *   \\\`estimatedDuration\\\`: How long to spend there.
          *   \\\`address\\\`: Specific address or location.
          *   \\\`notes\\\`: Any tips, booking info, or special considerations.
      *   Include a \\\`dailySummary\\\` for each day.
  4.  **transportationDetails**: Provide comprehensive transportation advice:
      *   \\\`gettingToDestination\\\`: Detail how to get from {{{source}}} to {{{destination}}}. Consider the user's selected \\\`modeOfTransport\\\`. Include options, estimated time, carriers, and rough cost ideas.
      *   \\\`interCityTravel\\\`: If the trip spans multiple cities within the destination region, detail travel between them (modes, times, costs). If not applicable, state so.
      *   \\\`localTransportInDestination\\\`: Recommend ways to get around within {{{destination}}} (e.g., metro, car rental, taxis). Include cost estimates for passes or typical trips.
  5.  **accommodationRecommendations**: Suggest types of accommodation (e.g., "Boutique hotels," "Budget hostels") with rough price indicators (e.g., "$$-$$$ per night"). Optionally, mention 1-2 well-known examples if highly relevant.
  6.  **estimatedCost**: Provide an estimated total cost for the trip at the destination (excluding travel from source to destination). This should cover mid-range accommodation, food, activities, and local transport. If the user specified a \\\`targetCurrency\\\` ({{{targetCurrency}}}), provide the cost in this currency.
  7.  **currency**: Specify the currency for the estimated cost (e.g., USD, EUR). This MUST match the user's \\\`targetCurrency\\\` if provided. Otherwise, default to USD or the most appropriate local currency for the destination.
  8.  **bestTimeToVisit**: (Optional) Briefly mention the best time to visit the destination.
  9.  **packingList**: (Optional) Suggest a packing list tailored to the destination, season, and activities.
  10. **localCustomsOrTips**: (Optional) Provide important local customs, etiquette, or safety tips.
  11. **emergencyContacts**: (Optional) List generic emergency contact numbers for the destination (e.g., Police: [number], Ambulance: [number]).

  Ensure the plan is coherent, practical, and engaging. The level of detail should be high, making it a truly useful guide for the traveler.
  The number of days for the itinerary should be calculated based on the provided startDate and endDate. For example, if startDate is 2024-08-01 and endDate is 2024-08-03, the itinerary should cover 3 days.
  `,
});

const generateTravelPlanFlow = ai.defineFlow(
  {
    name: 'generateTravelPlanFlow',
    inputSchema: GenerateTravelPlanInputSchema,
    outputSchema: GenerateTravelPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

