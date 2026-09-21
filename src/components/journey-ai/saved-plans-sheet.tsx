'use client';

import { useState } from 'react';
import type { GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';
import { useSavedPlans, type SavedPlan } from '@/hooks/use-saved-plans';
import { exportPlanToPdf } from '@/lib/pdf-generator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Heart,
  Calendar,
  Wallet,
  Trash2,
  FileDown,
  ArrowRight,
  Search,
  Bookmark,
  PlaneTakeoff,
} from 'lucide-react';

interface SavedPlansSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (plan: GenerateTravelPlanOutput, destination: string) => void;
}

export function SavedPlansSheet({ open, onOpenChange, onSelectPlan }: SavedPlansSheetProps) {
  const { savedPlans, removePlan, toggleLikePlan } = useSavedPlans();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLikedOnly, setFilterLikedOnly] = useState(false);

  const filteredPlans = savedPlans.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLiked = !filterLikedOnly || item.isLiked;
    return matchesSearch && matchesLiked;
  });

  const handleOpenPlan = (saved: SavedPlan) => {
    onSelectPlan(saved.plan, saved.destination);
    onOpenChange(false);
  };

  const handleDownload = (e: React.MouseEvent, saved: SavedPlan) => {
    e.stopPropagation();
    exportPlanToPdf(saved.plan, saved.destination);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removePlan(id);
  };

  const handleToggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleLikePlan(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg flex flex-col p-6 overflow-hidden"
      >
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              <SheetTitle className="text-xl font-headline">Saved Itineraries</SheetTitle>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {savedPlans.length} {savedPlans.length === 1 ? 'trip' : 'trips'}
            </Badge>
          </div>
          <SheetDescription className="text-sm">
            Revisit, download, or manage your previously saved and liked travel plans.
          </SheetDescription>

          {/* Search & Filter Controls */}
          {savedPlans.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search destination or trip..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filterLikedOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterLikedOnly(!filterLikedOnly)}
                  className={`text-xs h-7 ${
                    filterLikedOnly ? 'bg-rose-500 hover:bg-rose-600 text-white' : ''
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 mr-1 ${filterLikedOnly ? 'fill-white' : 'text-rose-500'}`}
                  />
                  Liked Trips Only
                </Button>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Plans List */}
        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          {savedPlans.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <PlaneTakeoff className="w-6 h-6" />
              </div>
              <p className="font-medium text-foreground text-sm">No saved itineraries yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Generate a travel plan and click the &quot;Save Plan&quot; or &quot;Like&quot;
                button to bookmark it for later.
              </p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No trips match your search criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlans.map((saved) => {
                const days = saved.plan.dailyItinerary?.length || 0;
                const formattedDate = new Date(saved.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={saved.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenPlan(saved)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenPlan(saved);
                      }
                    }}
                    className="group relative border rounded-xl p-4 hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer bg-card shadow-sm space-y-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                          {saved.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Saved on {formattedDate}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(e, saved.id)}
                        className="p-1 rounded-full hover:bg-background transition-colors text-muted-foreground hover:text-rose-500"
                        title={saved.isLiked ? 'Unlike' : 'Like'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            saved.isLiked ? 'text-rose-500 fill-rose-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-primary" />
                        {days} Days
                      </span>
                      {saved.plan.estimatedCost && (
                        <span className="inline-flex items-center">
                          <Wallet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          {saved.plan.currency} {saved.plan.estimatedCost.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs hover:text-primary"
                          onClick={(e) => handleDownload(e, saved)}
                          title="Download PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(e, saved.id)}
                          title="Delete saved plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <span className="text-primary font-medium text-xs flex items-center group-hover:translate-x-0.5 transition-transform">
                        Open Plan
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
