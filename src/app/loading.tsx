import { LoadingSpinner } from '@/components/journey-ai/loading-spinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-8">
      <div className="p-8 bg-card rounded-2xl shadow-2xl border flex flex-col items-center gap-4 max-w-md w-full text-center">
        <LoadingSpinner text="Loading JourneyAI..." size={64} />
        <p className="text-muted-foreground text-sm animate-pulse">
          Preparing your personalized AI travel planner...
        </p>
      </div>
    </div>
  );
}
