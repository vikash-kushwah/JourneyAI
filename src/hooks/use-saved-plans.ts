'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';

export interface SavedPlan {
  id: string;
  title: string;
  destination: string;
  createdAt: string;
  isLiked: boolean;
  plan: GenerateTravelPlanOutput;
}

const STORAGE_KEY = 'journeyai_saved_plans_v1';

// Generate a deterministic identifier for a plan to check if it's already saved
export function getPlanKey(plan: GenerateTravelPlanOutput, destination?: string): string {
  const title = plan.tripTitle || destination || 'trip';
  const daysCount = plan.dailyItinerary?.length || 0;
  const cost = plan.estimatedCost || 0;
  return `${title.toLowerCase().trim()}_${daysCount}_${cost}`;
}

export function useSavedPlans() {
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedPlan[];
        if (Array.isArray(parsed)) {
          setSavedPlans(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load saved plans from localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes to localStorage
  const persistPlans = useCallback((plans: SavedPlan[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      setSavedPlans(plans);
    } catch (err) {
      console.error('Failed to persist saved plans to localStorage:', err);
    }
  }, []);

  // Find saved plan by plan key
  const findPlanIndex = useCallback(
    (plan: GenerateTravelPlanOutput, destination?: string) => {
      const targetKey = getPlanKey(plan, destination);
      return savedPlans.findIndex(
        (sp) => getPlanKey(sp.plan, sp.destination) === targetKey || sp.id === targetKey,
      );
    },
    [savedPlans],
  );

  // Save or update plan
  const savePlan = useCallback(
    (plan: GenerateTravelPlanOutput, destination: string, isLiked: boolean = false): SavedPlan => {
      const existingIdx = findPlanIndex(plan, destination);
      const title = plan.tripTitle || `Trip to ${destination}`;
      const id = getPlanKey(plan, destination);

      if (existingIdx >= 0) {
        const existing = savedPlans[existingIdx];
        const updated: SavedPlan = {
          ...existing,
          title,
          plan,
          destination,
          isLiked: isLiked ?? existing.isLiked,
        };
        const next = [...savedPlans];
        next[existingIdx] = updated;
        persistPlans(next);
        return updated;
      }

      const newSavedPlan: SavedPlan = {
        id,
        title,
        destination,
        createdAt: new Date().toISOString(),
        isLiked,
        plan,
      };

      const next = [newSavedPlan, ...savedPlans];
      persistPlans(next);
      return newSavedPlan;
    },
    [savedPlans, findPlanIndex, persistPlans],
  );

  // Remove plan
  const removePlan = useCallback(
    (id: string) => {
      const next = savedPlans.filter((p) => p.id !== id);
      persistPlans(next);
    },
    [savedPlans, persistPlans],
  );

  // Toggle like by ID
  const toggleLikePlan = useCallback(
    (id: string) => {
      const next = savedPlans.map((p) => (p.id === id ? { ...p, isLiked: !p.isLiked } : p));
      persistPlans(next);
    },
    [savedPlans, persistPlans],
  );

  // Toggle like on active plan (saving it if not already saved)
  const toggleLikeCurrentPlan = useCallback(
    (plan: GenerateTravelPlanOutput, destination: string): boolean => {
      const existingIdx = findPlanIndex(plan, destination);
      if (existingIdx >= 0) {
        const currentLiked = savedPlans[existingIdx].isLiked;
        const next = [...savedPlans];
        next[existingIdx] = {
          ...next[existingIdx],
          isLiked: !currentLiked,
        };
        persistPlans(next);
        return !currentLiked;
      } else {
        // Automatically save with like=true
        savePlan(plan, destination, true);
        return true;
      }
    },
    [savedPlans, findPlanIndex, persistPlans, savePlan],
  );

  const isCurrentPlanSaved = useCallback(
    (plan: GenerateTravelPlanOutput, destination?: string) => {
      return findPlanIndex(plan, destination) >= 0;
    },
    [findPlanIndex],
  );

  const isCurrentPlanLiked = useCallback(
    (plan: GenerateTravelPlanOutput, destination?: string) => {
      const idx = findPlanIndex(plan, destination);
      return idx >= 0 ? savedPlans[idx].isLiked : false;
    },
    [findPlanIndex, savedPlans],
  );

  return {
    savedPlans,
    isLoaded,
    savePlan,
    removePlan,
    toggleLikePlan,
    toggleLikeCurrentPlan,
    isCurrentPlanSaved,
    isCurrentPlanLiked,
  };
}
