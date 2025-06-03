
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { generateLocalTravelSuggestions, type GenerateLocalTravelSuggestionsInput, type GenerateLocalTravelSuggestionsOutput } from '@/ai/flows/generate-local-travel-suggestions';
import { MapPin, CalendarDays, Clock, Car, TrainFront, Bike, PersonStanding, Globe, Sparkles, CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

const transportOptions = [
  { value: 'any', label: 'Any', icon: Globe },
  { value: 'public', label: 'Public Transport', icon: TrainFront },
  { value: 'private', label: 'Private Hire (e.g. Taxi)', icon: Car },
  { value: 'own', label: 'Own Vehicle', icon: Car },
  { value: 'walking', label: 'Walking', icon: PersonStanding },
  { value: 'cycling', label: 'Cycling', icon: Bike },
] as const;

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const FormSchema = z.object({
  location: z.string().min(1, 'Location is required.'),
  date: z.date({ required_error: "Date is required." }),
  startTime: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM (e.g., 09:00).'),
  endTime: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM (e.g., 18:00).'),
  modeOfTransport: z.enum(['public', 'private', 'own', 'walking', 'cycling', 'any'], { required_error: "Mode of transport is required."}),
  preferences: z.string().optional(),
}).refine((data) => {
    return data.endTime > data.startTime;
}, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type LocalSearchFormValues = z.infer<typeof FormSchema>;

interface LocalSearchFormProps {
  onSuggestionsGenerated: (suggestions: GenerateLocalTravelSuggestionsOutput, location: string) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export function LocalSearchForm({ onSuggestionsGenerated, onLoading, onError }: LocalSearchFormProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<LocalSearchFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      location: '',
      date: undefined as Date | undefined,
      startTime: '09:00',
      endTime: '18:00',
      modeOfTransport: 'any',
      preferences: '',
    },
  });

  useEffect(() => {
    if (isClient) {
      form.reset({
        ...form.getValues(),
        date: new Date(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);


  const onSubmit = async (data: LocalSearchFormValues) => {
    onLoading(true);
    onError(null);
    try {
      const aiInput: GenerateLocalTravelSuggestionsInput = {
        location: data.location,
        date: format(data.date, 'yyyy-MM-dd'),
        startTime: data.startTime,
        endTime: data.endTime,
        modeOfTransport: data.modeOfTransport,
        preferences: data.preferences,
      };
      
      const result = await generateLocalTravelSuggestions(aiInput);
      onSuggestionsGenerated(result, data.location);
    } catch (err) {
      console.error('Error generating local travel suggestions:', err);
      let errorMessage = 'An unknown error occurred while generating suggestions.';
      if (err instanceof Error) {
        if (err.message.includes('503 Service Unavailable') || err.message.toLowerCase().includes('model is overloaded')) {
          errorMessage = 'The AI service is currently busy and couldn\'t process your request. Please try again in a few moments.';
        } else {
          errorMessage = err.message;
        }
      }
      onError(errorMessage);
    } finally {
      onLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Find Local Gems</CardTitle>
        <CardDescription>Enter your criteria to discover activities and places.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-accent" /> Location</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., San Francisco, CA or 'near me'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-accent" /> Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value && isClient ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { if(isClient && date) field.onChange(date); }}
                        disabled={(date) => {
                          if (!isClient) return true;
                          const targetDate = new Date(date);
                          targetDate.setHours(0,0,0,0);
                          const yesterday = new Date(new Date().setDate(new Date().getDate() -1));
                          yesterday.setHours(0,0,0,0);
                          return targetDate < yesterday;
                        }}
                        initialFocus={isClient}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Clock className="w-4 h-4 mr-2 text-accent" /> Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" placeholder="HH:MM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Clock className="w-4 h-4 mr-2 text-accent" /> End Time</FormLabel>
                    <FormControl>
                      <Input type="time" placeholder="HH:MM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="modeOfTransport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Car className="w-4 h-4 mr-2 text-accent" /> Mode of Transport</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred transport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transportOptions.map((option) => (
                         <SelectItem key={option.value} value={option.value}>
                           <div className="flex items-center">
                             <option.icon className="w-4 h-4 mr-2" /> {option.label}
                           </div>
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-accent" /> Preferences/Interests (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="E.g., interested in history, quiet cafes, parks..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting || !isClient}>
              {form.formState.isSubmitting ? 'Finding Suggestions...' : 'Get Local Suggestions'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
