'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface NavButtonProps {
  href: string;
  children: ReactNode;
  icon: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export function NavButton({
  href,
  children,
  icon,
  variant = 'secondary',
  className,
}: NavButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(href);
  };

  return (
    <Button
      variant={variant}
      size="lg"
      onClick={handleClick}
      disabled={isNavigating}
      className={className}
    >
      {isNavigating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-accent" />
          Loading page...
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
}
