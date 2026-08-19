'use client';

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  X,
  Calendar,
  Info,
  Check,
  Minus,
  Settings,
  Share2,
  Barcode,
  Search,
  Plus,
  TrendingUp,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  ArrowDropDown: ChevronDown,
  ChevronRight: ChevronRight,
  ExpandMore: ChevronDown,
  ChevronUp: ChevronUp,
  Close: X,
  CalendarMonth: Calendar,
  Info: Info,
  Check: Check,
  Remove: Minus,
  Settings: Settings,
  AccountTree: Share2,
  Barcode: Barcode,
  Search: Search,
  Add: Plus,
  TrendingUp: TrendingUp,
  Tune: SlidersHorizontal,
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const Cmp = MAP[name] || Info;
  return <Cmp size={size} strokeWidth={2} aria-hidden focusable={false} style={{ display: 'block' }} />;
}
