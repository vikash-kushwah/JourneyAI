import { config } from 'dotenv';
config();

import '@/ai/flows/generate-travel-plan.ts';
import '@/ai/flows/summarize-user-reviews.ts';
import '@/ai/flows/generate-local-travel-suggestions.ts';
