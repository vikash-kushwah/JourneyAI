
'use client';

import type { GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Clock,
  CircleDollarSign,
  Route,
  ListChecks,
  Users,
  Briefcase,
  CalendarDays,
  Ship,
  Car,
  Plane,
  Train,
  Luggage,
  BookOpen,
  ShieldCheck,
  Info,
  Building2,
  Sun,
  Moon,
  Coffee,
  Lightbulb,
  Wallet,
  Globe2,
  Landmark,
  Milestone,
  Bus,
  Bike
} from 'lucide-react';
import { Separator } from '../ui/separator';

interface PlanDisplayProps {
  plan: GenerateTravelPlanOutput;
  destinationName: string; // This might be redundant if plan.tripTitle is good
}

const getIconForActivityType = (type: string) => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('museum') || lowerType.includes('historical') || lowerType.includes('landmark') || lowerType.includes('gallery')) return <Landmark className="w-4 h-4 mr-2 text-primary shrink-0" />;
  if (lowerType.includes('restaurant') || lowerType.includes('food') || lowerType.includes('cafe') || lowerType.includes('dining')) return <Coffee className="w-4 h-4 mr-2 text-primary shrink-0" />;
  if (lowerType.includes('park') || lowerType.includes('nature') || lowerType.includes('garden') || lowerType.includes('outdoor')) return <Sun className="w-4 h-4 mr-2 text-primary shrink-0" />;
  if (lowerType.includes('shop') || lowerType.includes('market')) return <Wallet className="w-4 h-4 mr-2 text-primary shrink-0" />;
  if (lowerType.includes('tour')) return <Globe2 className="w-4 h-4 mr-2 text-primary shrink-0" />;
  if (lowerType.includes('event') || lowerType.includes('show') || lowerType.includes('entertainment')) return <Users className="w-4 h-4 mr-2 text-primary shrink-0" />;
  return <Info className="w-4 h-4 mr-2 text-primary shrink-0" />;
};

