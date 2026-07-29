'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export function MatSelect({
  label,
  value,
  options,
  onSelect,
  width = 250,
  disabled,
}: {
  label: string;
  value?: string;
  options: string[];
  onSelect?: (v: string) => void;
  width?: number | string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const hasValue = !!value && value !== 'Seleccionar';

  return (
    <div ref={ref} style={{ position: 'relative', width, flexShrink: width === '100%' ? undefined : 0 }}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          position: 'relative',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          border: '1px solid #77728D',
          borderRadius: 4,
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#F0F0F4' : '#FFF',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: -8,
            left: 8,
            padding: '0 4px',
            background: disabled ? '#F0F0F4' : '#FFF',
            fontSize: 12,
            lineHeight: '16px',
            letterSpacing: '0.4px',
            color: '#474554',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 14,
            lineHeight: '20px',
            letterSpacing: '0.25px',
            color: hasValue ? '#18171C' : '#77728D',
          }}
        >
          {hasValue ? value : 'Seleccionar'}
        </span>
        <span style={{ color: '#474554', display: 'flex', flexShrink: 0 }}>
          <Icon name="ArrowDropDown" size={20} />
        </span>
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 0',
            borderRadius: 4,
            background: '#FFF',
            boxShadow: '0 4px 16px rgba(24,23,28,0.18)',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onSelect?.(opt);
                setOpen(false);
              }}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: '20px',
                letterSpacing: '0.25px',
                color: '#18171C',
                background: opt === value ? '#F3F2F7' : 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F2F7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = opt === value ? '#F3F2F7' : 'transparent')}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
