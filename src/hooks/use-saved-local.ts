'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GenerateLocalTravelSuggestionsOutput } from '@/ai/flows/generate-local-travel-suggestions';

export interface SavedLocalExploration {
  id: string;
  title: string;
  location: string;
  createdAt: string;
  isLiked: boolean;
  suggestions: GenerateLocalTravelSuggestionsOutput;
}

const STORAGE_KEY = 'journeyai_saved_local_v1';

export function getLocalKey(
  suggestions: GenerateLocalTravelSuggestionsOutput,
  location?: string,
): string {
  const title = suggestions.title || location || 'local';
  const spotsCount = suggestions.suggestedItinerary?.length || 0;
  return `local_${title.toLowerCase().trim()}_${spotsCount}`;
}

export function useSavedLocal() {
  const [savedLocal, setSavedLocal] = useState<SavedLocalExploration[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedLocalExploration[];
        if (Array.isArray(parsed)) {
          setSavedLocal(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load saved local explorations from localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const persistLocal = useCallback((items: SavedLocalExploration[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setSavedLocal(items);
    } catch (err) {
      console.error('Failed to persist saved local explorations:', err);
    }
  }, []);

  const findIndex = useCallback(
    (suggestions: GenerateLocalTravelSuggestionsOutput, location?: string) => {
      const targetKey = getLocalKey(suggestions, location);
      return savedLocal.findIndex(
        (sl) => getLocalKey(sl.suggestions, sl.location) === targetKey || sl.id === targetKey,
      );
    },
    [savedLocal],
  );

  const saveLocal = useCallback(
    (
      suggestions: GenerateLocalTravelSuggestionsOutput,
      location: string,
      isLiked: boolean = false,
    ): SavedLocalExploration => {
      const existingIdx = findIndex(suggestions, location);
      const title = suggestions.title || `Local Spots in ${location}`;
      const id = getLocalKey(suggestions, location);

      if (existingIdx >= 0) {
        const existing = savedLocal[existingIdx];
        const updated: SavedLocalExploration = {
          ...existing,
          title,
          location,
          suggestions,
          isLiked: isLiked ?? existing.isLiked,
        };
        const next = [...savedLocal];
        next[existingIdx] = updated;
        persistLocal(next);
        return updated;
      }

      const newItem: SavedLocalExploration = {
        id,
        title,
        location,
        createdAt: new Date().toISOString(),
        isLiked,
        suggestions,
      };

      const next = [newItem, ...savedLocal];
      persistLocal(next);
      return newItem;
    },
    [savedLocal, findIndex, persistLocal],
  );

  const removeLocal = useCallback(
    (id: string) => {
      const next = savedLocal.filter((item) => item.id !== id);
      persistLocal(next);
    },
    [savedLocal, persistLocal],
  );

  const toggleLikeLocal = useCallback(
    (id: string) => {
      const next = savedLocal.map((item) =>
        item.id === id ? { ...item, isLiked: !item.isLiked } : item,
      );
      persistLocal(next);
    },
    [savedLocal, persistLocal],
  );

  const toggleLikeCurrentLocal = useCallback(
    (suggestions: GenerateLocalTravelSuggestionsOutput, location: string): boolean => {
      const existingIdx = findIndex(suggestions, location);
      if (existingIdx >= 0) {
        const currentLiked = savedLocal[existingIdx].isLiked;
        const next = [...savedLocal];
        next[existingIdx] = {
          ...next[existingIdx],
          isLiked: !currentLiked,
        };
        persistLocal(next);
        return !currentLiked;
      } else {
        saveLocal(suggestions, location, true);
        return true;
      }
    },
    [savedLocal, findIndex, persistLocal, saveLocal],
  );

  const isCurrentLocalSaved = useCallback(
    (suggestions: GenerateLocalTravelSuggestionsOutput, location?: string) => {
      return findIndex(suggestions, location) >= 0;
    },
    [findIndex],
  );

  const isCurrentLocalLiked = useCallback(
    (suggestions: GenerateLocalTravelSuggestionsOutput, location?: string) => {
      const idx = findIndex(suggestions, location);
      return idx >= 0 ? savedLocal[idx].isLiked : false;
    },
    [findIndex, savedLocal],
  );

  return {
    savedLocal,
    isLoaded,
    saveLocal,
    removeLocal,
    toggleLikeLocal,
    toggleLikeCurrentLocal,
    isCurrentLocalSaved,
    isCurrentLocalLiked,
  };
}
