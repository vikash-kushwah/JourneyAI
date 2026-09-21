'use client';

import { useState } from 'react';
import type { GenerateLocalTravelSuggestionsOutput } from '@/ai/flows/generate-local-travel-suggestions';
import { useSavedLocal } from '@/hooks/use-saved-local';
import { exportLocalSuggestionsToPdf } from '@/lib/pdf-generator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Bookmark,
  BookmarkCheck,
  FileDown,
  Share2,
  Printer,
  Check,
  Loader2,
} from 'lucide-react';
import { encodeShareData } from '@/lib/share-utils';
import { ShareDialog } from '@/components/journey-ai/share-dialog';

interface LocalActionsBarProps {
  suggestions: GenerateLocalTravelSuggestionsOutput;
  locationName: string;
  onOpenSaved?: () => void;
}

export function LocalActionsBar({ suggestions, locationName, onOpenSaved }: LocalActionsBarProps) {
  const { saveLocal, toggleLikeCurrentLocal, isCurrentLocalSaved, isCurrentLocalLiked } =
    useSavedLocal();

  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [saveAnimation, setSaveAnimation] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const isSaved = isCurrentLocalSaved(suggestions, locationName);
  const isLiked = isCurrentLocalLiked(suggestions, locationName);

  const handleLike = () => {
    toggleLikeCurrentLocal(suggestions, locationName);
  };

  const handleSave = () => {
    saveLocal(suggestions, locationName, isLiked);
    setSaveAnimation(true);
    setTimeout(() => setSaveAnimation(false), 800);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsPdfGenerating(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      exportLocalSuggestionsToPdf(suggestions, locationName);
    } catch (err) {
      console.error('Failed to export local PDF:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const title = suggestions.title || `Local Spots in ${locationName}`;
  const spots =
    suggestions.suggestedItinerary
      ?.map(
        (s, idx) =>
          `${idx + 1}. ${s.name} (${s.category}${s.specificType ? ` - ${s.specificType}` : ''})`,
      )
      .join('\n') || '';

  const summaryText = `📍 ${title}\nLocation: ${locationName}\n\n${suggestions.introduction || ''}\n\nTop Recommended Spots:\n${spots}`;

  let fallbackHashUrl = typeof window !== 'undefined' ? window.location.href : '';
  try {
    const encoded = encodeShareData({ suggestions, location: locationName });
    if (encoded && typeof window !== 'undefined') {
      fallbackHashUrl = `${window.location.origin}${window.location.pathname}#local=${encoded}`;
    }
  } catch {
    // fallback
  }

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-xl shadow-sm print:hidden">
      {/* Left: Like & Save Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={isLiked ? 'default' : 'outline'}
          size="sm"
          onClick={handleLike}
          className={`transition-all duration-200 ${
            isLiked
              ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-sm'
              : 'hover:border-rose-300 hover:text-rose-500'
          }`}
          title={isLiked ? 'Liked! Click to unlike' : 'Like these suggestions'}
        >
          <Heart
            className={`w-4 h-4 mr-1.5 transition-transform ${
              isLiked ? 'fill-white scale-110' : ''
            }`}
          />
          {isLiked ? 'Liked' : 'Like'}
        </Button>

        <Button
          variant={isSaved ? 'secondary' : 'outline'}
          size="sm"
          onClick={handleSave}
          className={`transition-all duration-200 ${
            saveAnimation ? 'scale-105 border-primary' : ''
          }`}
          title={isSaved ? 'Guide saved in browser storage' : 'Save guide to your library'}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="w-4 h-4 mr-1.5 text-primary" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4 mr-1.5" />
              <span>Save Guide</span>
            </>
          )}
        </Button>

        {isSaved && onOpenSaved && (
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-secondary/60 text-xs hidden sm:inline-flex"
            onClick={onOpenSaved}
          >
            View in Saved
          </Badge>
        )}
      </div>

      {/* Right: PDF, Share, Print */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={isPdfGenerating}
          className="hover:bg-primary/5 hover:text-primary transition-colors"
          title="Download formatted PDF guide"
        >
          {isPdfGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-1.5" />
              PDF
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="hover:bg-primary/5 hover:text-primary"
          title="Share local guide via WhatsApp, Link, etc."
        >
          <Share2 className="w-4 h-4 mr-1.5" />
          Share
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrint}
          className="hover:bg-primary/5 px-2.5"
          title="Print guide"
        >
          <Printer className="w-4 h-4" />
        </Button>
      </div>

      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        title={title}
        summary={summaryText}
        type="local"
        destinationOrLocation={locationName}
        data={suggestions}
        fallbackHashUrl={fallbackHashUrl}
      />
    </div>
  );
}
