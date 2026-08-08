'use client';

import type {
  GenerateLocalTravelSuggestionsOutput,
  GenerateLocalTravelSuggestionsInput,
} from '@/ai/flows/generate-local-travel-suggestions';
import { FormattedMarkdownText } from '@/components/journey-ai/formatted-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Timer,
  Tag,
  Building,
  Utensils,
  Trees,
  Landmark,
  ShoppingBag,
  AlignLeft,
  VenetianMask,
  Info,
  Sparkles,
  Globe,
  Clock,
  DollarSign,
  BookMarked,
  ExternalLink,
  AlertTriangle,
  ThumbsUp,
  MessageSquare,
  Route,
} from 'lucide-react';

interface LocalSuggestionsDisplayProps {
  suggestions: GenerateLocalTravelSuggestionsOutput;
  locationName: string;
}

const getCategoryIcon = (category?: string, specificType?: string) => {
  const lowerCategory = category?.toLowerCase() || '';
  const lowerSpecificType = specificType?.toLowerCase() || '';

  if (
    lowerCategory.includes('food') ||
    lowerSpecificType.includes('restaurant') ||
    lowerSpecificType.includes('cafe')
  )
    return <Utensils className="w-5 h-5 mr-2 text-primary" />;
  if (
    lowerCategory.includes('culture') ||
    lowerCategory.includes('history') ||
    lowerSpecificType.includes('museum') ||
    lowerSpecificType.includes('landmark')
  )
    return <Landmark className="w-5 h-5 mr-2 text-primary" />;
  if (
    lowerCategory.includes('outdoor') ||
    lowerCategory.includes('nature') ||
    lowerSpecificType.includes('park') ||
    lowerSpecificType.includes('garden')
  )
    return <Trees className="w-5 h-5 mr-2 text-primary" />;
  if (
    lowerCategory.includes('entertainment') ||
    lowerSpecificType.includes('event') ||
    lowerSpecificType.includes('show')
  )
    return <VenetianMask className="w-5 h-5 mr-2 text-primary" />;
  if (lowerCategory.includes('shop') || lowerSpecificType.includes('market'))
    return <ShoppingBag className="w-5 h-5 mr-2 text-primary" />;
  if (lowerCategory.includes('relax') || lowerSpecificType.includes('spa'))
    return <Sparkles className="w-5 h-5 mr-2 text-primary" />; // Assuming Sparkles for relaxation/spa
  return <Info className="w-5 h-5 mr-2 text-primary" />; // Default icon
};

