'use client';

import Image from 'next/image';
import { MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Icon } from './ui/Icon';
import { MatButtonFilled, MatButtonIcon, MatButtonOutlined, MatButtonText, MatButtonTonal } from './ui/Buttons';
import { MatSelect } from './ui/MatSelect';
import {
  Breadcrumb,
  EmptyState,
  MatAvatar,
  MatCellCellText,
  MatCellIndexColDynamic,
  MatCellIndexColStatic,
  MatCheckbox,
  MatDividerHorizontal,
  MatFormField,
  MatTabs,
  PiecesNavbarItemGroup,
  PiecesNavbarSelector,
  PiecesNavlistItemNested,
  TagSemanticStatus,
} from './ui/Misc';
import {
  ALMACENES,
  ALMACEN_TIPOS,
  ANCESTORS,
  AlmacenItem,
  Cell,
  FLEETS,
  HIJOS,
  MOVIMIENTOS,
  SING,
  TIPOS_COMPONENTE,
  TIPOS_OPERACION,
  Tipo,
  TreeNode,
  almacenHistorial,
  find,
  hijoRows as buildHijoRows,
  historial as buildHistorial,
  id as idCell,
  km as kmCell,
  txt as txtCell,
} from '@/lib/data';

interface AppState {
  screen: 'consulta' | 'flota' | 'movimientos' | 'detalleMovimiento' | 'almacen';
  expanded: Record<string, boolean>;
  selected: string | null;
  tab: number;
  treeTab: number;
  typeOpen: Record<string, boolean>;
  checkedIds: Record<string, boolean>;
  flota: string;
  unidad: string | null;
  applied: boolean;
  dUnidad: string;
  flotaSearch: string;
  flotaCtxExpanded: Record<string, boolean>;
  flotaFecha: string;
  hijo: string;
  chipsActivo: string[];
  chipsPos: string[];
  appliedActivo: string[];
  appliedPos: string[];
  activoMenuOpen: boolean;
  posMenuOpen: boolean;
  sortDesc: boolean;
  movUnidad: string;
  movTipoComponente: string;
  movTipoOperacion: string;
  movBuscarId: string;
  movMenuOpenId: string | null;
  detalleRowId: string | null;
  soloIntercambiados: boolean;
  almacen: string;
  dAlmacen: string;
  almacenApplied: boolean;
  almacenExpandedTipos: Record<string, boolean>;
  almacenCheckedIds: Record<string, boolean>;
  almacenSelectedId: string | null;
  almacenSearch: string;
  almacenFilter: { conHijos: boolean; sinHijos: boolean; conPadre: boolean; sinPadre: boolean };
  almacenExpandedIds: Record<string, boolean>;
}

const initialState: AppState = {
  screen: 'consulta',
  expanded: {},
  selected: null,
  tab: 0,
  treeTab: 0,
  typeOpen: {},
  checkedIds: {},
  flota: 'Urbos 100',
  unidad: null,
  applied: false,
  dUnidad: '',
  flotaSearch: '',
  flotaCtxExpanded: {},
  flotaFecha: '',
  hijo: 'Ruedas',
  chipsActivo: [],
  chipsPos: [],
  appliedActivo: [],
  appliedPos: [],
  activoMenuOpen: false,
  posMenuOpen: false,
  sortDesc: true,
  movUnidad: '',
  movTipoComponente: '',
  movTipoOperacion: '',
  movBuscarId: '',
  movMenuOpenId: null,
  detalleRowId: null,
  soloIntercambiados: false,
  almacen: 'Taller Stock Urbos 100',
  dAlmacen: '',
  almacenApplied: false,
  almacenExpandedTipos: {},
  almacenCheckedIds: {},
  almacenSelectedId: null,
  almacenSearch: '',
  almacenFilter: { conHijos: true, sinHijos: true, conPadre: true, sinPadre: true },
  almacenExpandedIds: {},
};

const TIPO_ALIASES: Record<string, Tipo> = {
  unidad: 'Unidad',
  unidades: 'Unidad',
  coche: 'Coche',
  coches: 'Coche',
  bogie: 'Bogie',
  bogies: 'Bogie',
  eje: 'Eje',
  ejes: 'Eje',
  rueda: 'Rueda',
  ruedas: 'Rueda',
  reductora: 'Reductora',
  reductoras: 'Reductora',
  reductor: 'Reductora',
  reductores: 'Reductora',
};

function parseSearchTerms(raw: string): string[] {
  return raw
    .split(/,| y /i)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function nodeMatchesTerm(n: { tipo: Tipo; label: string; code: string }, term: string): boolean {
  const parts = term.split(/\s+/);
  if (parts.length === 2 && TIPO_ALIASES[parts[0]] && /^\d+$/.test(parts[1])) {
    if (n.tipo !== TIPO_ALIASES[parts[0]]) return false;
    const numMatch = n.label.match(/(\d+)\s*$/);
    return !!numMatch && numMatch[1] === parts[1];
  }
  if (TIPO_ALIASES[term]) return n.tipo === TIPO_ALIASES[term];
  return n.label.toLowerCase().includes(term) || n.code.toLowerCase().includes(term);
}

function nodeMatchesSearch(n: { tipo: Tipo; label: string; code: string }, terms: string[]): boolean {
  if (terms.length === 0) return true;
  return terms.some((t) => nodeMatchesTerm(n, t));
}

function PillSelect({
  icon,
  value,
  options,
  onSelect,
}: {
  icon: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc as unknown as EventListener);
    return () => document.removeEventListener('click', onDoc as unknown as EventListener);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 32,
          padding: '0 12px',
          borderRadius: 100,
          border: open ? '1px solid #2B1C74' : '1px solid #C8C7D1',
          background: open ? '#DFDAF6' : 'transparent',
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: '0.1px',
          color: open ? '#2B1C74' : '#474554',
          whiteSpace: 'nowrap',
        }}
      >
        <Icon name={icon} size={16} />
        {value}
        <Icon name="ArrowDropDown" size={16} />
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 0',
            borderRadius: 8,
            background: '#FFF',
            boxShadow: '0 4px 16px rgba(24,23,28,0.18)',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onSelect(opt);
                setOpen(false);
              }}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: '20px',
                letterSpacing: '0.25px',
                color: '#18171C',
                whiteSpace: 'nowrap',
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

