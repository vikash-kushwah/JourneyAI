'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';
import { PreferenceForm } from '@/components/journey-ai/preference-form';
import { PlanDisplay } from '@/components/journey-ai/plan-display';
import { LoadingSpinner } from '@/components/journey-ai/loading-spinner';
import { SavedPlansSheet } from '@/components/journey-ai/saved-plans-sheet';
import { useSavedPlans } from '@/hooks/use-saved-plans';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavButton } from '@/components/journey-ai/nav-button';
import { PlaneTakeoff, AlertTriangle, Compass, Bookmark } from 'lucide-react';

export default function JourneyAiPage() {
  const [plan, setPlan] = useState<GenerateTravelPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formDestination, setFormDestination] = useState<string>('');
  const [isSavedPlansOpen, setIsSavedPlansOpen] = useState(false);

  const { savedPlans } = useSavedPlans();

  const handlePlanGenerated = (newPlan: GenerateTravelPlanOutput, destination: string) => {
    setPlan(newPlan);
    setFormDestination(destination);
    setError(null);
  };

  const handleSelectSavedPlan = (savedPlan: GenerateTravelPlanOutput, destination: string) => {
    setPlan(savedPlan);
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
      <header className="py-8 bg-primary shadow-md print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-5xl font-headline font-bold text-primary-foreground">
                JourneyAI
              </h1>
              <p className="text-xl text-primary-foreground/90 mt-1">
                Your Personal AI Travel Planner
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSavedPlansOpen(true)}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Saved Trips
                {savedPlans.length > 0 && (
                  <span className="ml-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
                    {savedPlans.length}
                  </span>
                )}
              </Button>
              <NavButton
                href="/local-search"
                icon={<Compass className="mr-2 h-5 w-5" />}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                Explore Local Activities
              </NavButton>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 print:hidden">
            <PreferenceForm
              onPlanGenerated={handlePlanGenerated}
              onLoading={handleLoadingChange}
              onError={handleError}
            />
          </div>

          <div className="lg:col-span-3 print:col-span-5 print:w-full">
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
                <PlanDisplay
                  plan={plan}
                  destinationName={formDestination}
                  onOpenSavedPlans={() => setIsSavedPlansOpen(true)}
                />
              </div>
            )}
            {!plan && !isLoading && !error && (
              <Card className="h-full flex flex-col items-center justify-center text-center p-8 shadow-lg border-dashed border-2">
                <CardHeader>
                  <PlaneTakeoff className="w-20 h-20 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-semibold mb-2 font-headline">
                    Ready to Plan Your Next Adventure?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-lg">
                    Fill out your travel preferences on the left, and let our AI craft a
                    personalized itinerary for you.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <SavedPlansSheet
        open={isSavedPlansOpen}
        onOpenChange={setIsSavedPlansOpen}
        onSelectPlan={handleSelectSavedPlan}
      />

      <footer className="py-6 mt-12 border-t border-border/50 print:hidden">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} JourneyAI. Powered by AI and imagination.</p>
        </div>
      </footer>
    </div>
  );
}