export function LocalSuggestionsDisplay({
  suggestions,
  locationName,
}: LocalSuggestionsDisplayProps) {
  const renderActivity = (
    item:
      | NonNullable<GenerateLocalTravelSuggestionsOutput['suggestedItinerary']>[0]
      | NonNullable<GenerateLocalTravelSuggestionsOutput['alternativeSuggestion']>,
    isAlternative: boolean = false,
  ) => {
    if (!item) return null;
    return (
      <div
        className={`p-3 rounded-lg shadow-sm ${isAlternative ? 'bg-amber-50 border border-amber-200' : 'bg-card border'}`}
      >
        <h4 className="font-semibold text-lg text-foreground flex items-center mb-1">
          {getCategoryIcon(item.category, item.specificType)}
          {item.name}
          {isAlternative && (
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-300">
              Alternative
            </Badge>
          )}
        </h4>

        <div className="pl-7 space-y-2 text-sm">
          <div className="text-muted-foreground flex items-start">
            <AlignLeft className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-accent" />
            <FormattedMarkdownText text={item.description} />
          </div>

          {item.reasonWhySuggested && (
            <div className="text-sm text-primary/90 flex items-start">
              <ThumbsUp className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium mr-1">Why it&apos;s a good fit: </span>
                <FormattedMarkdownText text={item.reasonWhySuggested} className="inline" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {item.category && (
              <div className="flex items-center p-2 bg-secondary/40 rounded-md">
                <Tag className="w-4 h-4 mr-2 text-accent shrink-0" />
                <span className="font-medium mr-1">Category:</span>
                <span className="text-muted-foreground">
                  {item.category}
                  {item.specificType ? ` (${item.specificType})` : ''}
                </span>
              </div>
            )}
            {item.estimatedDuration && (
              <div className="flex items-center p-2 bg-secondary/40 rounded-md">
                <Timer className="w-4 h-4 mr-2 text-accent shrink-0" />
                <span className="font-medium mr-1">Duration:</span>
                <span className="text-muted-foreground">{item.estimatedDuration}</span>
              </div>
            )}
            {item.address && (
              <div className="flex items-center p-2 bg-secondary/40 rounded-md sm:col-span-2">
                <MapPin className="w-4 h-4 mr-2 text-accent shrink-0" />
                <span className="font-medium mr-1">Location:</span>
                <span className="text-muted-foreground">{item.address}</span>
              </div>
            )}
            {item.openingHours && (
              <div className="flex items-center p-2 bg-secondary/40 rounded-md">
                <Clock className="w-4 h-4 mr-2 text-accent shrink-0" />
                <span className="font-medium mr-1">Hours:</span>
                <span className="text-muted-foreground">{item.openingHours}</span>
              </div>
            )}
            {item.estimatedCost && (
              <div className="flex items-center p-2 bg-secondary/40 rounded-md">
                <DollarSign className="w-4 h-4 mr-2 text-accent shrink-0" />
                <span className="font-medium mr-1">Cost:</span>
                <span className="text-muted-foreground">{item.estimatedCost}</span>
              </div>
            )}
            {item.bookingNeeded && (
              <div className="flex items-center p-2 bg-secondary/40 rounded-md">
                <BookMarked className="w-4 h-4 mr-2 text-accent shrink-0" />
                <span className="font-medium mr-1">Booking:</span>
                <span className="text-muted-foreground">{item.bookingNeeded}</span>
              </div>
            )}
            {item.website && (
              <div className="flex items-center p-2 bg-secondary/40 rounded-md sm:col-span-2">
                <ExternalLink className="w-4 h-4 mr-2 text-accent shrink-0" />
                <span className="font-medium mr-1">Website:</span>
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {item.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-secondary/30">
        <CardTitle className="text-2xl md:text-3xl font-headline text-primary">
          {suggestions.title || `Local Suggestions for ${locationName}`}
        </CardTitle>
        {suggestions.introduction && (
          <CardDescription className="text-base mt-1">{suggestions.introduction}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-6">
        {suggestions.suggestedItinerary && suggestions.suggestedItinerary.length > 0 ? (
          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">
              Your Suggested Itinerary:
            </h3>
            <ScrollArea className="h-[60vh] rounded-md p-1">
              <div className="space-y-4">
                {suggestions.suggestedItinerary.map((item, index) => (
                  <Accordion
                    key={`suggestion-${index}`}
                    type="single"
                    collapsible
                    defaultValue="item-0"
                  >
                    <AccordionItem value={`item-${index}`} className="border-none p-0">
                      <AccordionTrigger className="p-0 hover:no-underline [&[data-state=open]>svg]:hidden [&[data-state=closed]>svg]:hidden">
                        {renderActivity(item)}
                      </AccordionTrigger>
                      <AccordionContent className="pt-0">
                        {/* Content is already in renderActivity, this is just to make it expandable if needed in future */}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-8">
            <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No specific suggestions available for these criteria. Try broadening your search!
            </p>
          </div>
        )}

        {suggestions.overallTimeManagementNotes && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold flex items-center mb-2 text-foreground">
              <Timer className="w-5 h-5 mr-2 text-accent" /> Time Management Notes
            </h3>
            <FormattedMarkdownText
              text={suggestions.overallTimeManagementNotes}
              className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md"
            />
          </div>
        )}

        {suggestions.transportationAdvice && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold flex items-center mb-2 text-foreground">
              <Route className="w-5 h-5 mr-2 text-accent" /> Transportation Advice
            </h3>
            <FormattedMarkdownText
              text={suggestions.transportationAdvice}
              className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md"
            />
          </div>
        )}

        {suggestions.alternativeSuggestion && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-3 text-foreground">
              Looking for an Alternative?
            </h3>
            {renderActivity(suggestions.alternativeSuggestion, true)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
