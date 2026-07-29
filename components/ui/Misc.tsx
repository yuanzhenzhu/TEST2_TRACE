'use client';

import { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';

export function MatFormField({
  label,
  width = 250,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  width?: number | string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative', width }}>
      <span
        style={{
          position: 'absolute',
          top: -8,
          left: 8,
          padding: '0 4px',
          background: '#FFF',
          fontSize: 12,
          lineHeight: '16px',
          letterSpacing: '0.4px',
          color: '#474554',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        {label}
      </span>
      <input
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: '100%',
          height: 40,
          border: '1px solid #77728D',
          borderRadius: 4,
          padding: '0 12px',
          fontSize: 14,
          fontFamily: 'inherit',
          color: '#18171C',
          boxSizing: 'border-box',
          background: '#FFF',
        }}
      />
    </div>
  );
}

export function MatCheckbox({ checked, onChange }: { checked?: boolean; onChange?: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange?.();
      }}
      aria-pressed={!!checked}
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 2,
          border: checked ? 'none' : '2px solid #77728D',
          background: checked ? '#2B1C74' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Icon name="Check" size={14} />}
      </span>
    </button>
  );
}

export function MatTabs({
  tabs,
  selected,
  onSelect,
}: {
  tabs: string[];
  selected: number;
  onSelect?: (i: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 48 }}>
      {tabs.map((t, i) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect?.(i)}
          style={{
            flex: '0 0 auto',
            padding: '0 24px',
            height: '100%',
            border: 'none',
            borderBottom: i === selected ? '2px solid #2B1C74' : '2px solid transparent',
            background: 'transparent',
            color: i === selected ? '#2B1C74' : '#474554',
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: '0.1px',
            cursor: 'pointer',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function Breadcrumb({
  items,
  showBack,
  onBack,
}: {
  items: string[];
  showBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, height: 32, flexShrink: 0 }}>
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: '#474554',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transform: 'rotate(90deg)',
          }}
        >
          <Icon name="ArrowDropDown" size={22} />
        </button>
      )}
      {items.map((item, i) => (
        <span
          key={item}
          style={{
            fontSize: 14,
            lineHeight: '20px',
            letterSpacing: '0.25px',
            color: i === items.length - 1 ? '#18171C' : '#474554',
            fontWeight: i === items.length - 1 ? 500 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {i > 0 && <span style={{ color: '#77728D' }}>/</span>}
          {item}
        </span>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  text,
  width = '100%',
  height = 168,
}: {
  icon: string;
  text: string;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: '#77728D',
        textAlign: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <Icon name={icon} size={40} />
      <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', maxWidth: 280 }}>{text}</span>
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Info: { bg: '#BAD5E8', fg: '#0B3A8C' },
  Success: { bg: '#D3E9D0', fg: '#1E4620' },
  Warning: { bg: '#FBE7B2', fg: '#5C4200' },
  Danger: { bg: '#F6D2D2', fg: '#7A1212' },
};

export function TagSemanticStatus({ status = 'Info', label }: { status?: string; label: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Info;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 24,
        padding: '0 10px',
        borderRadius: 4,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '16px',
        letterSpacing: '0.4px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

export function MatAvatar({ size = 'Small' }: { size?: string }) {
  const px = size === 'Small' ? 24 : 32;
  return (
    <span
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: '#DFDAF6',
        color: '#1E1452',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: px === 24 ? 12 : 14,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      U
    </span>
  );
}

export function MatDividerHorizontal({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, width: '100%', background: '#C8C7D1', ...style }} />;
}

export function PiecesNavbarItemGroup({ items, selected }: { items: string[]; selected: number }) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'row', gap: 4, height: 28, alignItems: 'center' }}>
      {items.map((item, i) => (
        <span
          key={item}
          style={{
            padding: '0 12px',
            height: 28,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.1px',
            color: i === selected ? '#FFF' : '#18171C',
            background: i === selected ? '#2B1C74' : 'transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {item}
        </span>
      ))}
    </nav>
  );
}

export function PiecesNavbarSelector({ value = 'ES' }: { value?: string }) {
  return (
    <span
      style={{
        width: 72,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: 100,
        fontSize: 14,
        color: '#18171C',
        cursor: 'pointer',
      }}
    >
      {value}
      <Icon name="ArrowDropDown" size={18} />
    </span>
  );
}

export function MatCellIndexColStatic({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        borderBottom: '1px solid #C8C7D1',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.4px',
        color: '#474554',
        boxSizing: 'border-box',
      }}
    >
      {label}
    </div>
  );
}

export function MatCellIndexColDynamic({
  label,
  sorted,
  onSort,
}: {
  label: string;
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSort}
      style={{
        width: '100%',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 8px',
        borderBottom: sorted ? '2px solid #2B1C74' : '1px solid #C8C7D1',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.4px',
        color: sorted ? '#2B1C74' : '#474554',
        boxSizing: 'border-box',
        background: 'transparent',
        border: 'none',
        borderBottomStyle: 'solid',
        cursor: 'pointer',
      }}
    >
      {label}
      {sorted && <Icon name={sorted === 'desc' ? 'ExpandMore' : 'ChevronUp'} size={16} />}
    </button>
  );
}

export function MatCellCellText({ text1 }: { text1: string }) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderBottom: '1px solid #C8C7D1',
        boxSizing: 'border-box',
        background: '#FFF',
        fontSize: 14,
        letterSpacing: '0.25px',
        color: '#18171C',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {text1}
    </div>
  );
}

export function PiecesNavlistItemNested({
  label,
  code,
  depth,
  state,
  expanded,
  trailing,
  onClick,
}: {
  label: string;
  code: string;
  depth: number;
  state: 'Selected' | 'Default';
  expanded?: boolean;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 60,
        borderRadius: 8,
        padding: `8px 12px 8px ${12 + depth * 20}px`,
        boxSizing: 'border-box',
        cursor: 'pointer',
        background: state === 'Selected' ? '#E5E3EC' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (state !== 'Selected') e.currentTarget.style.background = '#F4F3FA';
      }}
      onMouseLeave={(e) => {
        if (state !== 'Selected') e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ color: '#474554', display: 'flex', flexShrink: 0 }}>
        <Icon name={expanded ? 'ExpandMore' : 'ChevronRight'} size={20} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.1px',
            color: '#18171C',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 12, letterSpacing: '0.4px', color: '#474554' }}>{code}</span>
      </span>
      <span style={{ flexShrink: 0 }}>{trailing}</span>
    </div>
  );
}
