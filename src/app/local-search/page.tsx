'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { GenerateLocalTravelSuggestionsOutput } from '@/ai/flows/generate-local-travel-suggestions';
import { LocalSearchForm } from '@/components/journey-ai/local-search-form';
import { LocalSuggestionsDisplay } from '@/components/journey-ai/local-suggestions-display';
import { SavedLocalSheet } from '@/components/journey-ai/saved-local-sheet';
import { useSavedLocal } from '@/hooks/use-saved-local';
import { decodeShareData } from '@/lib/share-utils';
import { LoadingSpinner } from '@/components/journey-ai/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavButton } from '@/components/journey-ai/nav-button';
import { Compass, AlertTriangle, PlaneTakeoff, Bookmark } from 'lucide-react';

export default function LocalSearchPage() {
  const [suggestions, setSuggestions] = useState<GenerateLocalTravelSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [isSavedLocalOpen, setIsSavedLocalOpen] = useState(false);

  const { savedLocal } = useSavedLocal();

  // Restore shared local guide from URL hash if opened via shared link
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#local=')) {
      const rawHash = window.location.hash.slice(7);
      const decoded = decodeShareData<{
        suggestions: GenerateLocalTravelSuggestionsOutput;
        location: string;
      }>(rawHash);
      if (decoded && decoded.suggestions) {
        setSuggestions(decoded.suggestions);
        setSearchLocation(decoded.location || '');
        setError(null);
      }
    }
  }, []);

  const handleSuggestionsGenerated = (
    newSuggestions: GenerateLocalTravelSuggestionsOutput,
    location: string,
  ) => {
    setSuggestions(newSuggestions);
    setSearchLocation(location);
    setError(null);
  };

  const handleSelectSavedLocal = (
    savedSuggestions: GenerateLocalTravelSuggestionsOutput,
    location: string,
  ) => {
    setSuggestions(savedSuggestions);
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
      <header className="py-8 bg-primary shadow-md print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-5xl font-headline font-bold text-primary-foreground">
                Local Explorer
              </h1>
              <p className="text-xl text-primary-foreground/90 mt-1">
                Discover activities and places around you or any location!
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSavedLocalOpen(true)}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Saved Explorations
                {savedLocal.length > 0 && (
                  <span className="ml-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
                    {savedLocal.length}
                  </span>
                )}
              </Button>
              <NavButton
                href="/"
                icon={<PlaneTakeoff className="mr-2 h-5 w-5" />}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                Plan a Multi-Day Trip
              </NavButton>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 print:hidden">
            <LocalSearchForm
              onSuggestionsGenerated={handleSuggestionsGenerated}
              onLoading={handleLoadingChange}
              onError={handleError}
            />
          </div>

          <div className="lg:col-span-3 print:col-span-5 print:w-full">
            {isLoading && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <LoadingSpinner
                    text="Our AI is finding the best local spots for you..."
                    size={60}
                  />
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
              <LocalSuggestionsDisplay
                suggestions={suggestions}
                locationName={searchLocation}
                onOpenSaved={() => setIsSavedLocalOpen(true)}
              />
            )}
            {!suggestions && !isLoading && !error && (
              <Card className="h-full flex flex-col items-center justify-center text-center p-8 shadow-lg border-dashed border-2">
                <CardHeader>
                  <Compass className="w-20 h-20 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-semibold mb-2 font-headline">
                    Ready to Explore?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-lg">
                    Fill out your search criteria on the left, and let our AI suggest local
                    activities and places for you.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <SavedLocalSheet
        open={isSavedLocalOpen}
        onOpenChange={setIsSavedLocalOpen}
        onSelectLocal={handleSelectSavedLocal}
      />

      <footer className="py-6 mt-12 border-t border-border/50 print:hidden">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>
            &copy; {new Date().getFullYear()} Local Explorer by JourneyAI. Explore with confidence.
          </p>
        </div>
      </footer>
    </div>
  );
}
