'use client';

import type { ComponentType, CSSProperties } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
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
  ArrowLeftRight,
  RefreshCw,
  ArrowRight,
  Ban,
  MoreVertical,
  Trash2,
  Eye,
  TrainFront,
  Warehouse,
  MoveRight,
  PackagePlus,
  PackageMinus,
  Download,
  Filter,
  ChevronsDownUp,
  List,
  Component,
  type LucideIcon,
} from 'lucide-react';

function Widgets({ size = 20, style }: { size?: number | string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable={false} style={style}>
      <path
        d="M16.66 4.52043L19.49 7.35043L16.66 10.1804L13.83 7.35043L16.66 4.52043ZM9 5.00043V9.00043H5V5.00043H9ZM19 15.0004V19.0004H15V15.0004H19ZM9 15.0004V19.0004H5V15.0004H9ZM16.66 1.69043L11 7.34043L16.66 13.0004L22.32 7.34043L16.66 1.69043ZM11 3.00043H3V11.0004H11V3.00043ZM21 13.0004H13V21.0004H21V13.0004ZM11 13.0004H3V21.0004H11V13.0004Z"
        fill="currentColor"
      />
    </svg>
  );
}

const MAP: Record<string, ComponentType<any>> = {
  ArrowDropDown: ChevronDown,
  ChevronRight: ChevronRight,
  ChevronLeft: ChevronLeft,
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
  SwapHoriz: ArrowLeftRight,
  Cycle: RefreshCw,
  ArrowRight: ArrowRight,
  Block: Ban,
  MoreVert: MoreVertical,
  Delete: Trash2,
  View: Eye,
  Train: TrainFront,
  Warehouse: Warehouse,
  MoveRight: MoveRight,
  AssemblyOn: PackagePlus,
  AssemblyOff: PackageMinus,
  Download: Download,
  Filter: Filter,
  UnfoldLess: ChevronsDownUp,
  List: List,
  Component: Component,
  Widgets: Widgets,
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const Cmp = MAP[name] || Info;
  return <Cmp size={size} strokeWidth={2} aria-hidden focusable={false} style={{ display: 'block' }} />;
}
