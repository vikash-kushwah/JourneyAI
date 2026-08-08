'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FormattedMarkdownTextProps {
  text?: string;
  className?: string;
}

/**
 * Normalizes unstructured AI text output containing inline bullets (•), escaped newlines (\n),
 * and inline section headers (Header:) into clean, line-by-line Markdown.
 */
export function normalizeMarkdownText(rawText: string): string {
  if (!rawText) return '';

  return (
    rawText
      // Replace escaped newlines
      .replace(/\\n/g, '\n')
      // Ensure existing **Bold Titles:** that appear inline start on double newlines
      .replace(/([.!?])\s*(\*{2}[^*]+\*{2}:?)/g, '$1\n\n$2\n')
      // Convert inline bullet symbols (•, ●, ○, or ' - ') into fresh newline bullets
      .replace(/(?:\s*[•\u2022\u25cf\u25cb]\s*|\s+(?![\d,]+\s*-\s*[\d,]+)[-*]\s+)/g, '\n- ')
      // Ensure section headers ending with ':' that follow periods start on a new double line
      .replace(/([.!?])\s+([A-Z0-9][A-Za-z0-9\s/()&\-']{1,60}:)/g, '$1\n\n**$2**')
      // Bold section headers at line start if not already bolded
      .replace(/^([A-Z0-9][A-Za-z0-9\s/()&\-']{1,60}:)/gm, (match, header) => {
        return `**${header.trim()}**`;
      })
      // Clean up multiple asterisks and excess newlines
      .replace(/\*{4,}/g, '**')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

export function FormattedMarkdownText({ text, className }: FormattedMarkdownTextProps) {
  if (!text) return null;

  const normalizedText = normalizeMarkdownText(text);
  const paragraphs = normalizedText.split(/\n\s*\n/);

  return (
    <div className={cn('space-y-4 leading-relaxed text-foreground/90', className)}>
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        // Check if all lines in paragraph are bullet points
        const isBulletList =
          lines.length > 0 && lines.every((l) => l.startsWith('- ') || l.startsWith('* '));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              {lines.map((line, lIdx) => {
                const cleanContent = line.replace(/^[-*]\s+/, '');
                return <li key={lIdx}>{parseInlineMarkdown(cleanContent)}</li>;
              })}
            </ul>
          );
        }

        return (
          <div key={pIdx} className="space-y-2">
            {lines.map((line, lIdx) => {
              if (line.startsWith('- ') || line.startsWith('* ')) {
                const cleanContent = line.replace(/^[-*]\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 pl-1 text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span className="flex-1">{parseInlineMarkdown(cleanContent)}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="my-1">
                  {parseInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode {
  // Regex to split on **bold** syntax
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-foreground">
          {boldText}
        </strong>
      );
    }
    return part;
  });
}
