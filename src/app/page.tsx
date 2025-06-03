
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';
import { PreferenceForm } from '@/components/journey-ai/preference-form';
import { PlanDisplay } from '@/components/journey-ai/plan-display';
import { LoadingSpinner } from '@/components/journey-ai/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaneTakeoff, AlertTriangle, Compass } from 'lucide-react';

export default function JourneyAiPage() {
  const [plan, setPlan] = useState<GenerateTravelPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formDestination, setFormDestination] = useState<string>(''); 

  const handlePlanGenerated = (newPlan: GenerateTravelPlanOutput, destination: string) => {
    setPlan(newPlan);
    setFormDestination(destination); 
    setError(null);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleError = (errorMessage: string | null) => {
    setError(errorMessage);
    if (errorMessage) { 
      setPlan(null);
    }
  };
  

  return (
    <div className="min-h-screen bg-background">
      <header className="py-8 bg-primary shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-5xl font-headline font-bold text-primary-foreground">JourneyAI</h1>
              <p className="text-xl text-primary-foreground/90 mt-1">Your Personal AI Travel Planner</p>
            </div>
            <Link href="/local-search" passHref>
              <Button variant="secondary" size="lg" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground">
                <Compass className="mr-2 h-5 w-5" />
                Explore Local Activities
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2">
            <PreferenceForm
              onPlanGenerated={handlePlanGenerated}
              onLoading={handleLoadingChange}
              onError={handleError}
            />
          </div>

          <div className="lg:col-span-3">
            {isLoading && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <LoadingSpinner text="Our AI is crafting your perfect journey..." size={60} />
                </CardContent>
              </Card>
            )}
            {error && !isLoading && (
              <Alert variant="destructive" className="shadow-lg">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-headline">Oops! Something went wrong.</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {plan && !isLoading && !error && (
              <div className="space-y-8">
                <PlanDisplay plan={plan} destinationName={formDestination} />
              </div>
            )}
            {!plan && !isLoading && !error && (
              <Card className="h-full flex flex-col items-center justify-center text-center p-8 shadow-lg border-dashed border-2">
                <CardHeader>
                  <PlaneTakeoff className="w-20 h-20 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-semibold mb-2 font-headline">Ready to Plan Your Next Adventure?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-lg">
                    Fill out your travel preferences on the left, and let our AI craft a personalized itinerary for you.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <footer className="py-6 mt-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} JourneyAI. Powered by AI and imagination.</p>
        </div>
      </footer>
    </div>
  );
}

    
