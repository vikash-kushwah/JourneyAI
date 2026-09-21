'use client';

import { useState } from 'react';
import type { GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';
import { useSavedPlans } from '@/hooks/use-saved-plans';
import { exportPlanToPdf } from '@/lib/pdf-generator';
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
  Calendar,
} from 'lucide-react';
import { encodeShareData } from '@/lib/share-utils';

interface PlanActionsBarProps {
  plan: GenerateTravelPlanOutput;
  destinationName: string;
  onOpenSavedPlans?: () => void;
}

export function PlanActionsBar({ plan, destinationName, onOpenSavedPlans }: PlanActionsBarProps) {
  const { savePlan, toggleLikeCurrentPlan, isCurrentPlanSaved, isCurrentPlanLiked } =
    useSavedPlans();

  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveAnimation, setSaveAnimation] = useState(false);

  const isSaved = isCurrentPlanSaved(plan, destinationName);
  const isLiked = isCurrentPlanLiked(plan, destinationName);

  const handleLike = () => {
    toggleLikeCurrentPlan(plan, destinationName);
  };

  const handleSave = () => {
    savePlan(plan, destinationName, isLiked);
    setSaveAnimation(true);
    setTimeout(() => setSaveAnimation(false), 800);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsPdfGenerating(true);
      // Allow UI thread to update before heavy jsPDF rendering
      await new Promise((resolve) => setTimeout(resolve, 50));
      exportPlanToPdf(plan, destinationName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleShare = async () => {
    const title = plan.tripTitle || `Trip to ${destinationName}`;
    const days = plan.dailyItinerary?.length || 0;
    const costText = plan.estimatedCost
      ? `\nEst. Budget: ${plan.currency} ${plan.estimatedCost.toLocaleString()}`
      : '';

    const dayHighlights = plan.dailyItinerary
      ?.slice(0, 5)
      .map((d) => `• Day ${d.day}: ${d.theme || d.date || 'Activities'}`)
      .join('\n');
    const highlightsSection = dayHighlights ? `\n\nHighlights:\n${dayHighlights}` : '';

    let shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      const encoded = encodeShareData({ plan, destination: destinationName });
      if (encoded && typeof window !== 'undefined') {
        shareUrl = `${window.location.origin}${window.location.pathname}#plan=${encoded}`;
      }
    } catch {
      // fallback to current url
    }

    const fullMessage = `✈️ ${title} (${days} Days in ${destinationName})${costText}\n\n${plan.overallSummary || ''}${highlightsSection}\n\n🔗 View Full Interactive Plan:\n${shareUrl}`;

    // 1. Try native device share dialog
    // IMPORTANT: Concatenate the link directly inside 'text' instead of passing 'url' separately.
    // When both 'text' and 'url' are provided, apps like WhatsApp/iMessage discard the text and only share the url.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: fullMessage,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User canceled share
          return;
        }
      }
    }

    // 2. Fallback to clipboard copy
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Download simple standard .ics file for calendar apps
  const handleCalendarExport = () => {
    if (!plan.dailyItinerary || plan.dailyItinerary.length === 0) return;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JourneyAI//Travel Planner//EN',
      'CALSCALE:GREGORIAN',
    ];

    plan.dailyItinerary.forEach((day) => {
      const dateStr = day.date ? day.date.replace(/-/g, '') : '';
      if (!dateStr) return;

      const summary = `Day ${day.day}: ${day.theme || destinationName}`;
      const morningNames = day.morningActivities?.map((a) => a.name).join(', ') || '';
      const afternoonNames = day.afternoonActivities?.map((a) => a.name).join(', ') || '';
      const eveningNames = day.eveningActivities?.map((a) => a.name).join(', ') || '';
      const desc = `Morning: ${morningNames} | Afternoon: ${afternoonNames} | Evening: ${eveningNames}`;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:journeyai-${day.day}-${dateStr}@journeyai.app`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}Z`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${desc}`,
        `LOCATION:${destinationName}`,
        'END:VEVENT',
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${destinationName.replace(/\s+/g, '_')}_Itinerary.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          title={isLiked ? 'Liked! Click to unlike' : 'Like this plan'}
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
          title={isSaved ? 'Plan saved in browser storage' : 'Save plan to your library'}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="w-4 h-4 mr-1.5 text-primary" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4 mr-1.5" />
              <span>Save Plan</span>
            </>
          )}
        </Button>

        {isSaved && onOpenSavedPlans && (
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-secondary/60 text-xs hidden sm:inline-flex"
            onClick={onOpenSavedPlans}
          >
            View in Saved
          </Badge>
        )}
      </div>

      {/* Right: Export & Utility Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={isPdfGenerating}
          className="hover:bg-primary/5 hover:text-primary transition-colors"
          title="Download formatted PDF travel document"
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
          onClick={handleCalendarExport}
          className="hover:bg-primary/5 hidden sm:inline-flex"
          title="Export days into Calendar (.ics) for Google/Apple Calendar"
        >
          <Calendar className="w-4 h-4 mr-1.5" />
          Calendar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="hover:bg-primary/5"
          title="Copy itinerary summary to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-1.5" />
              Share
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrint}
          className="hover:bg-primary/5 px-2.5"
          title="Print itinerary"
        >
          <Printer className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
