
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GenerateLocalTravelSuggestionsOutput } from '@/ai/flows/generate-local-travel-suggestions';
import { LocalSearchForm } from '@/components/journey-ai/local-search-form';
import { LocalSuggestionsDisplay } from '@/components/journey-ai/local-suggestions-display';
import { LoadingSpinner } from '@/components/journey-ai/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, AlertTriangle, PlaneTakeoff } from 'lucide-react';

export default function LocalSearchPage() {
  const [suggestions, setSuggestions] = useState<GenerateLocalTravelSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState<string>('');

  const handleSuggestionsGenerated = (newSuggestions: GenerateLocalTravelSuggestionsOutput, location: string) => {
    setSuggestions(newSuggestions);
    setSearchLocation(location);
    setError(null);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleError = (errorMessage: string | null) => {
    setError(errorMessage);
    if (errorMessage) {
      setSuggestions(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="py-8 bg-primary shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-5xl font-headline font-bold text-primary-foreground">Local Explorer</h1>
              <p className="text-xl text-primary-foreground/90 mt-1">Discover activities and places around you or any location!</p>
            </div>
            <Link href="/" passHref>
              <Button variant="secondary" size="lg" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground">
                <PlaneTakeoff className="mr-2 h-5 w-5" />
                Plan a Multi-Day Trip
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2">
            <LocalSearchForm
              onSuggestionsGenerated={handleSuggestionsGenerated}
              onLoading={handleLoadingChange}
              onError={handleError}
            />
          </div>

          <div className="lg:col-span-3">
            {isLoading && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <LoadingSpinner text="Our AI is finding the best local spots for you..." size={60} />
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
            {suggestions && !isLoading && !error && (
              <LocalSuggestionsDisplay suggestions={suggestions} locationName={searchLocation} />
            )}
            {!suggestions && !isLoading && !error && (
              <Card className="h-full flex flex-col items-center justify-center text-center p-8 shadow-lg border-dashed border-2">
                <CardHeader>
                  <Compass className="w-20 h-20 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-semibold mb-2 font-headline">Ready to Explore?</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-lg">
                    Fill out your search criteria on the left, and let our AI suggest local activities and places for you.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <footer className="py-6 mt-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Local Explorer by JourneyAI. Explore with confidence.</p>
        </div>
      </footer>
    </div>
  );
}

    