export function PlanDisplay({ plan, destinationName }: PlanDisplayProps) {
  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-secondary/30">
        <CardTitle className="text-2xl md:text-3xl font-headline text-primary">{plan.tripTitle || `Your Trip to ${destinationName}`}</CardTitle>
        {plan.overallSummary && <CardDescription className="text-base mt-1">{plan.overallSummary}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-8 p-4 md:p-6">

        {plan.dailyItinerary && plan.dailyItinerary.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-3 text-foreground">
              <CalendarDays className="w-6 h-6 mr-3 text-accent" />
              Daily Itinerary
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={`day-0`}>
              {plan.dailyItinerary.map((day, dayIndex) => (
                <AccordionItem value={`day-${dayIndex}`} key={dayIndex} className="border bg-card rounded-lg shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 rounded-t-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full text-left">
                      <span className="font-semibold text-lg text-foreground">
                        Day {day.day}: {day.theme || (day.date ? new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : '')}
                      </span>
                      {day.date && !day.theme && <Badge variant="outline" className="mt-1 sm:mt-0 sm:ml-2">{new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
                    {day.dailySummary && <p className="text-muted-foreground mb-4 italic">{day.dailySummary}</p>}
                    
                    {(day.morningActivities?.length > 0) && (
                      <div className="mb-3">
                        <h4 className="text-md font-semibold flex items-center mb-2 text-foreground/90"><Sun className="w-5 h-5 mr-2 text-yellow-500"/>Morning</h4>
                        <ul className="space-y-3 pl-2 border-l-2 border-accent/30">
                          {day.morningActivities.map((activity, actIndex) => (
                            <li key={`morning-${actIndex}`} className="p-3 bg-secondary/20 rounded-md">
                              <strong className="flex items-center">{getIconForActivityType(activity.type)} {activity.name}</strong> ({activity.type})
                              {activity.estimatedDuration && <small className="text-muted-foreground block ml-6">Est. Duration: {activity.estimatedDuration}</small>}
                              <p className="text-sm text-muted-foreground ml-6 my-1">{activity.description}</p>
                              {activity.address && <small className="text-xs text-muted-foreground/80 flex items-center ml-6"><MapPin className="w-3 h-3 mr-1"/>{activity.address}</small>}
                              {activity.notes && <small className="text-xs text-blue-600 block mt-1 ml-6">Note: {activity.notes}</small>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(day.afternoonActivities?.length > 0) && (
                      <div className="mb-3">
                         <h4 className="text-md font-semibold flex items-center mb-2 text-foreground/90"><Clock className="w-5 h-5 mr-2 text-orange-500"/>Afternoon</h4>
                        <ul className="space-y-3 pl-2 border-l-2 border-accent/30">
                          {day.afternoonActivities.map((activity, actIndex) => (
                             <li key={`afternoon-${actIndex}`} className="p-3 bg-secondary/20 rounded-md">
                              <strong className="flex items-center">{getIconForActivityType(activity.type)} {activity.name}</strong> ({activity.type})
                              {activity.estimatedDuration && <small className="text-muted-foreground block ml-6">Est. Duration: {activity.estimatedDuration}</small>}
                              <p className="text-sm text-muted-foreground ml-6 my-1">{activity.description}</p>
                              {activity.address && <small className="text-xs text-muted-foreground/80 flex items-center ml-6"><MapPin className="w-3 h-3 mr-1"/>{activity.address}</small>}
                              {activity.notes && <small className="text-xs text-blue-600 block mt-1 ml-6">Note: {activity.notes}</small>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(day.eveningActivities?.length > 0) && (
                      <div>
                        <h4 className="text-md font-semibold flex items-center mb-2 text-foreground/90"><Moon className="w-5 h-5 mr-2 text-indigo-500"/>Evening</h4>
                        <ul className="space-y-3 pl-2 border-l-2 border-accent/30">
                          {day.eveningActivities.map((activity, actIndex) => (
                            <li key={`evening-${actIndex}`} className="p-3 bg-secondary/20 rounded-md">
                              <strong className="flex items-center">{getIconForActivityType(activity.type)} {activity.name}</strong> ({activity.type})
                              {activity.estimatedDuration && <small className="text-muted-foreground block ml-6">Est. Duration: {activity.estimatedDuration}</small>}
                              <p className="text-sm text-muted-foreground ml-6 my-1">{activity.description}</p>
                              {activity.address && <small className="text-xs text-muted-foreground/80 flex items-center ml-6"><MapPin className="w-3 h-3 mr-1"/>{activity.address}</small>}
                              {activity.notes && <small className="text-xs text-blue-600 block mt-1 ml-6">Note: {activity.notes}</small>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
        
        <Separator />

        <div>
          <h2 className="text-xl font-semibold flex items-center mb-3 text-foreground">
            <Route className="w-6 h-6 mr-3 text-accent" />
            Transportation Details
          </h2>
          <div className="space-y-4">
            {plan.transportationDetails?.gettingToDestination && (
              <div>
                <h3 className="text-lg font-medium flex items-center mb-1 text-foreground/90">
                  <Plane className="w-5 h-5 mr-2 text-primary" /> Getting to {destinationName}
                </h3>
                <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">{plan.transportationDetails.gettingToDestination}</p>
              </div>
            )}
            {plan.transportationDetails?.interCityTravel && (
              <div>
                <h3 className="text-lg font-medium flex items-center mb-1 text-foreground/90">
                  <Milestone className="w-5 h-5 mr-2 text-primary" /> Inter-City Travel
                </h3>
                <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">{plan.transportationDetails.interCityTravel}</p>
              </div>
            )}
            {plan.transportationDetails?.localTransportInDestination && (
               <div>
                <h3 className="text-lg font-medium flex items-center mb-1 text-foreground/90">
                  <Bus className="w-5 h-5 mr-2 text-primary" /> Local Transport in {destinationName}
                </h3>
                <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">{plan.transportationDetails.localTransportInDestination}</p>
              </div>
            )}
          </div>
        </div>
            
        {plan.accommodationRecommendations && plan.accommodationRecommendations.length > 0 && (
            <div>
                <Separator className="my-6"/>
                <h3 className="text-lg font-semibold flex items-center mb-2 text-foreground">
                <Building2 className="w-5 h-5 mr-2 text-accent" />
                Accommodation Ideas
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md space-y-1">
                    {plan.accommodationRecommendations.map((rec, index) => <li key={index}>{rec}</li>)}
                </ul>
            </div>
        )}
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center mb-2 text-foreground">
              <CircleDollarSign className="w-5 h-5 mr-2 text-accent" />
              Estimated Cost
            </h3>
            <Badge variant="secondary" className="text-lg px-3 py-1 bg-accent/10 text-accent-foreground border-accent">
              {plan.currency} {plan.estimatedCost.toLocaleString()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">(Excludes travel to destination from source)</p>
          </div>
          {plan.bestTimeToVisit && (
             <div>
                <h3 className="text-lg font-semibold flex items-center mb-2 text-foreground">
                <Lightbulb className="w-5 h-5 mr-2 text-accent" />
                Best Time to Visit
                </h3>
                <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">{plan.bestTimeToVisit}</p>
            </div>
          )}
        </div>

        {plan.packingList && plan.packingList.length > 0 && (
            <div>
                <Separator className="my-6"/>
                <h3 className="text-lg font-semibold flex items-center mb-2 text-foreground">
                <Luggage className="w-5 h-5 mr-2 text-accent" />
                Packing Suggestions
                </h3>
                <ScrollArea className="h-32 rounded-md border p-1">
                    <ul className="list-disc list-inside text-sm text-muted-foreground p-3 space-y-1">
                    {plan.packingList.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </ScrollArea>
            </div>
        )}

        {plan.localCustomsOrTips && plan.localCustomsOrTips.length > 0 && (
            <div>
                 <Separator className="my-6"/>
                <h3 className="text-lg font-semibold flex items-center mb-2 text-foreground">
                <BookOpen className="w-5 h-5 mr-2 text-accent" />
                Local Customs & Tips
                </h3>
                <ScrollArea className="h-32 rounded-md border p-1">
                    <ul className="list-disc list-inside text-sm text-muted-foreground p-3 space-y-1">
                    {plan.localCustomsOrTips.map((tip, index) => <li key={index}>{tip}</li>)}
                    </ul>
                </ScrollArea>
            </div>
        )}
        
        {plan.emergencyContacts && plan.emergencyContacts.length > 0 && (
            <div>
                <Separator className="my-6"/>
                <h3 className="text-lg font-semibold flex items-center mb-2 text-foreground">
                    <ShieldCheck className="w-5 h-5 mr-2 text-accent" />
                    Emergency Contacts
                </h3>
                <ul className="list-none text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md space-y-1">
                    {plan.emergencyContacts.map((contact, index) => (
                    <li key={index}><strong>{contact.name}:</strong> {contact.number}</li>
                    ))}
                </ul>
            </div>
        )}

      </CardContent>
    </Card>
  );
}