function Table({
  cols,
  rows,
  sortIdx,
  sortDesc,
  onSort,
  minWidth,
}: {
  cols: { label: string; sortableActive?: boolean }[];
  rows: { id: string; cells: Cell[] }[];
  sortIdx?: number;
  sortDesc?: boolean;
  onSort?: () => void;
  minWidth?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth }}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {cols.map((col, i) => (
          <div key={i} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', overflow: 'hidden' }}>
            {sortIdx === i ? (
              <MatCellIndexColDynamic label={col.label} sorted={sortDesc ? 'desc' : 'asc'} onSort={onSort} />
            ) : (
              <MatCellIndexColStatic label={col.label} />
            )}
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.id} style={{ display: 'flex', flexDirection: 'row' }}>
          {row.cells.map((c, ci) => (
            <div key={ci} style={{ flex: c.flex || '1 1 0', minWidth: 0, display: 'flex', overflow: 'hidden' }}>
              {c.isId && (
                <div
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderBottom: '1px solid #C8C7D1',
                    boxSizing: 'border-box',
                    background: '#FFF',
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      lineHeight: '20px',
                      letterSpacing: '0.25px',
                      color: '#18171C',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.text}
                  </span>
                  <span style={{ flexShrink: 0, color: '#474554', display: 'flex' }}>
                    <Icon name="Info" size={18} />
                  </span>
                </div>
              )}
              {c.isText && <MatCellCellText text1={c.text} />}
              {c.isTagKm && (
                <div
                  style={{
                    flex: '1 1 0',
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    borderBottom: '1px solid #C8C7D1',
                    boxSizing: 'border-box',
                    background: '#FFF',
                  }}
                >
                  <TagSemanticStatus status="Info" label={c.text} />
                  <span style={{ color: '#474554', display: 'flex' }}>
                    <Icon name="Info" size={18} />
                  </span>
                </div>
              )}
              {c.isTagBool && (
                <div
                  style={{
                    flex: '1 1 0',
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    borderBottom: '1px solid #C8C7D1',
                    boxSizing: 'border-box',
                    background: '#FFF',
                  }}
                >
                  <TagSemanticStatus status="Success" label={c.text} />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function OperationChip({ icons, label }: { icons: string[]; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, width: '100%' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          height: 24,
          padding: '4px 8px',
          borderRadius: 8,
          background: '#F0F0F4',
          color: '#1F1F1F',
          flexShrink: 0,
        }}
      >
        {icons.map((ic, i) => (
          <Icon key={i} name={ic} size={16} />
        ))}
      </span>
      <span
        title={label}
        style={{
          flex: '1 1 0',
          minWidth: 0,
          fontSize: 14,
          lineHeight: '20px',
          letterSpacing: '0.25px',
          color: '#18171C',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PositionPair({ items }: { items: { title: string; code: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 12, minWidth: 0, width: '100%' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0', minWidth: 0 }}>
          <span
            title={it.title}
            style={{
              fontSize: 14,
              lineHeight: '20px',
              letterSpacing: '0.25px',
              color: '#18171C',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {it.title}
          </span>
          <span
            title={it.code}
            style={{
              fontSize: 12,
              lineHeight: '16px',
              letterSpacing: '0.4px',
              color: '#18171C',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {it.code}
          </span>
        </div>
      ))}
    </div>
  );
}

interface DetailTag {
  label: string;
  bg: string;
  fg: string;
}

interface DetailRow {
  id: string;
  depth: number;
  label: string;
  code?: string;
  tags?: DetailTag[];
  expandIcon: 'ExpandMore' | 'ChevronRight' | null;
  highlighted?: boolean;
  extra?: string;
  km: string;
}

const TAG_ANTES: Omit<DetailTag, 'label'> = { bg: '#FECAC8', fg: '#320301' };
const TAG_DESPUES: Omit<DetailTag, 'label'> = { bg: '#BAEBCE', fg: '#474554' };

const UNIDAD_TREE: DetailRow[] = [
  { id: 'u1', depth: 0, label: 'Unidad 1', code: 'F462-U-001', expandIcon: 'ExpandMore', km: '259.245km' },
  { id: 'u1-c1', depth: 1, label: 'Coche 1', code: 'F462-U-001-C1', expandIcon: 'ExpandMore', km: '259.245km' },
  { id: 'u1-c1-b1', depth: 2, label: 'Bogie 1', code: 'F462-U-001-C1-B1', expandIcon: 'ExpandMore', km: '259.245km' },
  {
    id: 'u1-c1-b1-e1',
    depth: 3,
    label: 'Eje 1',
    tags: [
      { label: 'F462-U-001-C1-B1-E1', ...TAG_ANTES },
      { label: 'F878-U-541-C1-4585', ...TAG_DESPUES },
    ],
    expandIcon: 'ExpandMore',
    highlighted: true,
    extra: '3 activos',
    km: '259.245km',
  },
  {
    id: 'u1-c1-b1-e1-r1',
    depth: 4,
    label: 'Rueda1',
    tags: [
      { label: 'F878-U-541-C1-4585', ...TAG_ANTES },
      { label: 'F462-U-001-C1-B1-E1', ...TAG_DESPUES },
    ],
    expandIcon: null,
    highlighted: true,
    km: '259.245km',
  },
  {
    id: 'u1-c1-b1-e1-r2',
    depth: 4,
    label: 'Rueda 2',
    tags: [
      { label: 'F878-U-541-C1-4585', ...TAG_ANTES },
      { label: 'F462-U-001-C1-B1-E1', ...TAG_DESPUES },
    ],
    expandIcon: null,
    highlighted: true,
    km: '259.245km',
  },
  { id: 'u1-c1-b1-e2', depth: 3, label: 'Eje 2', code: 'F462-U-001-C1-B1-E2', expandIcon: 'ChevronRight', km: '259.245km' },
  { id: 'u1-c1-b2', depth: 2, label: 'Bogie 2', code: 'F462-U-001-C1-B1', expandIcon: 'ChevronRight', km: '259.245km' },
  { id: 'u1-c2', depth: 1, label: 'Coche 2', code: 'F462-U-001-C2', expandIcon: 'ChevronRight', km: '259.245km' },
  { id: 'u1-c3', depth: 1, label: 'Coche 3', code: 'F462-U-001-C3', expandIcon: 'ChevronRight', km: '259.245km' },
  { id: 'u1-c4', depth: 1, label: 'Coche 4', code: 'F462-U-001-C4', expandIcon: 'ChevronRight', km: '259.245km' },
  { id: 'u2', depth: 0, label: 'Unidad 2', code: 'F462-U001-C1', expandIcon: 'ChevronRight', km: '259.245km' },
  { id: 'u3', depth: 0, label: 'Unidad 3', code: 'F462-U001-C1', expandIcon: 'ChevronRight', km: '259.245km' },
];

const TALLER_TREE: DetailRow[] = [
  { id: 't-b1', depth: 2, label: 'Bogie 1', code: 'F462-U-001-C1-B1', expandIcon: 'ExpandMore', km: '259.245km' },
  {
    id: 't-b1-e1',
    depth: 3,
    label: 'Eje 1',
    tags: [
      { label: 'F878-U-541-C1-4585', ...TAG_ANTES },
      { label: 'F462-U-001-C1-B1-E1', ...TAG_DESPUES },
    ],
    expandIcon: 'ExpandMore',
    highlighted: true,
    extra: '3 activos',
    km: '259.245km',
  },
  {
    id: 't-b1-e1-r1',
    depth: 4,
    label: 'Rueda1',
    tags: [
      { label: 'F878-U-541-C1-4585', ...TAG_ANTES },
      { label: 'F462-U-001-C1-B1-E1', ...TAG_DESPUES },
    ],
    expandIcon: null,
    highlighted: true,
    km: '259.245km',
  },
  {
    id: 't-b1-e1-r2',
    depth: 4,
    label: 'Rueda 2',
    tags: [
      { label: 'F878-U-541-C1-4585', ...TAG_ANTES },
      { label: 'F462-U-001-C1-B1-E1', ...TAG_DESPUES },
    ],
    expandIcon: null,
    highlighted: true,
    km: '259.245km',
  },
  { id: 't-b1-e2', depth: 3, label: 'Eje 2', code: 'F462-U-001-C1-B1-E2', expandIcon: 'ChevronRight', km: '259.245km' },
];

function DetailTagPill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 24,
        padding: '0 12px',
        borderRadius: 8,
        background: bg,
        color: fg,
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

function DetailTreeRow({ row }: { row: DetailRow }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: row.tags ? 96 : 56,
        padding: `8px 16px 8px ${8 + row.depth * 16}px`,
        boxSizing: 'border-box',
        background: row.highlighted ? '#E4E2E8' : 'transparent',
      }}
    >
      <span style={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18171C' }}>
        {row.expandIcon && <Icon name={row.expandIcon} size={20} />}
      </span>
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontSize: 16,
            lineHeight: '24px',
            letterSpacing: '0.5px',
            color: '#170F3E',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={row.label}
        >
          {row.label}
        </span>
        {row.tags ? (
          <div style={{ display: 'flex', flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
            {row.tags.map((t, i) => (
              <DetailTagPill key={i} label={t.label} bg={t.bg} fg={t.fg} />
            ))}
          </div>
        ) : (
          <span
            style={{
              fontSize: 12,
              lineHeight: '16px',
              letterSpacing: '0.4px',
              color: '#474554',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={row.code}
          >
            {row.code}
          </span>
        )}
      </div>
      {row.extra && (
        <span
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            height: 24,
            padding: '0 12px',
            borderRadius: 8,
            background: '#F9F9FB',
            color: '#18171C',
            fontSize: 12,
            fontWeight: 500,
            lineHeight: '16px',
            letterSpacing: '0.4px',
            whiteSpace: 'nowrap',
          }}
        >
          {row.extra}
        </span>
      )}
      <span
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          height: 24,
          padding: '0 12px',
          borderRadius: 8,
          background: '#BAD5E8',
          color: '#0D324C',
          fontSize: 12,
          fontWeight: 500,
          lineHeight: '16px',
          letterSpacing: '0.4px',
          whiteSpace: 'nowrap',
        }}
      >
        {row.km}
      </span>
      <MatButtonIcon icon="Info" title="Más información" />
    </div>
  );
}

function SlideToggle({
  checked,
  onChange,
  label,
  locked,
  lockedTitle,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  locked?: boolean;
  lockedTitle?: string;
}) {
  return (
    <div
      onClick={onChange}
      title={locked ? lockedTitle : undefined}
      style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.6 : 1 }}
    >
      <span
        style={{
          width: 52,
          height: 32,
          flexShrink: 0,
          borderRadius: 100,
          background: checked ? '#2B1C74' : '#E4E2E8',
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          boxSizing: 'border-box',
          transition: 'background 0.15s ease',
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: checked ? '#FFF' : '#77728D',
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
            transition: 'transform 0.15s ease',
          }}
        />
      </span>
      <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', color: '#18171C' }}>{label}</span>
    </div>
  );
}

function AtributoChipField({
  label,
  chips,
  options,
  empty,
  menuOpen,
  chipColor,
  chipText,
  closeColor,
  onToggleChip,
  onToggleMenu,
}: {
  label: string;
  chips: string[];
  options: string[];
  empty: boolean;
  menuOpen: boolean;
  chipColor: string;
  chipText: string;
  closeColor: string;
  onToggleChip: (label: string) => void;
  onToggleMenu: () => void;
}) {
  return (
    <div style={{ position: 'relative', flex: '1 1 340px', maxWidth: 460 }}>
      <div
        style={{
          position: 'relative',
          minHeight: 56,
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '8px 12px',
          border: '1px solid #77728D',
          borderRadius: 4,
          boxSizing: 'border-box',
          cursor: 'pointer',
          background: '#FFF',
        }}
        onClick={onToggleMenu}
      >
        <span
          style={{
            position: 'absolute',
            top: -8,
            left: 12,
            padding: '0 4px',
            background: '#FFF',
            fontSize: 12,
            lineHeight: '16px',
            letterSpacing: '0.4px',
            color: '#474554',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        {empty && <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', color: '#77728D' }}>Seleccionar</span>}
        {chips.map((c) => (
          <span
            key={c}
            onClick={(e) => {
              e.stopPropagation();
              onToggleChip(c);
            }}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 8px 0 12px',
              borderRadius: 16,
              background: chipColor,
              color: chipText,
              fontSize: 14,
              lineHeight: '20px',
              letterSpacing: '0.25px',
              cursor: 'pointer',
            }}
          >
            {c}
            <span style={{ display: 'flex', color: closeColor }}>
              <Icon name="Close" size={18} />
            </span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#474554', display: 'flex' }}>
          <Icon name="ArrowDropDown" size={24} />
        </span>
      </div>
      {menuOpen && (
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
          }}
        >
          {options.map((o) => {
            const active = chips.indexOf(o) >= 0;
            return (
              <div
                key={o}
                onClick={() => onToggleChip(o)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: '20px',
                  letterSpacing: '0.25px',
                  color: '#18171C',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F2F7')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ display: 'flex', color: active ? closeColor : 'transparent' }}>
                  <Icon name={active ? 'Check' : 'Remove'} size={20} />
                </span>
                {o}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TrazabilidadApp() {
  const [s, setS] = useState<AppState>(initialState);
  const patch = (updater: Partial<AppState> | ((s: AppState) => Partial<AppState>)) =>
    setS((prev) => ({ ...prev, ...(typeof updater === 'function' ? updater(prev) : updater) }));

  const [clockNow, setClockNow] = useState<Date | null>(null);
  useEffect(() => {
    setClockNow(new Date());
  }, []);

  // ---- derived data (ported from renderVals / helper methods) ----
  const roots = FLEETS[s.flota] || [];
  const treeRoots = s.unidad && s.unidad !== 'Todos' ? roots.filter((n) => n.code === s.unidad) : roots;
  const sel = s.selected ? find(roots, s.selected) : null;
  const isFlota = s.screen === 'flota';
  const isConsulta = s.screen === 'consulta';
  const isMovimientos = s.screen === 'movimientos';
  const isDetalleMovimiento = s.screen === 'detalleMovimiento';
  const detalleRow = s.detalleRowId ? MOVIMIENTOS.find((r) => r.id === s.detalleRowId) || null : null;

  const isAlmacen = s.screen === 'almacen';
  const almacenData = ALMACENES[s.almacen];
  const almacenFilterFn = (it: AlmacenItem) => {
    const f = s.almacenFilter;
    const hijosOk = it.conHijos ? f.conHijos : f.sinHijos;
    const padreOk = it.conPadre ? f.conPadre : f.sinPadre;
    return hijosOk && padreOk;
  };
  const almacenAllFlat: AlmacenItem[] = ALMACEN_TIPOS.flatMap((t) => almacenData.items[t.tipo] || []);
  const almacenCheckedItems = almacenAllFlat.filter((it) => s.almacenCheckedIds[it.id]);
  const almacenMulti = almacenCheckedItems.length > 1;
  const almacenSel = !almacenMulti && s.almacenSelectedId ? almacenAllFlat.find((it) => it.id === s.almacenSelectedId) || null : null;
  const almacenFilterActive =
    !s.almacenFilter.conHijos || !s.almacenFilter.sinHijos || !s.almacenFilter.conPadre || !s.almacenFilter.sinPadre;
  const almacenSearchTerms = parseSearchTerms(s.almacenSearch);
  const almacenSearchActive = almacenSearchTerms.length > 0;
  const almacenAnyFilterActive = almacenFilterActive || almacenSearchActive;
  const isAlmacenTipoOpen = (tipo: string) =>
    almacenSearchActive ? s.almacenExpandedTipos[tipo] !== false : !!s.almacenExpandedTipos[tipo];
  const almacenVisibleTipos = ALMACEN_TIPOS.filter(
    (t) => (almacenData.items[t.tipo] || []).filter(almacenFilterFn).filter((it) => nodeMatchesSearch(it, almacenSearchTerms)).length > 0
  );
  const almacenAllExpanded = almacenVisibleTipos.every((t) => isAlmacenTipoOpen(t.tipo));

  const flotaSearchTerms = parseSearchTerms(s.flotaSearch);
  const flotaSearchActive = flotaSearchTerms.length > 0;

  const isExpanded = (id: string) => s.expanded[id] !== false;

  const flatten = (): TreeNode[] => {
    const out: TreeNode[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        out.push(n);
        if (n.children && n.children.length && isExpanded(n.id)) walk(n.children);
      }
    };
    walk(treeRoots);
    return out;
  };

  const treeRows = flatten().map((n) => ({
    id: n.id,
    label: n.label,
    code: n.code,
    depth: n.depth,
    state: (s.selected === n.id ? 'Selected' : 'Default') as 'Selected' | 'Default',
    expanded: isExpanded(n.id),
    trailing: <TagSemanticStatus status="Info" label={n.km} />,
    onClick: () => {
      patch((prev) => {
        const next: Partial<AppState> = { selected: n.id, tab: 0 };
        if (n.children && n.children.length) {
          next.expanded = { ...prev.expanded, [n.id]: !(prev.expanded[n.id] !== false) };
        }
        return next;
      });
    },
  }));

  const parentMap = new Map<string, TreeNode>();
  (function buildParentMap(nodes: TreeNode[]) {
    nodes.forEach((n) => {
      if (n.children) {
        n.children.forEach((c) => parentMap.set(c.id, n));
        buildParentMap(n.children);
      }
    });
  })(treeRoots);

  const flattenAll = (): TreeNode[] => {
    const out: TreeNode[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        out.push(n);
        if (n.children) walk(n.children);
      }
    };
    walk(treeRoots);
    return out;
  };

  type SearchRow = { key: string; node: TreeNode; dimmed: boolean; hasCtx: boolean; ctxExpanded: boolean; onClick?: () => void; onToggleCtx?: () => void };
  const searchRows: SearchRow[] = [];
  if (flotaSearchActive) {
    flattenAll().forEach((n) => {
      if (!nodeMatchesSearch(n, flotaSearchTerms)) return;
      const parent = parentMap.get(n.id);
      const hasCtx = !!parent || !!(n.children && n.children.length);
      const ctxExpanded = !!s.flotaCtxExpanded[n.id];
      searchRows.push({
        key: n.id,
        node: n,
        dimmed: false,
        hasCtx,
        ctxExpanded,
        onClick: () => patch({ selected: n.id, tab: 0 }),
        onToggleCtx: hasCtx
          ? () => patch((prev) => ({ flotaCtxExpanded: { ...prev.flotaCtxExpanded, [n.id]: !prev.flotaCtxExpanded[n.id] } }))
          : undefined,
      });
      if (ctxExpanded) {
        if (parent) searchRows.push({ key: n.id + '-parent', node: parent, dimmed: true, hasCtx: false, ctxExpanded: false });
        if (n.children && n.children.length) {
          n.children.forEach((c) => searchRows.push({ key: n.id + '-child-' + c.id, node: c, dimmed: true, hasCtx: false, ctxExpanded: false }));
        }
      }
    });
  }

  const typeGroups: Record<string, TreeNode[]> = { Unidad: [], Coche: [], Bogie: [], Eje: [], Rueda: [], Reductora: [] };
  (function walkTypes(nodes: TreeNode[]) {
    nodes.forEach((n) => {
      const t = n.tipo || 'Eje';
      if (typeGroups[t]) typeGroups[t].push(n);
      if (n.children) walkTypes(n.children);
    });
  })(treeRoots);

  type TypeRow = {
    id: string;
    label: string;
    isChild: boolean;
    chevron: string | null;
    checked: boolean;
    pos: string;
    unidad?: string;
    trailing: ReactNode;
    onClick?: () => void;
    onChevron?: (e: MouseEvent) => void;
    onCheck: () => void;
  };
  const flotaMultiUnidad = treeRoots.length > 1;
  const isTypeOpen = (t: string, open: Record<string, boolean>) => (flotaSearchActive ? open[t] !== false : !!open[t]);
  const typeRows: TypeRow[] = [];
  Object.keys(typeGroups).forEach((t) => {
    const list = typeGroups[t].filter((n) => nodeMatchesSearch(n, flotaSearchTerms));
    if (!list.length) return;
    const open = isTypeOpen(t, s.typeOpen);
    typeRows.push({
      id: 'g-' + t,
      label: t,
      isChild: false,
      chevron: open ? 'ExpandMore' : 'ChevronRight',
      checked: list.every((n) => s.checkedIds[n.id]),
      pos: '',
      trailing: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 24,
            height: 20,
            padding: '0 8px',
            borderRadius: 1000,
            background: '#F0F0F4',
            color: '#474554',
            fontSize: 12,
            lineHeight: '16px',
            letterSpacing: '0.4px',
          }}
        >
          {list.length}
        </span>
      ),
      onChevron: (e) => {
        e.stopPropagation();
        patch((prev) => ({ typeOpen: { ...prev.typeOpen, [t]: !prev.typeOpen[t] } }));
      },
      onCheck: () =>
        patch((prev) => {
          const all = list.every((n) => prev.checkedIds[n.id]);
          const next = { ...prev.checkedIds };
          list.forEach((n) => {
            if (all) delete next[n.id];
            else next[n.id] = true;
          });
          const enterMulti = Object.keys(prev.checkedIds).length <= 1 && Object.keys(next).length > 1;
          return {
            checkedIds: next,
            selected: all ? prev.selected : list[0].id,
            tab: enterMulti ? 0 : prev.tab,
            chipsActivo: enterMulti ? ['Kilómetros'] : prev.chipsActivo,
            appliedActivo: enterMulti ? ['Kilómetros'] : prev.appliedActivo,
          };
        }),
    });
    if (!open) return;
    list.forEach((n) => {
      typeRows.push({
        id: n.id,
        label: n.code,
        pos: n.label,
        unidad: flotaMultiUnidad ? n.unidadCode : undefined,
        isChild: true,
        chevron: null,
        checked: !!s.checkedIds[n.id],
        trailing: <TagSemanticStatus status="Info" label={n.km} />,
        onClick: () => patch({ selected: n.id, tab: 0 }),
        onCheck: () =>
          patch((prev) => {
            const next = { ...prev.checkedIds };
            if (next[n.id]) delete next[n.id];
            else next[n.id] = true;
            const enterMulti = Object.keys(prev.checkedIds).length <= 1 && Object.keys(next).length > 1;
            return {
              checkedIds: next,
              selected: n.id,
              tab: enterMulti ? 0 : prev.tab,
              chipsActivo: enterMulti ? ['Kilómetros'] : prev.chipsActivo,
              appliedActivo: enterMulti ? ['Kilómetros'] : prev.appliedActivo,
            };
          }),
      });
    });
  });

  const flotaParentIds = flattenAll()
    .filter((n) => n.children && n.children.length)
    .map((n) => n.id);
  const flotaAllExpanded = flotaParentIds.every((id) => isExpanded(id));
  const flotaTypeVisibleTipos = Object.keys(typeGroups).filter(
    (t) => typeGroups[t].filter((n) => nodeMatchesSearch(n, flotaSearchTerms)).length > 0
  );
  const flotaTypeAllOpen = flotaTypeVisibleTipos.every((t) => isTypeOpen(t, s.typeOpen));
  const flotaResultsAllExpanded = s.treeTab === 0 ? flotaAllExpanded : flotaTypeAllOpen;
  const onFlotaExpandCollapseAll = () => {
    if (s.treeTab === 0) {
      patch(() => {
        const next: Record<string, boolean> = {};
        if (flotaAllExpanded) flotaParentIds.forEach((id) => (next[id] = false));
        return { expanded: next };
      });
    } else {
      patch((prev) => {
        const allOpen = flotaTypeVisibleTipos.every((t) => isTypeOpen(t, prev.typeOpen));
        const next = { ...prev.typeOpen };
        flotaTypeVisibleTipos.forEach((t) => (next[t] = !allOpen));
        return { typeOpen: next };
      });
    }
  };

  const checkedNodes: TreeNode[] = [];
  (function collect(nodes: TreeNode[]) {
    nodes.forEach((n) => {
      if (s.checkedIds[n.id]) checkedNodes.push(n);
      if (n.children) collect(n.children);
    });
  })(roots);
  const multi = checkedNodes.length > 1;

  const selAnc = ANCESTORS[(sel?.tipo as Tipo) || 'Eje'] || [];
  const histLabels: string[] = (selAnc as string[]).concat(['Fecha de montaje', 'Fecha de desmontaje', 'Kilometraje parcial']);
  const sortIdx = selAnc.length;
  const histCols = histLabels.map((label) => ({ label }));

  const hijoOptions = (sel && HIJOS[sel.tipo]) || [];
  const hijoValue = hijoOptions.indexOf(s.hijo) !== -1 ? s.hijo : hijoOptions[0] || '';
  const hijoSing = SING[hijoValue] || 'Componente';
  const hijosChildren = (sel?.children || []).filter((c) => (c.tipo || 'Eje') === hijoSing);

  let histRows = buildHistorial(sel);
  if (!s.sortDesc) histRows = histRows.slice().reverse();

  const hijoIsLeftRight = hijoSing === 'Rueda' || hijoSing === 'Reductora';
  const hijoCols =
    hijoValue === 'Coches'
      ? ([{ label: 'Fecha desde' }, { label: 'Fecha hasta' }] as { label: string }[]).concat(
          [1, 2, 3, 4, 5].reduce<{ label: string }[]>(
            (acc, i) => acc.concat([{ label: 'Coche ' + i }, { label: 'Kilómetros' }]),
            []
          )
        )
      : [
          'Fecha desde',
          'Fecha hasta',
          hijoIsLeftRight ? hijoSing + ' izquierda' : hijosChildren[0]?.label || hijoSing + ' 1',
          'Kilómetros',
          hijoIsLeftRight ? hijoSing + ' derecha' : hijosChildren[1]?.label || hijoSing + ' 2',
          'Kilómetros',
        ].map((label) => ({ label }));
  const hijoMinWidth = hijoValue === 'Coches' ? 1750 : undefined;
  const hijoRowsData = buildHijoRows(sel, hijoValue);

  // ---- atributos tab ----
  const activoOpts = ['Kilómetros', 'Ciclos', 'Horas', 'Fecha overhaul', 'Km overhaul', 'Modelo', 'Material'];
  const posOpts = ['Location', 'Visibility', 'CAF-Code', 'Aux_Posición', 'Knuckle'];
  const aOn = s.chipsActivo.length > 0;
  const pOn = s.chipsPos.length > 0;
  const toggle = (key: 'chipsActivo' | 'chipsPos') => (label: string) =>
    patch((prev) => {
      const list = prev[key];
      return { [key]: list.indexOf(label) >= 0 ? list.filter((c) => c !== label) : list.concat([label]) } as Partial<AppState>;
    });
  const tA = toggle('chipsActivo');
  const tP = toggle('chipsPos');
  const now = new Date();
  const p2 = (v: number) => String(v).padStart(2, '0');
  const fechaValue = `${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()} ${p2(now.getHours())}:${p2(
    now.getMinutes()
  )}:${p2(now.getSeconds())}`;

  const activoEmpty = !aOn;
  const posEmpty = !pOn;
  const activoMenuOpen = s.activoMenuOpen;
  const posMenuOpen = s.posMenuOpen;

  const appA = s.appliedActivo;
  const appP = s.appliedPos;
  const EXTRA: Record<string, (n: TreeNode, i: number) => string> = {
    Ciclos: (_n, i) => '1.' + (240 + i * 37),
    Horas: (_n, i) => (3180 + i * 54).toLocaleString('es-ES'),
    'Fecha overhaul': (_n, i) => {
      const d = new Date(2024, 0, 15 + i * 40);
      const p = (v: number) => String(v).padStart(2, '0');
      return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
    },
    'Km overhaul': (_n, i) => (85000 + i * 3200).toLocaleString('es-ES') + 'km',
    Modelo: (_n, i) => 'MOD-' + (100 + (i % 6)),
    Material: (_n, i) => (i % 2 === 0 ? 'Acero forjado' : 'Fundición'),
    Location: (_n, i) => 'ALM-' + ['Mad', 'Bcn', 'Zar'][i % 3],
    Visibility: (_n, i) => (i % 2 === 0 ? 'Pública' : 'Restringida'),
    'CAF-Code': (_n, i) => 'CAF-' + (10000 + i * 7),
    Aux_Posición: (_n, i) => 'AUX-' + ((i % 4) + 1),
    Knuckle: (_n, i) => (i % 2 === 0 ? 'N1' : 'N2'),
  };
  const buildAtrCell = (label: string, n: TreeNode, i: number) => {
    if (label === 'Tipo') return txtCell(n.tipo || 'Eje');
    if (label === 'ID') return idCell(n.code);
    if (label === 'Posición') return txtCell(n.label);
    if (label === 'Unidad') return txtCell(n.unidadCode || '—');
    if (label === 'Kilómetros') return kmCell(n.km);
    return txtCell(EXTRA[label] ? EXTRA[label](n, i) : '—');
  };
  const atrNodes = multi ? checkedNodes : sel ? [sel] : [];
  const activoColsLabels = ['Tipo', 'ID', 'Kilómetros'].concat(appA.filter((c) => c !== 'Kilómetros'));
  const posUnidades = new Set(atrNodes.map((n) => n.unidadCode).filter(Boolean));
  const posShowUnidad = posUnidades.size > 1;
  const posColsLabels = ['Tipo'].concat(posShowUnidad ? ['Unidad'] : [], ['Posición'], appP);
  const activoCols = activoColsLabels.map((label) => ({ label }));
  const posCols = posColsLabels.map((label) => ({ label }));
  const activoRows = atrNodes.map((n, i) => ({ id: 'a' + i, cells: activoColsLabels.map((label) => buildAtrCell(label, n, i)) }));
  const posRows = atrNodes.map((n, i) => ({ id: 'p' + i, cells: posColsLabels.map((label) => buildAtrCell(label, n, i)) }));
  const contentTabs = multi
    ? ['Atributos de activo', 'Atributos de posición']
    : ['Histórico de vida', 'Atributos de activo', 'Atributos de posición'];
  const tab = s.tab;
  const showHistorial = !multi && !!sel && s.tab === 0;
  const showAtributosActivo = !!sel && ((multi && s.tab === 0) || (!multi && s.tab === 1));
  const showAtributosPos = !!sel && ((multi && s.tab === 1) || (!multi && s.tab === 2));
  const noSelection = !sel;

  const almacenAtrNodes: AlmacenItem[] = almacenMulti ? almacenCheckedItems : almacenSel ? [almacenSel] : [];
  const almacenActivoColsLabels = ['Tipo', 'ID'].concat(appA);
  const almacenActivoCols = almacenActivoColsLabels.map((label) => ({ label }));
  const almacenActivoRows = almacenAtrNodes.map((n, i) => ({
    id: 'aa' + i,
    cells: almacenActivoColsLabels.map((label) => {
      if (label === 'Tipo') return txtCell(n.tipo);
      if (label === 'ID') return idCell(n.code);
      if (label === 'Kilómetros') return kmCell(n.km);
      return txtCell(EXTRA[label] ? EXTRA[label](n as unknown as TreeNode, i) : '—');
    }),
  }));
  const almacenContentTabs = almacenMulti ? ['Atributos de activo'] : ['Histórico de vida', 'Atributos de activo'];
  const almacenNoSelection = !almacenSel && !almacenMulti;
  const showAlmacenHistorial = !almacenMulti && !!almacenSel && s.tab === 0;
  const showAlmacenActivo = (almacenMulti && s.tab === 0) || (!almacenMulti && !!almacenSel && s.tab === 1);
  const almacenHistRows = almacenSel ? almacenHistorial(almacenSel) : [];

  const emptyFleet = isFlota && treeRoots.length === 0;
  const notApplied = !s.applied;
  const showTree = s.applied && s.treeTab === 0;
  const showTypes = s.applied && s.treeTab === 1;

  const flotaOptions = ['Urbos 100', 'Zaragoza 3000'];
  const almacenOptions = Object.keys(ALMACENES);
  const unidadOptions = ['Todos'].concat(roots.map((n) => n.code));
  const treeViewOptions = ['Vista árbol', 'Vista tipo de componente'];
  const treeViewValue = treeViewOptions[s.treeTab] || treeViewOptions[0];
  const toLocalMinuteInput = (d: Date) => {
    const p = (v: number) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const flotaFechaMax = clockNow ? toLocalMinuteInput(clockNow) : undefined;
  const flotaFechaValue = s.flotaFecha || flotaFechaMax || '';
  const shortcutCards = [
    { title: 'Movimientos', body: 'Texto descriptivo acerca de Movimientos' },
    { title: 'Información de talleres', body: 'Texto descriptivo acerca de Información de talleres' },
    { title: 'Lineas', body: 'Texto descriptivo acerca de Lineas' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F0F0F4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <header
        style={{
          height: 48,
          flexShrink: 0,
          boxSizing: 'border-box',
          background: '#F0F0F4',
          borderBottom: '1px solid #C8C7D1',
          display: 'flex',
          flexDirection: 'row',
          padding: '8px 48px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'center', height: 28 }}>
          <Image src="/assets/logo-caf.svg" alt="CAF" width={61} height={24} />
          <PiecesNavbarItemGroup items={['Consultar', 'Operaciones', 'Registro', 'Sincronización RFID']} selected={0} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center', alignSelf: 'stretch' }}>
          <PiecesNavbarSelector value="ES" />
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 12px',
              borderRadius: 100,
              cursor: 'pointer',
            }}
          >
            <MatAvatar size="Small" />
            <span style={{ color: '#18171C', display: 'flex' }}>
              <Icon name="ArrowDropDown" size={20} />
            </span>
          </span>
          <span
            style={{
              width: 44,
              alignSelf: 'stretch',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 100,
              cursor: 'pointer',
              color: '#474554',
            }}
          >
            <Icon name="Settings" size={20} />
          </span>
        </div>
      </header>

      {isConsulta && (
        <div
          data-screen-label="Paso 1 · Consultar"
          style={{
            background: '#F0F0F4',
            display: 'flex',
            flexDirection: 'column',
            gap: 40,
            padding: 96,
            alignItems: 'stretch',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: 36, lineHeight: '44px', color: '#000' }}>Consultar</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'stretch' }}>
              <div
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  borderRadius: 8,
                  background: '#FFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  padding: 24,
                  alignItems: 'flex-start',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <span style={{ position: 'relative', width: 24, height: 24, overflow: 'hidden', flexShrink: 0, display: 'block' }}>
                    <Image src="/assets/icon-location-on.svg" alt="" width={16} height={20} style={{ position: 'absolute', left: 4, top: 2 }} />
                  </span>
                  <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#18171C' }}>Por ubicación</span>
                </div>
                <span style={{ fontSize: 16, lineHeight: '25px', letterSpacing: '0.5px', color: '#18171C' }}>
                  Consulta el listado completo de activos y piezas para su consulta y gestión.
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'stretch' }}>
                  <div
                    style={{
                      borderRadius: 8,
                      background: '#F9F9FB',
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 16,
                      padding: 24,
                      alignItems: 'flex-end',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                      <MatSelect
                        label="Flota"
                        value={s.flota}
                        options={flotaOptions}
                        width="100%"
                        onSelect={(v) => patch({ flota: v, unidad: 'Todos', selected: null, expanded: {} })}
                      />
                    </div>
                    <MatButtonTonal
                      label="Consultar flota"
                      onClick={() =>
                        patch({
                          screen: 'flota',
                          selected: null,
                          expanded: {},
                          applied: false,
                          dUnidad: '',
                          checkedIds: {},
                          typeOpen: {},
                          flotaSearch: '',
                          flotaCtxExpanded: {},
                          flotaFecha: '',
                        })
                      }
                    />
                  </div>
                  <div
                    style={{
                      borderRadius: 8,
                      background: '#F9F9FB',
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 16,
                      padding: 24,
                      alignItems: 'flex-end',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                      <MatSelect
                        label="Almacén"
                        value={s.almacen}
                        options={almacenOptions}
                        width="100%"
                        onSelect={(v) => patch({ almacen: v })}
                      />
                    </div>
                    <MatButtonTonal
                      label="Consultar almacén"
                      onClick={() =>
                        patch((prev) => ({
                          screen: 'almacen',
                          dAlmacen: prev.almacen,
                          almacenApplied: true,
                          almacenExpandedTipos: {},
                          almacenCheckedIds: {},
                          almacenSelectedId: null,
                          almacenSearch: '',
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  borderRadius: 8,
                  background: '#FFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  padding: 24,
                  alignItems: 'flex-start',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#18171C', display: 'flex' }}>
                    <Icon name="Barcode" size={24} />
                  </span>
                  <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#18171C' }}>Por número de serie</span>
                </div>
                <span style={{ fontSize: 16, lineHeight: '25px', letterSpacing: '0.5px', color: '#18171C' }}>
                  Introduce el ID del componente para realizar la búsqueda.
                </span>
                <div
                  style={{
                    borderRadius: 8,
                    background: '#F9F9FB',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 16,
                    padding: 24,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    boxSizing: 'border-box',
                    alignSelf: 'stretch',
                  }}
                >
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <MatFormField label="Número de serie" width="100%" />
                  </div>
                  <MatButtonTonal
                    label="Consultar componente"
                    disabled
                    style={{ background: '#0D0D0D', color: '#18171C' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'stretch' }}>
              {shortcutCards.map((card) => {
                const onOpen = card.title === 'Movimientos' ? () => patch({ screen: 'movimientos' }) : undefined;
                return (
                  <div
                    key={card.title}
                    onClick={onOpen}
                    style={{
                      flex: '1 1 0',
                      borderRadius: 8,
                      background: '#F9F9FB',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      padding: 24,
                      boxSizing: 'border-box',
                      cursor: onOpen ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 24, lineHeight: '32px', color: '#18171C' }}>{card.title}</span>
                      <MatButtonIcon icon="ChevronRight" onClick={onOpen} />
                    </div>
                    <span style={{ fontSize: 16, lineHeight: '25px', letterSpacing: '0.5px', color: '#18171C' }}>{card.body}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isFlota && (
        <div
          data-screen-label="Trazabilidad por flota"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '24px 48px 40px 48px',
            alignItems: 'stretch',
            boxSizing: 'border-box',
            flexGrow: 1,
          }}
        >
          <Breadcrumb items={['Consultas', 'Consultar por flota']} showBack onBack={() => patch({ screen: 'consulta' })} />

          <div
            style={{
              borderRadius: 8,
              background: '#FFF',
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              padding: 16,
              alignItems: 'center',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center', flexGrow: 1 }}>
              <MatSelect
                label="Flota"
                value={s.flota}
                options={flotaOptions}
                width={250}
                onSelect={(v) => patch({ flota: v, unidad: 'Todos', selected: null, expanded: {}, flotaSearch: '', flotaCtxExpanded: {}, flotaFecha: '' })}
              />
              <MatSelect label="Unidad" value={s.dUnidad || 'Seleccionar'} options={unidadOptions} width={250} onSelect={(v) => patch({ dUnidad: v })} />
            </div>
            <MatButtonTonal
              label="Aplicar"
              onClick={() =>
                patch((prev) => ({
                  applied: true,
                  unidad: prev.dUnidad || 'Todos',
                  treeTab: 0,
                  selected: null,
                  expanded: {},
                  checkedIds: {},
                  typeOpen: {},
                  flotaSearch: '',
                  flotaCtxExpanded: {},
                  flotaFecha: '',
                }))
              }
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'stretch', flexGrow: 1 }}>
            <div
              style={{
                width: 486,
                height: 776,
                flexShrink: 0,
                borderRadius: 8,
                background: '#FFF',
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'flex-start',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  padding: 24,
                  borderBottom: '1px solid #C8C7D1',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 12px',
                    border: '1px solid #77728D',
                    borderRadius: 100,
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ color: '#474554', display: 'flex', flexShrink: 0 }}>
                    <Icon name="Search" size={20} />
                  </span>
                  <input
                    value={s.flotaSearch}
                    onChange={(e) => patch({ flotaSearch: e.target.value })}
                    placeholder="Buscar por tipo(s), posición o número de serie"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 16,
                      lineHeight: '24px',
                      letterSpacing: '0.5px',
                      color: '#18171C',
                      fontFamily: 'inherit',
                    }}
                  />
                  {s.flotaSearch && (
                    <span
                      onClick={() => patch({ flotaSearch: '' })}
                      style={{ color: '#474554', display: 'flex', flexShrink: 0, cursor: 'pointer' }}
                    >
                      <Icon name="Close" size={18} />
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 32,
                      padding: '0 12px',
                      borderRadius: 100,
                      border: '1px solid #C8C7D1',
                      background: '#F9F9FB',
                      fontSize: 12,
                      lineHeight: '16px',
                      letterSpacing: '0.4px',
                      color: '#474554',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                    title="Fecha (puedes elegir un momento anterior)"
                  >
                    <Icon name="CalendarMonth" size={16} />
                    <input
                      type="datetime-local"
                      value={flotaFechaValue}
                      max={flotaFechaMax}
                      onChange={(e) => patch({ flotaFecha: e.target.value })}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        letterSpacing: '0.4px',
                        color: '#474554',
                        cursor: 'pointer',
                        colorScheme: 'light',
                      }}
                    />
                  </label>
                  <PillSelect
                    icon={s.treeTab === 0 ? 'AccountTree' : 'List'}
                    value={treeViewValue}
                    options={treeViewOptions}
                    onSelect={(v) => patch({ treeTab: treeViewOptions.indexOf(v) })}
                  />
                </div>
              </div>
              {s.applied && !emptyFleet && (
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 0, padding: '6px 12px 0 0', flexShrink: 0 }}>
                  <MatButtonIcon
                    icon="UnfoldLess"
                    title={flotaResultsAllExpanded ? 'Colapsar todo' : 'Expandir todo'}
                    onClick={onFlotaExpandCollapseAll}
                    style={{ width: 28, height: 28 }}
                    iconSize={16}
                  />
                  <MatButtonIcon icon="Download" title="Descargar árbol" style={{ width: 28, height: 28 }} iconSize={16} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', padding: 24, gap: 24, boxSizing: 'border-box', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
                {emptyFleet && <EmptyState icon="AccountTree" text="Esta flota no tiene datos cargados" width="100%" height={168} />}
                {notApplied && !emptyFleet && (
                  <EmptyState icon="AccountTree" text="Elige una unidad y pulsa Aplicar" width="100%" height={360} />
                )}
                {showTree && !flotaSearchActive &&
                  treeRows.map((row) => (
                    <PiecesNavlistItemNested
                      key={row.id}
                      label={row.label}
                      code={row.code}
                      depth={row.depth}
                      state={row.state}
                      expanded={row.expanded}
                      trailing={row.trailing}
                      onClick={row.onClick}
                    />
                  ))}
                {showTree && flotaSearchActive && searchRows.length === 0 && (
                  <EmptyState icon="Search" text="No se han encontrado resultados" width="100%" height={168} />
                )}
                {showTree && flotaSearchActive &&
                  searchRows.map((row) => (
                    <div
                      key={row.key}
                      onClick={row.onClick}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        minHeight: 60,
                        borderRadius: 8,
                        padding: `8px 12px 8px ${12 + row.node.depth * 20}px`,
                        boxSizing: 'border-box',
                        cursor: row.dimmed ? 'default' : 'pointer',
                        opacity: row.dimmed ? 0.4 : 1,
                        background: !row.dimmed && s.selected === row.node.id ? '#DFDAF6' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!row.dimmed && s.selected !== row.node.id) e.currentTarget.style.background = '#F4F3FA';
                      }}
                      onMouseLeave={(e) => {
                        if (!row.dimmed && s.selected !== row.node.id) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span
                        onClick={(e) => {
                          if (!row.onToggleCtx) return;
                          e.stopPropagation();
                          row.onToggleCtx();
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#474554',
                          cursor: row.hasCtx ? 'pointer' : 'default',
                        }}
                      >
                        {row.hasCtx && <Icon name={row.ctxExpanded ? 'ExpandMore' : 'ChevronRight'} size={20} />}
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
                          {row.node.label}
                        </span>
                        <span style={{ fontSize: 12, letterSpacing: '0.4px', color: '#474554' }}>{row.node.code}</span>
                      </span>
                      <span style={{ flexShrink: 0 }}>
                        <TagSemanticStatus status="Info" label={row.node.km} />
                      </span>
                    </div>
                  ))}
                {showTypes && flotaSearchActive && typeRows.length === 0 && (
                  <EmptyState icon="Search" text="No se han encontrado resultados" width="100%" height={168} />
                )}
                {showTypes &&
                  typeRows.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        minHeight: 48,
                        borderRadius: 1000,
                        paddingRight: 12,
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                      onClick={row.onClick}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F3FA')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {row.isChild && <div style={{ width: 32, flexShrink: 0 }} />}
                      <div
                        style={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#474554', cursor: 'pointer' }}
                        onClick={row.onChevron}
                      >
                        {row.chevron && <Icon name={row.chevron} size={20} />}
                      </div>
                      <MatCheckbox checked={row.checked} onChange={row.onCheck} />
                      <span
                        style={{
                          fontSize: 16,
                          lineHeight: '25px',
                          letterSpacing: '0.5px',
                          color: '#18171C',
                          flex: '1 1 auto',
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          gap: 8,
                        }}
                      >
                        {row.label}
                        <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554' }}>{row.pos}</span>
                      </span>
                      {row.unidad && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: 20,
                            padding: '0 8px',
                            borderRadius: 1000,
                            background: '#EDEBF7',
                            color: '#2B1C74',
                            fontSize: 11,
                            fontWeight: 500,
                            lineHeight: '16px',
                            letterSpacing: '0.4px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          Unidad {row.unidad}
                        </span>
                      )}
                      <div style={{ flexShrink: 0 }}>{row.trailing}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flexGrow: 1, minWidth: 0 }}>
              {multi && (
                <div
                  style={{
                    height: 84,
                    borderRadius: 8,
                    background: '#F9FCFF',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 8,
                    padding: '16px 32px',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#000', whiteSpace: 'nowrap' }}>{checkedNodes.length}</span>
                  <span style={{ fontSize: 16, lineHeight: '25px', letterSpacing: '0.5px', color: '#474554', whiteSpace: 'nowrap' }}>
                    componentes seleccionados
                  </span>
                </div>
              )}

              {!multi && sel && (
                <div
                  style={{
                    height: 84,
                    borderRadius: 8,
                    background: '#F9FCFF',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 40,
                    padding: '16px 32px',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#000', whiteSpace: 'nowrap' }}>{sel.label}</span>
                    <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554', whiteSpace: 'nowrap' }}>{sel.code}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 32, justifyContent: 'flex-end', alignItems: 'center', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', flexShrink: 0 }}>
                      <span style={{ fontWeight: 500, fontSize: 11, lineHeight: '16px', letterSpacing: '0.5px', color: '#474554' }}>Kilómetros</span>
                      <TagSemanticStatus status="Info" label={sel.km} />
                    </div>
                    {[
                      { title: 'Tipo', value: sel.tipo || 'Eje' },
                      { title: 'GMAO', value: sel.gmao || '\u2014' },
                      { title: 'Tag', value: sel.tag || '\u2014' },
                    ].map((m) => (
                      <div key={m.title} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', flexShrink: 0 }}>
                        <span style={{ fontWeight: 500, fontSize: 11, lineHeight: '16px', letterSpacing: '0.5px', color: '#474554' }}>{m.title}</span>
                        <span style={{ fontSize: 16, lineHeight: '25px', letterSpacing: '0.5px', color: '#18171C', whiteSpace: 'nowrap' }}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderRadius: 8, background: '#FFF', display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                <div style={{ border: '1px solid #C8C7D1', flexShrink: 0 }}>
                  <MatTabs tabs={contentTabs} selected={tab} onSelect={(i) => patch({ tab: i })} />
                </div>

                {noSelection && (
                  <div style={{ display: 'flex', padding: 16, boxSizing: 'border-box', flexGrow: 1, minHeight: 672 }}>
                    <EmptyState icon="AccountTree" text="Selecciona un activo para ver su información" width="100%" height="100%" />
                  </div>
                )}

                {showHistorial && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 32, boxSizing: 'border-box', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                      <span style={{ fontWeight: 500, fontSize: 16, lineHeight: '25px', letterSpacing: '0.15px', color: '#18171C' }}>
                        Histórico
                      </span>
                      <Table
                        cols={histCols}
                        rows={histRows}
                        sortIdx={sortIdx}
                        sortDesc={s.sortDesc}
                        onSort={() => patch((prev) => ({ sortDesc: !prev.sortDesc }))}
                      />
                      <div>
                        <MatButtonOutlined label="Descargar" icon="Download" />
                      </div>
                    </div>

                    {hijoOptions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                        <span style={{ fontWeight: 500, fontSize: 16, lineHeight: '25px', letterSpacing: '0.15px', color: '#18171C' }}>
                          Histórico del componente hijo
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <MatSelect label="Tipo de componente" value={hijoValue} options={hijoOptions} width={220} onSelect={(v) => patch({ hijo: v })} />
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <Table cols={hijoCols} rows={hijoRowsData} minWidth={hijoMinWidth} />
                        </div>
                        <div>
                          <MatButtonOutlined label="Descargar" icon="Download" />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                      <span style={{ fontWeight: 500, fontSize: 16, lineHeight: '25px', letterSpacing: '0.15px', color: '#18171C' }}>
                        Movimientos
                      </span>
                      <Table
                        cols={[{ label: 'Fecha' }, { label: 'Tipo' }, { label: 'Con padre' }, { label: 'Con hijos' }]}
                        rows={[
                          {
                            id: 'm1',
                            cells: [
                              txtCell('2025-06-30'),
                              txtCell('Intercambio entre unidades'),
                              txtCell('Sí'),
                              txtCell('No'),
                            ],
                          },
                        ]}
                      />
                      <div>
                        <MatButtonOutlined label="Descargar" icon="Download" />
                      </div>
                    </div>
                  </div>
                )}

                {showAtributosActivo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 32, boxSizing: 'border-box', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <AtributoChipField
                        label="Atributo activo"
                        chips={s.chipsActivo}
                        options={activoOpts}
                        empty={activoEmpty}
                        menuOpen={s.activoMenuOpen}
                        chipColor="#E5E3EC"
                        chipText="#18171C"
                        closeColor="#474554"
                        onToggleChip={tA}
                        onToggleMenu={() => patch((prev) => ({ activoMenuOpen: !prev.activoMenuOpen }))}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', minHeight: 56 }}>
                        <MatButtonTonal label="Aplicar" onClick={() => patch({ appliedActivo: s.chipsActivo.slice(), activoMenuOpen: false })} />
                      </div>
                    </div>

                    <Table cols={activoCols} rows={activoRows} />
                  </div>
                )}

                {showAtributosPos && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 32, boxSizing: 'border-box', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <AtributoChipField
                        label="Atributo de posición"
                        chips={s.chipsPos}
                        options={posOpts}
                        empty={posEmpty}
                        menuOpen={s.posMenuOpen}
                        chipColor="#D7E3FF"
                        chipText="#0B3A8C"
                        closeColor="#0B3A8C"
                        onToggleChip={tP}
                        onToggleMenu={() => patch((prev) => ({ posMenuOpen: !prev.posMenuOpen }))}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', minHeight: 56 }}>
                        <MatButtonTonal label="Aplicar" onClick={() => patch({ appliedPos: s.chipsPos.slice(), posMenuOpen: false })} />
                      </div>
                    </div>

                    <Table cols={posCols} rows={posRows} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMovimientos && (
        <div
          data-screen-label="Movimientos"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            padding: '24px 48px 16px 48px',
            alignItems: 'stretch',
            boxSizing: 'border-box',
            flexGrow: 1,
          }}
        >
          <Breadcrumb items={['Consultar', 'Movimientos']} showBack onBack={() => patch({ screen: 'consulta' })} />

          <div
            style={{
              borderRadius: 8,
              background: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              padding: 16,
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center', flexGrow: 1 }}>
                <MatSelect
                  label="Flota"
                  value={s.flota}
                  options={flotaOptions}
                  width={250}
                  onSelect={(v) => patch({ flota: v, unidad: 'Todos' })}
                />
                <MatSelect
                  label="Unidad"
                  value={s.movUnidad || 'Seleccionar'}
                  options={unidadOptions}
                  width={250}
                  onSelect={(v) => patch({ movUnidad: v })}
                />
              </div>
              <MatButtonTonal label="Aplicar" />
            </div>
          </div>

          <div style={{ borderRadius: 8, background: '#FFF', display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    position: 'relative',
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '0 4px 0 16px',
                    border: '1px solid #77728D',
                    borderRadius: 4,
                    boxSizing: 'border-box',
                    width: 250,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 16, lineHeight: '24px', letterSpacing: '0.5px', color: '#474554' }}>Fecha</span>
                  <MatButtonIcon icon="CalendarMonth" title="Elegir fecha" />
                </div>
                <MatSelect
                  label="Tipo de componente"
                  value={s.movTipoComponente}
                  options={TIPOS_COMPONENTE}
                  width={250}
                  onSelect={(v) => patch({ movTipoComponente: v })}
                />
                <MatSelect
                  label="Tipo de operación"
                  value={s.movTipoOperacion}
                  options={TIPOS_OPERACION}
                  width={250}
                  onSelect={(v) => patch({ movTipoOperacion: v })}
                />
                <div style={{ flex: '1 1 200px', minWidth: 200 }}>
                  <MatFormField
                    label="Buscar ID"
                    width="100%"
                    value={s.movBuscarId}
                    onChange={(v) => patch({ movBuscarId: v })}
                  />
                </div>
                <MatButtonFilled label="Descargar arbol  CSV" icon="Add" />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 1473 }}>
                  <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {[
                      { label: 'FECHA', w: 200 },
                      { label: 'OPERACIÓN', w: 240 },
                      { label: 'COMPONENTE', w: 197 },
                      { label: 'ANTES', w: 394 },
                      { label: 'DESPUES', w: 394 },
                      { label: '', w: 48 },
                    ].map((col) => (
                      <div key={col.label} style={{ width: col.w, flexShrink: 0 }}>
                        <MatCellIndexColStatic label={col.label} />
                      </div>
                    ))}
                  </div>
                  {MOVIMIENTOS.map((row) => (
                    <div key={row.id} style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
                      <div
                        style={{
                          width: 200,
                          flexShrink: 0,
                          minHeight: 48,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderBottom: '1px solid #C8C7D1',
                          boxSizing: 'border-box',
                          fontSize: 14,
                          letterSpacing: '0.25px',
                          color: '#18171C',
                        }}
                      >
                        {row.fecha}
                      </div>
                      <div
                        style={{
                          width: 240,
                          flexShrink: 0,
                          minHeight: 48,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderBottom: '1px solid #C8C7D1',
                          boxSizing: 'border-box',
                        }}
                      >
                        <OperationChip icons={row.operacionIcons} label={row.operacion} />
                      </div>
                      <div
                        title={row.componente}
                        style={{
                          width: 197,
                          flexShrink: 0,
                          minHeight: 48,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderBottom: '1px solid #C8C7D1',
                          boxSizing: 'border-box',
                          fontSize: 14,
                          letterSpacing: '0.25px',
                          color: '#18171C',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.componente}
                      </div>
                      <div
                        style={{
                          width: 394,
                          flexShrink: 0,
                          minHeight: 48,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderBottom: '1px solid #C8C7D1',
                          boxSizing: 'border-box',
                        }}
                      >
                        <PositionPair items={row.antes} />
                      </div>
                      <div
                        style={{
                          width: 394,
                          flexShrink: 0,
                          minHeight: 48,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderBottom: '1px solid #C8C7D1',
                          boxSizing: 'border-box',
                        }}
                      >
                        <PositionPair items={row.despues} />
                      </div>
                      <div
                        style={{
                          width: 48,
                          flexShrink: 0,
                          minHeight: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: '1px solid #C8C7D1',
                          boxSizing: 'border-box',
                        }}
                      >
                        <MatButtonIcon
                          icon="MoreVert"
                          title="Más acciones"
                          onClick={() => patch((prev) => ({ movMenuOpenId: prev.movMenuOpenId === row.id ? null : row.id }))}
                        />
                      </div>
                      {s.movMenuOpenId === row.id && (
                        <div
                          style={{
                            position: 'absolute',
                            zIndex: 20,
                            top: '100%',
                            right: 0,
                            width: 200,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '8px 0',
                            borderRadius: 4,
                            background: '#FFF',
                            boxShadow: '0 4px 16px rgba(24,23,28,0.18)',
                          }}
                        >
                          {[
                            {
                              label: 'Consultar',
                              icon: 'View',
                              onClick: () => patch({ movMenuOpenId: null, screen: 'detalleMovimiento', detalleRowId: row.id }),
                            },
                            { label: 'Eliminar', icon: 'Delete', onClick: () => patch({ movMenuOpenId: null }) },
                          ].map((opt) => (
                            <div
                              key={opt.label}
                              onClick={opt.onClick}
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                padding: '8px 16px',
                                cursor: 'pointer',
                                fontSize: 14,
                                lineHeight: '20px',
                                letterSpacing: '0.25px',
                                color: '#18171C',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F2F7')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Icon name={opt.icon} size={18} />
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDetalleMovimiento && detalleRow && (
        <div
          data-screen-label="Detalle movimiento"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '24px 48px 16px 48px',
            alignItems: 'stretch',
            boxSizing: 'border-box',
            flexGrow: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flexGrow: 1 }}>
              <Breadcrumb
                items={['Consultar', 'Movimientos', 'Detalle movimiento']}
                showBack
                onBack={() => patch({ screen: 'movimientos' })}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554' }}>
                  {detalleRow.operacion}
                </span>
                <span style={{ fontSize: 32, lineHeight: '40px', color: '#18171C' }}>{detalleRow.fecha}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 4,
              background: '#DFDAF6',
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              padding: '12px',
              alignItems: 'center',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#170F3E', display: 'flex', flexShrink: 0 }}>
              <Icon name="Info" size={24} />
            </span>
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, fontSize: 14, lineHeight: '20px', letterSpacing: '0.1px', color: '#170F3E' }}>
                Movimientos posteriores registrados
              </span>
              <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', color: '#170F3E' }}>
                Las unidades han sufrido cambios posteriores, por lo que esta información puede diferir de la composición actual
              </span>
            </div>
            <MatButtonText label="Ver unidad" style={{ color: '#2B1C74', flexShrink: 0 }} />
          </div>

          <div style={{ borderRadius: 8, background: '#FFF', display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 40, padding: 24, boxSizing: 'border-box', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: '8px', boxSizing: 'border-box' }}>
                  <Icon name="Train" size={24} />
                  <span style={{ fontWeight: 500, fontSize: 22, lineHeight: '28px', color: '#000' }}>Unidad 1</span>
                </div>
                <MatDividerHorizontal />
                <div
                  style={{
                    background: '#F9F9FB',
                    borderRadius: 8,
                    marginTop: 16,
                    padding: 16,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {UNIDAD_TREE.map((row) => (
                    <DetailTreeRow key={row.id} row={row} />
                  ))}
                </div>
              </div>

              <div style={{ width: 192, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40 }}>
                <div
                  style={{
                    background: '#F9F9FB',
                    borderRadius: 8,
                    padding: 16,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <OperationChip icons={detalleRow.operacionIcons} label={detalleRow.operacion} />
                  <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#000' }}>{detalleRow.fecha}</span>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 24,
                      padding: '0 12px',
                      borderRadius: 8,
                      background: '#F9F9FB',
                      border: '1px solid #E4E2E8',
                      color: '#18171C',
                      fontSize: 12,
                      lineHeight: '16px',
                      letterSpacing: '0.4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Activos rotados
                    <span style={{ fontWeight: 500, fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px' }}>0</span>
                  </span>
                  <div
                    style={{
                      background: '#FFF',
                      borderRadius: 8,
                      padding: '6px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {[
                      { label: 'Entrante', color: '#AAE03E' },
                      { label: 'Saliente', color: '#FF6464' },
                    ].map((it) => (
                      <div key={it.label} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: '0 8px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: it.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: 10, lineHeight: '16px', letterSpacing: '0.5px', color: '#474554' }}>
                          {it.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <SlideToggle
                  checked={s.soloIntercambiados}
                  onChange={() => patch((prev) => ({ soloIntercambiados: !prev.soloIntercambiados }))}
                  label="Mostrar solo activos intercambiados"
                />
              </div>

              <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="Warehouse" size={24} />
                    <span style={{ fontWeight: 500, fontSize: 22, lineHeight: '28px', color: '#000' }}>Taller</span>
                  </div>
                  <MatButtonIcon icon="Info" title="Más información" />
                </div>
                <MatDividerHorizontal />
                <div
                  style={{
                    background: '#F9F9FB',
                    borderRadius: 8,
                    marginTop: 16,
                    padding: 16,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {TALLER_TREE.map((row) => (
                    <DetailTreeRow key={row.id} row={row} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAlmacen && (
        <div
          data-screen-label="Consultar por almacén"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '24px 48px 40px 48px',
            alignItems: 'stretch',
            boxSizing: 'border-box',
            flexGrow: 1,
          }}
        >
          <Breadcrumb items={['Consultas', 'Consultar por almacén']} showBack onBack={() => patch({ screen: 'consulta' })} />

          <div
            style={{
              borderRadius: 8,
              background: '#FFF',
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              padding: 16,
              alignItems: 'center',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center', flexGrow: 1 }}>
              <MatSelect
                label="Almacén"
                value={s.dAlmacen || 'Seleccionar'}
                options={almacenOptions}
                width={250}
                onSelect={(v) => patch({ dAlmacen: v })}
              />
            </div>
            <MatButtonTonal
              label="Aplicar"
              onClick={() =>
                patch((prev) => ({
                  almacenApplied: true,
                  almacen: prev.dAlmacen || prev.almacen,
                  almacenExpandedTipos: {},
                  almacenCheckedIds: {},
                  almacenSelectedId: null,
                  almacenSearch: '',
                  tab: 0,
                }))
              }
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'stretch', flexGrow: 1 }}>
            <div
              style={{
                width: 486,
                flexShrink: 0,
                borderRadius: 8,
                background: '#FFF',
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'flex-start',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', padding: 16, gap: 8, boxSizing: 'border-box' }}>
                {!s.almacenApplied && (
                  <EmptyState icon="List" text="Elige un almacén y pulsa Aplicar" width="100%" height={168} />
                )}

                {s.almacenApplied && (
                  <>
                    <div
                      style={{
                        position: 'relative',
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0 12px',
                        border: '1px solid #77728D',
                        borderRadius: 100,
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ color: '#474554', display: 'flex', flexShrink: 0 }}>
                        <Icon name="Search" size={20} />
                      </span>
                      <input
                        value={s.almacenSearch}
                        onChange={(e) => patch({ almacenSearch: e.target.value })}
                        placeholder="Buscar por tipo(s) o número de serie"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: 14,
                          lineHeight: '20px',
                          letterSpacing: '0.25px',
                          color: '#18171C',
                          fontFamily: 'inherit',
                        }}
                      />
                      {s.almacenSearch && (
                        <span
                          onClick={() => patch({ almacenSearch: '' })}
                          style={{ color: '#474554', display: 'flex', flexShrink: 0, cursor: 'pointer' }}
                        >
                          <Icon name="Close" size={16} />
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                      {(
                        [
                          { key: 'conHijos' as const, pair: 'sinHijos' as const, label: 'Con hijos' },
                          { key: 'sinHijos' as const, pair: 'conHijos' as const, label: 'Sin hijos' },
                          { key: 'conPadre' as const, pair: 'sinPadre' as const, label: 'Con padre' },
                          { key: 'sinPadre' as const, pair: 'conPadre' as const, label: 'Sin padre' },
                        ]
                      ).map((f) => {
                        const checked = s.almacenFilter[f.key];
                        const locked = checked && !s.almacenFilter[f.pair];
                        return (
                          <button
                            key={f.key}
                            type="button"
                            title={locked ? 'Debe quedar seleccionada al menos una de las dos opciones' : undefined}
                            onClick={() =>
                              patch((prev) => {
                                if (prev.almacenFilter[f.key] && !prev.almacenFilter[f.pair]) return {};
                                return { almacenFilter: { ...prev.almacenFilter, [f.key]: !prev.almacenFilter[f.key] } };
                              })
                            }
                            style={{
                              cursor: locked ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              height: 26,
                              padding: '0 10px',
                              borderRadius: 100,
                              border: checked ? '1px solid #2B1C74' : '1px solid #C8C7D1',
                              background: checked ? '#DFDAF6' : 'transparent',
                              color: checked ? '#2B1C74' : '#77728D',
                              fontSize: 11,
                              fontWeight: 500,
                              letterSpacing: '0.4px',
                              opacity: locked ? 0.6 : 1,
                              whiteSpace: 'nowrap',
                              fontFamily: 'inherit',
                            }}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      {almacenAnyFilterActive ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: 24,
                            padding: '0 12px',
                            borderRadius: 8,
                            background: '#DFDAF6',
                            color: '#170F3E',
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: '16px',
                            letterSpacing: '0.4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Resultados filtrados
                        </span>
                      ) : (
                        <span />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                        <MatButtonIcon
                          icon="UnfoldLess"
                          title={almacenAllExpanded ? 'Colapsar todo' : 'Expandir todo'}
                          onClick={() =>
                            patch((prev) => {
                              const isOpenPrev = (tipo: string) =>
                                almacenSearchActive ? prev.almacenExpandedTipos[tipo] !== false : !!prev.almacenExpandedTipos[tipo];
                              const allOpen = almacenVisibleTipos.every((t) => isOpenPrev(t.tipo));
                              const next = { ...prev.almacenExpandedTipos };
                              almacenVisibleTipos.forEach((t) => (next[t.tipo] = !allOpen));
                              return { almacenExpandedTipos: next };
                            })
                          }
                        />
                      </div>
                    </div>
                    <MatDividerHorizontal />

                    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 680, overflowY: 'auto' }}>
                      {ALMACEN_TIPOS.map((t) => {
                        const expanded = isAlmacenTipoOpen(t.tipo);
                        const rawItems = almacenData.items[t.tipo] || [];
                        const filteredItems = rawItems.filter(almacenFilterFn).filter((it) => nodeMatchesSearch(it, almacenSearchTerms));
                        const allCheckedInTipo = filteredItems.length > 0 && filteredItems.every((it) => s.almacenCheckedIds[it.id]);
                        return (
                          <div key={t.tipo}>
                            <div
                              onClick={() =>
                                patch((prev) => ({ almacenExpandedTipos: { ...prev.almacenExpandedTipos, [t.tipo]: !prev.almacenExpandedTipos[t.tipo] } }))
                              }
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                minHeight: 40,
                                padding: '8px',
                                borderRadius: 8,
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F3FA')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span style={{ color: '#18171C', display: 'flex', flexShrink: 0 }}>
                                <Icon name={expanded ? 'ExpandMore' : 'ChevronRight'} size={20} />
                              </span>
                              <span style={{ display: 'flex', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                <MatCheckbox
                                  checked={allCheckedInTipo}
                                  onChange={() =>
                                    patch((prev) => {
                                      const next = { ...prev.almacenCheckedIds };
                                      if (allCheckedInTipo) filteredItems.forEach((it) => delete next[it.id]);
                                      else filteredItems.forEach((it) => (next[it.id] = true));
                                      return { almacenCheckedIds: next, almacenSelectedId: null };
                                    })
                                  }
                                />
                              </span>
                              <span style={{ flex: 1, fontSize: 16, fontWeight: 700, lineHeight: '24px', letterSpacing: '0.5px', color: '#170F3E' }}>{t.label}</span>
                              <span
                                title={almacenAnyFilterActive ? `Filtrado: ${filteredItems.length} de ${almacenData.counts[t.tipo] || 0}` : undefined}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  height: 24,
                                  padding: '0 12px',
                                  borderRadius: 8,
                                  background: almacenAnyFilterActive ? '#DFDAF6' : '#F9F9FB',
                                  color: almacenAnyFilterActive ? '#170F3E' : '#18171C',
                                  fontSize: 12,
                                  fontWeight: 500,
                                  lineHeight: '16px',
                                  letterSpacing: '0.4px',
                                }}
                              >
                                {filteredItems.length}
                                {almacenAnyFilterActive ? ` / ${almacenData.counts[t.tipo] || 0}` : ''}
                              </span>
                            </div>
                            <MatDividerHorizontal />

                            {expanded && (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {filteredItems.map((it) => (
                                  <div key={it.id}>
                                    {it.groupLabel && (
                                      <div
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          gap: 8,
                                          padding: '8px 8px 8px 28px',
                                          minHeight: 40,
                                          opacity: 0.4,
                                        }}
                                      >
                                        <span style={{ color: '#18171C', display: 'flex', flexShrink: 0 }}>
                                          <Icon name="ExpandMore" size={20} />
                                        </span>
                                        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: 16, lineHeight: '24px', letterSpacing: '0.5px', color: '#170F3E' }}>{it.groupLabel}</span>
                                          <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554' }}>{it.groupCode}</span>
                                        </span>
                                        <TagSemanticStatus status="Info" label={it.groupKm || it.km} />
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 8px 8px 28px',
                                        minHeight: 40,
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        background: s.almacenSelectedId === it.id ? '#DFDAF6' : 'transparent',
                                      }}
                                      onClick={() => patch({ almacenSelectedId: it.id, tab: 0 })}
                                      onMouseEnter={(e) => {
                                        if (s.almacenSelectedId !== it.id) e.currentTarget.style.background = '#F4F3FA';
                                      }}
                                      onMouseLeave={(e) => {
                                        if (s.almacenSelectedId !== it.id) e.currentTarget.style.background = 'transparent';
                                      }}
                                    >
                                      {it.conHijos && it.children ? (
                                        <span
                                          style={{ color: '#18171C', display: 'flex', cursor: 'pointer', flexShrink: 0 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            patch((prev) => ({ almacenExpandedIds: { ...prev.almacenExpandedIds, [it.id]: !prev.almacenExpandedIds[it.id] } }));
                                          }}
                                        >
                                          <Icon name={s.almacenExpandedIds[it.id] ? 'ExpandMore' : 'ChevronRight'} size={20} />
                                        </span>
                                      ) : (
                                        <span style={{ width: 20, flexShrink: 0 }} />
                                      )}
                                      <MatCheckbox
                                        checked={!!s.almacenCheckedIds[it.id]}
                                        onChange={() =>
                                          patch((prev) => {
                                            const next = { ...prev.almacenCheckedIds };
                                            if (next[it.id]) delete next[it.id];
                                            else next[it.id] = true;
                                            return { almacenCheckedIds: next, almacenSelectedId: null };
                                          })
                                        }
                                      />
                                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: 16, lineHeight: '24px', letterSpacing: '0.5px', color: '#170F3E' }}>{it.label}</span>
                                        <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554' }}>{it.code}</span>
                                      </span>
                                      <TagSemanticStatus status="Info" label={it.km} />
                                    </div>
                                    {it.conHijos && it.children && s.almacenExpandedIds[it.id] && (
                                      <div style={{ display: 'flex', flexDirection: 'column', opacity: 0.4 }}>
                                        {it.children.map((child) => (
                                          <div
                                            key={child.id}
                                            style={{
                                              display: 'flex',
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              gap: 8,
                                              padding: '8px 8px 8px 76px',
                                              minHeight: 40,
                                            }}
                                          >
                                            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                              <span style={{ fontSize: 16, lineHeight: '24px', letterSpacing: '0.5px', color: '#170F3E' }}>{child.label}</span>
                                              <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554' }}>{child.code}</span>
                                            </span>
                                            <TagSemanticStatus status="Info" label={child.km} />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flexGrow: 1, minWidth: 0 }}>
              {almacenMulti && (
                <div
                  style={{
                    height: 84,
                    borderRadius: 8,
                    background: '#F9FCFF',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 8,
                    padding: '16px 32px',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#000', whiteSpace: 'nowrap' }}>Selección múltiple</span>
                    <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554', whiteSpace: 'nowrap' }}>
                      {almacenCheckedItems.length} items
                    </span>
                  </div>
                </div>
              )}

              {!almacenMulti && (
                <div
                  style={{
                    height: 84,
                    borderRadius: 8,
                    background: '#F9FCFF',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 40,
                    padding: '16px 32px',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#000', whiteSpace: 'nowrap' }}>
                      {almacenSel ? almacenSel.label : 'Sin selección'}
                    </span>
                    <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554', whiteSpace: 'nowrap' }}>
                      {almacenSel ? almacenSel.code : '-'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 32, justifyContent: 'flex-end', alignItems: 'center', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', flexShrink: 0 }}>
                      <span style={{ fontWeight: 500, fontSize: 11, lineHeight: '16px', letterSpacing: '0.5px', color: '#474554' }}>Kilómetros</span>
                      {almacenSel ? <TagSemanticStatus status="Info" label={almacenSel.km} /> : <span style={{ color: '#18171C' }}>-</span>}
                    </div>
                    {[
                      { title: 'Tipo', value: almacenSel?.tipo || '-' },
                      { title: 'GMAO', value: almacenSel?.gmao || '-' },
                      { title: 'Tag', value: almacenSel?.tag || '-' },
                    ].map((m) => (
                      <div key={m.title} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', flexShrink: 0 }}>
                        <span style={{ fontWeight: 500, fontSize: 11, lineHeight: '16px', letterSpacing: '0.5px', color: '#474554' }}>{m.title}</span>
                        <span style={{ fontSize: 16, lineHeight: '25px', letterSpacing: '0.5px', color: '#18171C', whiteSpace: 'nowrap' }}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderRadius: 8, background: '#FFF', display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                <div style={{ border: '1px solid #C8C7D1', flexShrink: 0 }}>
                  <MatTabs tabs={almacenContentTabs} selected={s.tab} onSelect={(i) => patch({ tab: i })} />
                </div>

                {almacenNoSelection && (
                  <div style={{ display: 'flex', padding: 16, boxSizing: 'border-box', flexGrow: 1, minHeight: 672 }}>
                    <EmptyState icon="List" text="Selecciona un activo para ver su información" width="100%" height="100%" />
                  </div>
                )}

                {showAlmacenHistorial && almacenSel && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 32, boxSizing: 'border-box', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                      <span style={{ fontWeight: 500, fontSize: 16, lineHeight: '25px', letterSpacing: '0.15px', color: '#18171C' }}>
                        Histórico
                      </span>
                      <Table
                        cols={[
                          { label: 'Unidad' },
                          { label: 'Coche' },
                          { label: 'Bogie' },
                          { label: 'Fecha de montaje' },
                          { label: 'Fecha de desmontaje' },
                          { label: 'Kilometraje parcial' },
                        ]}
                        rows={almacenHistRows}
                      />
                      <div>
                        <MatButtonOutlined label="Descargar" icon="Download" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                      <span style={{ fontWeight: 500, fontSize: 16, lineHeight: '25px', letterSpacing: '0.15px', color: '#18171C' }}>
                        Movimientos
                      </span>
                      <Table
                        cols={[{ label: 'Fecha' }, { label: 'Tipo' }, { label: 'Con padre' }, { label: 'Con hijos' }]}
                        rows={[
                          {
                            id: 'm1',
                            cells: [
                              txtCell('2025-06-30'),
                              txtCell('Intercambio entre unidades'),
                              txtCell(almacenSel.conPadre ? 'Sí' : 'No'),
                              txtCell(almacenSel.conHijos ? 'Sí' : 'No'),
                            ],
                          },
                        ]}
                      />
                      <div>
                        <MatButtonOutlined label="Descargar" icon="Download" />
                      </div>
                    </div>
                  </div>
                )}

                {showAlmacenActivo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 32, boxSizing: 'border-box', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <AtributoChipField
                        label="Atributo activo"
                        chips={s.chipsActivo}
                        options={activoOpts}
                        empty={activoEmpty}
                        menuOpen={s.activoMenuOpen}
                        chipColor="#E5E3EC"
                        chipText="#18171C"
                        closeColor="#474554"
                        onToggleChip={tA}
                        onToggleMenu={() => patch((prev) => ({ activoMenuOpen: !prev.activoMenuOpen }))}
                      />
                      <div
                        style={{
                          position: 'relative',
                          minHeight: 56,
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 8,
                          alignItems: 'center',
                          padding: '8px 12px',
                          border: '1px solid #77728D',
                          borderRadius: 4,
                          boxSizing: 'border-box',
                          background: '#FFF',
                          flex: '0 0 250px',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: -8,
                            left: 12,
                            padding: '0 4px',
                            background: '#FFF',
                            fontSize: 12,
                            lineHeight: '16px',
                            letterSpacing: '0.4px',
                            color: '#474554',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Fecha
                        </span>
                        <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', color: '#18171C', whiteSpace: 'nowrap' }}>{fechaValue}</span>
                        <span style={{ marginLeft: 'auto', color: '#474554', display: 'flex' }}>
                          <Icon name="CalendarMonth" size={24} />
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', minHeight: 56 }}>
                        <MatButtonTonal label="Aplicar" onClick={() => patch({ appliedActivo: s.chipsActivo.slice(), activoMenuOpen: false })} />
                      </div>
                    </div>

                    <Table cols={almacenActivoCols} rows={almacenActivoRows} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
