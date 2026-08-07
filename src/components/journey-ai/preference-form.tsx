
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { generateTravelPlan, type GenerateTravelPlanInput, type GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';
import { MapPin, CalendarDays, Briefcase, BookOpenText, Plane, PartyPopper, Users, User, Car, TrainFront, Shuffle, CalendarIcon, CircleDollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';

const companionOptions = [
  { id: 'alone', label: 'Alone', icon: User },
  { id: 'friends', label: 'With Friends', icon: Users },
  { id: 'family', label: 'With Family', icon: Users },
  { id: 'friends_family', label: 'With Friends & Family', icon: Users },
] as const;

const purposeOptions = [
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'exam', label: 'Exam', icon: BookOpenText },
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'holiday', label: 'Holiday', icon: PartyPopper },
] as const;

const transportOptions = [
  { value: 'public', label: 'Public Transport', icon: TrainFront },
  { value: 'private', label: 'Private Hire (e.g. Taxi)', icon: Car },
  { value: 'own', label: 'Own Vehicle', icon: Car },
] as const;

const FormSchema = z.object({
  source: z.string().min(1, 'Source location is required.'),
  destination: z.string().min(1, 'Destination is required.'),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  purpose: z.enum(['work', 'exam', 'travel', 'holiday'], { required_error: "Purpose of travel is required."}),
  companionOption: z.enum(['alone', 'friends', 'family', 'friends_family'], { required_error: "Companion option is required."}),
  modeOfTransport: z.enum(['public', 'private', 'own'], { required_error: "Mode of transport is required."}),
  targetCurrency: z.string().optional().transform(val => val?.toUpperCase().trim() || undefined),
}).refine((data) => {
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate); 
      startDate.setHours(0,0,0,0);
      const endDate = new Date(data.endDate);
      endDate.setHours(0,0,0,0);
      return endDate >= startDate;
    }
    return true;
  }, {
  message: "End date must be on or after start date.",
  path: ["endDate"],
});

type PreferenceFormValues = z.infer<typeof FormSchema>;

interface PreferenceFormProps {
  onPlanGenerated: (plan: GenerateTravelPlanOutput, destination: string) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export function PreferenceForm({ onPlanGenerated, onLoading, onError }: PreferenceFormProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<PreferenceFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      source: '',
      destination: '',
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
      purpose: 'travel',
      companionOption: 'alone',
      modeOfTransport: 'public',
      targetCurrency: '',
    },
  });

  useEffect(() => {
    if (isClient) {
      const initialStartDate = new Date();
      const initialEndDate = new Date();
      initialEndDate.setDate(initialStartDate.getDate() + 7);
      
      form.reset({
        ...form.getValues(), 
        startDate: initialStartDate,
        endDate: initialEndDate,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]); 

  const onSubmit = async (data: PreferenceFormValues) => {
    onLoading(true);
    onError(null);
    try {
      let companionsArray: ('alone' | 'friends' | 'family')[];
      switch (data.companionOption) {
        case 'friends': companionsArray = ['friends']; break;
        case 'family': companionsArray = ['family']; break;
        case 'friends_family': companionsArray = ['friends', 'family']; break;
        default: companionsArray = ['alone'];
      }

      const aiInput: GenerateTravelPlanInput = {
        source: data.source,
        destination: data.destination,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        purpose: data.purpose,
        companions: companionsArray,
        modeOfTransport: data.modeOfTransport,
        targetCurrency: data.targetCurrency || undefined,
      };
      
      const result = await generateTravelPlan(aiInput);
      onPlanGenerated(result, data.destination);
    } catch (err) {
      console.error('Error generating travel plan:', err);
      let errorMessage = 'An unknown error occurred while generating the plan.';
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
        <CardTitle className="text-2xl font-headline text-primary">Plan Your Journey</CardTitle>
        <CardDescription>Tell us your preferences, and we will craft the perfect trip!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-accent" /> Source</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., New York City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-accent" /> Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Paris, France" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-accent" /> Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value && isClient ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (isClient && date) {
                                field.onChange(date);
                                const endDateVal = form.getValues("endDate");
                                if (endDateVal) {
                                   const newStartDate = new Date(date);
                                   newStartDate.setHours(0,0,0,0);
                                   const currentEndDate = new Date(endDateVal);
                                   currentEndDate.setHours(0,0,0,0);
                                   if (newStartDate > currentEndDate) {
                                     form.setValue("endDate", newStartDate);
                                   }
                                } else {
                                    form.setValue("endDate", date);
                                }
                            }
                          }}
                          disabled={(date) => {
                              if (!isClient) return true;
                              const targetDate = new Date(date);
                              targetDate.setHours(0,0,0,0);
                              const yesterday = new Date(new Date().setDate(new Date().getDate() -1));
                              yesterday.setHours(0,0,0,0);
                              return targetDate < yesterday;
                            }
                          }
                          initialFocus={isClient}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-accent" /> End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value && isClient ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => { if(isClient && date) field.onChange(date);}}
                          disabled={(date) => {
                            if (!isClient) return true;
                            const startDateVal = form.getValues("startDate");
                            const targetDate = new Date(date);
                            targetDate.setHours(0, 0, 0, 0);
                            
                            if (startDateVal) {
                              const currentStartDate = new Date(startDateVal);
                              currentStartDate.setHours(0, 0, 0, 0);
                              return targetDate < currentStartDate;
                            }
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
            </div>
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Shuffle className="w-4 h-4 mr-2 text-accent" /> Purpose of Travel</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {purposeOptions.map((option) => (
                        <FormItem key={option.value} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                          <FormControl>
                            <RadioGroupItem value={option.value} id={`purpose-${option.value}`} />
                          </FormControl>
                          <Label htmlFor={`purpose-${option.value}`} className="font-normal flex items-center cursor-pointer">
                            <option.icon className="w-4 h-4 mr-2" /> {option.label}
                          </Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companionOption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Users className="w-4 h-4 mr-2 text-accent" /> Companions</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select who you are travelling with" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companionOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
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
              name="modeOfTransport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Shuffle className="w-4 h-4 mr-2 text-accent" /> Mode of Transport</FormLabel>
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
              name="targetCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><CircleDollarSign className="w-4 h-4 mr-2 text-accent" /> Target Currency (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., USD, EUR, JPY (3-letter code)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting || !isClient}>
              {form.formState.isSubmitting ? 'Generating Plan...' : 'Generate My Travel Plan'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
    
