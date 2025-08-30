'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Calendar, 
  Camera, 
  Trophy 
} from 'lucide-react';

const bottomNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/exercises', icon: Dumbbell, label: 'Exercises' },
  { href: '/workouts', icon: Calendar, label: 'Workouts' },
  { href: '/progress/photos', icon: Camera, label: 'Progress' },
  { href: '/challenges', icon: Trophy, label: 'Challenges' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around py-2">
        {bottomNavItems.map((item) => {
          const isActive = item.href === '/progress/photos' 
            ? pathname.startsWith('/progress')
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
