'use client';

import { useState } from 'react';
import type { GenerateLocalTravelSuggestionsOutput } from '@/ai/flows/generate-local-travel-suggestions';
import { useSavedLocal, type SavedLocalExploration } from '@/hooks/use-saved-local';
import { exportLocalSuggestionsToPdf } from '@/lib/pdf-generator';
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
import { Heart, MapPin, Trash2, FileDown, ArrowRight, Search, Compass } from 'lucide-react';

interface SavedLocalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLocal: (suggestions: GenerateLocalTravelSuggestionsOutput, location: string) => void;
}

export function SavedLocalSheet({ open, onOpenChange, onSelectLocal }: SavedLocalSheetProps) {
  const { savedLocal, removeLocal, toggleLikeLocal } = useSavedLocal();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLikedOnly, setFilterLikedOnly] = useState(false);

  const filteredItems = savedLocal.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLiked = !filterLikedOnly || item.isLiked;
    return matchesSearch && matchesLiked;
  });

  const handleOpen = (saved: SavedLocalExploration) => {
    onSelectLocal(saved.suggestions, saved.location);
    onOpenChange(false);
  };

  const handleDownload = (e: React.MouseEvent, saved: SavedLocalExploration) => {
    e.stopPropagation();
    exportLocalSuggestionsToPdf(saved.suggestions, saved.location);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeLocal(id);
  };

  const handleToggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleLikeLocal(id);
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
              <Compass className="w-5 h-5 text-primary" />
              <SheetTitle className="text-xl font-headline">Saved Explorations</SheetTitle>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {savedLocal.length} {savedLocal.length === 1 ? 'guide' : 'guides'}
            </Badge>
          </div>
          <SheetDescription className="text-sm">
            Access, export, and revisit your saved local guides and favorite spots.
          </SheetDescription>

          {savedLocal.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search location or guide title..."
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
                    className={`w-3.5 h-3.5 mr-1 ${
                      filterLikedOnly ? 'fill-white' : 'text-rose-500'
                    }`}
                  />
                  Liked Guides Only
                </Button>
              </div>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          {savedLocal.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Compass className="w-6 h-6" />
              </div>
              <p className="font-medium text-foreground text-sm">No saved guides yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Explore local activities and click &quot;Save Guide&quot; or &quot;Like&quot; to
                bookmark recommendations.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No local guides match your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((saved) => {
                const spotsCount = saved.suggestions.suggestedItinerary?.length || 0;
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
                    onClick={() => handleOpen(saved)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpen(saved);
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

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-primary" />
                        {saved.location}
                      </span>
                      <span>•</span>
                      <span>{spotsCount} Recommended Spots</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs hover:text-primary"
                          onClick={(e) => handleDownload(e, saved)}
                          title="Download PDF Guide"
                        >
                          <FileDown className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(e, saved.id)}
                          title="Delete saved guide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <span className="text-primary font-medium text-xs flex items-center group-hover:translate-x-0.5 transition-transform">
                        Open Guide
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
