'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Share2,
  Check,
  Copy,
  MessageCircle,
  Mail,
  Send,
  Loader2,
  Smartphone,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  summary: string;
  type: 'plan' | 'local';
  destinationOrLocation: string;
  data: unknown;
  fallbackHashUrl: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  title,
  summary,
  type,
  destinationOrLocation,
  data,
  fallbackHashUrl,
}: ShareDialogProps) {
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalhost(
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      );
    }
  }, []);

  // Generate short link on dialog open
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    async function createShortLink() {
      try {
        setIsGeneratingShortUrl(true);
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            destination: type === 'plan' ? destinationOrLocation : undefined,
            location: type === 'local' ? destinationOrLocation : undefined,
            data,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.id && isMounted) {
            const path = type === 'local' ? '/local-search' : '';
            const generated = `${window.location.origin}${path}?p=${json.id}`;
            setShortUrl(generated);
            return;
          }
        }
      } catch (err) {
        console.warn('Short link generation failed, using hash URL fallback:', err);
      } finally {
        if (isMounted) {
          setIsGeneratingShortUrl(false);
        }
      }

      // Fallback to hash URL if short link API fails
      if (isMounted) {
        setShortUrl(fallbackHashUrl);
      }
    }

    createShortLink();
    return () => {
      isMounted = false;
    };
  }, [open, type, destinationOrLocation, data, fallbackHashUrl]);

  const activeUrl = shortUrl || fallbackHashUrl;

  const buildWhatsAppMessage = () => {
    return `✈️ *${title}*\n\n${summary}\n\n🔗 *View Interactive Plan:* ${activeUrl}`;
  };

  // WhatsApp Universal Share (opens app on mobile, or redirects to WhatsApp Web on PC)
  const handleWhatsAppShare = () => {
    const message = buildWhatsAppMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // WhatsApp Web directly (for desktop users preferring browser tab)
  const handleWhatsAppWebShare = () => {
    const message = buildWhatsAppMessage();
    const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Telegram share
  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(activeUrl)}&text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Email share
  const handleEmailShare = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${summary}\n\nView Full Plan: ${activeUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Copy Link
  const handleCopyLink = async () => {
    if (navigator.clipboard && activeUrl) {
      try {
        await navigator.clipboard.writeText(activeUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  // Copy Full Text
  const handleCopyFullText = async () => {
    const fullText = `${summary}\n\n🔗 Link: ${activeUrl}`;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullText);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2500);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  // Native Device Share (Mobile Sheet)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title,
          text: `${summary}\n\n🔗 View Plan: ${activeUrl}`,
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl font-headline">Share Travel Plan</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Share this itinerary directly to WhatsApp, copy the link, or export details to your
            travel companions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Localhost awareness alert */}
          {isLocalhost && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Localhost Notice: </span>
                  Links created on{' '}
                  <code className="font-mono bg-amber-200/50 dark:bg-amber-900/50 px-1 rounded">
                    localhost
                  </code>{' '}
                  only open on this computer. Once deployed to Railway, shared links will open for
                  anyone worldwide.
                </div>
              </div>
            </div>
          )}

          {/* Direct WhatsApp Share Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={isGeneratingShortUrl}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 h-11 text-sm shadow-sm flex items-center justify-center gap-2"
            >
              {isGeneratingShortUrl ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5 fill-white" />
              )}
              Share on WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleWhatsAppWebShare}
              disabled={isGeneratingShortUrl}
              className="w-full border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium py-2.5 h-11 text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              WhatsApp Web
            </Button>
          </div>

          {/* Social / Email Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleTelegramShare}
              className="text-xs h-9 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300"
            >
              <Send className="w-4 h-4 mr-1.5 text-sky-500" />
              Telegram
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleEmailShare}
              className="text-xs h-9 hover:bg-slate-100"
            >
              <Mail className="w-4 h-4 mr-1.5 text-slate-600" />
              Email
            </Button>
          </div>

          {/* Copy Direct Link Section */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="share-link-input" className="text-xs font-medium text-muted-foreground">
              Direct Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="share-link-input"
                  readOnly
                  value={isGeneratingShortUrl ? 'Generating short link...' : activeUrl}
                  className="text-xs pr-8 font-mono bg-secondary/30 truncate select-all"
                />
                {isGeneratingShortUrl && (
                  <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                disabled={isGeneratingShortUrl}
                className="text-xs shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Copy Full Itinerary Text */}
          <div className="pt-2 border-t flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyFullText}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Full Summary Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Full Text Summary
                </>
              )}
            </Button>

            {canNativeShare && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNativeShare}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                Open Device Share Menu
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
