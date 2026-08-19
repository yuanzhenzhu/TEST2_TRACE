'use client';

import { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';

const base: CSSProperties = {
  fontFamily: 'inherit',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '20px',
  letterSpacing: '0.1px',
  borderRadius: 100,
  border: 'none',
  cursor: 'pointer',
  height: 40,
  padding: '0 24px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
  transition: 'background 0.15s ease, opacity 0.15s ease',
};

export function MatButtonTonal({
  label,
  onClick,
  disabled,
  style,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        background: disabled ? '#E5E3EC' : '#DFDAF6',
        color: disabled ? '#8C899C' : '#170F3E',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {label}
    </button>
  );
}

export function MatButtonFilled({
  label,
  icon,
  onClick,
  disabled,
  style,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        background: disabled ? '#E5E3EC' : '#2B1C74',
        color: disabled ? '#8C899C' : '#FFF',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={18} />}
      {label}
    </button>
  );
}

export function MatButtonText({
  label,
  icon,
  onClick,
  style,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...base,
        background: 'transparent',
        color: '#2B1C74',
        padding: '0 12px',
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={18} />}
      {label}
    </button>
  );
}

export function MatButtonOutlined({
  label,
  icon,
  onClick,
  disabled,
  style,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        height: 32,
        padding: '0 16px',
        gap: 4,
        background: 'transparent',
        border: '1px solid #77728D',
        color: disabled ? '#B7B4C2' : '#77728D',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={18} />}
      {label}
    </button>
  );
}

export function MatButtonIcon({
  icon,
  onClick,
  title,
}: {
  icon: string;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title || icon}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        color: '#474554',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}
