'use client';

import Image from 'next/image';
import { CSSProperties, MouseEvent, ReactNode, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './ui/Icon';
import { MatButtonFilled, MatButtonIcon, MatButtonOutlined, MatButtonText, MatButtonTonal } from './ui/Buttons';
import { MatSelect } from './ui/MatSelect';
import {
  Breadcrumb,
  EmptyState,
  MatAvatar,
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
  MovimientoRow,
  SING,
  TALLERES_SEED,
  TallerInfo,
  TIPOS_COMPONENTE,
  TIPOS_OPERACION,
  Tipo,
  TreeNode,
  USOS_TALLER,
  almacenHistorial,
  buscarPorTipo,
  fechaActualizacion,
  find,
  findAnywhereByCode,
  findCodePath,
  hijoRows as buildHijoRows,
  historial as buildHistorial,
  id as idCell,
  km as kmCell,
  txt as txtCell,
  W_DESDE,
  W_HASTA,
  W_ID,
  W_DRIVER,
} from '@/lib/data';

interface AppState {
  screen: 'consulta' | 'flota' | 'movimientos' | 'detalleMovimiento' | 'almacen' | 'tipoComponente' | 'talleres';
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
  flotaBuscar: string;
  flotaSearchAt: string;
  hijo: string;
  chipsActivo: string[];
  chipsPos: string[];
  appliedActivo: string[];
  appliedPos: string[];
  activoMenuOpen: boolean;
  posMenuOpen: boolean;
  historialPopupCode: string | null;
  movUnidad: string;
  movTipoComponente: string;
  movTipoOperacion: string;
  movBuscarId: string;
  movMenuOpenId: string | null;
  movPage: number;
  movPageSize: number;
  detalleRowId: string | null;
  soloIntercambiados: boolean;
  almacen: string;
  dAlmacen: string;
  dTipoComponente: string;
  dNumeroSerie: string;
  numeroSerieNotFound: string | null;
  almacenApplied: boolean;
  almacenExpandedTipos: Record<string, boolean>;
  almacenCheckedIds: Record<string, boolean>;
  almacenSelectedId: string | null;
  almacenBuscar: string;
  almacenFilterOpen: boolean;
  almacenFilter: { conHijos: boolean; sinHijos: boolean; conPadre: boolean; sinPadre: boolean };
  tcTipo: string;
  tcDTipo: string;
  tcChipsFlota: string[];
  tcAppliedFlota: string[];
  tcFlotaMenuOpen: boolean;
  tcChipsTaller: string[];
  tcAppliedTaller: string[];
  tcTallerMenuOpen: boolean;
  tcChipsActivo: string[];
  tcAppliedActivo: string[];
  tcActivoMenuOpen: boolean;
  tcPage: number;
  tcPageSize: number;
  almacenExpandedIds: Record<string, boolean>;
  talleres: TallerInfo[];
  tallerPage: number;
  tallerPageSize: number;
  tallerMenuOpenId: string | null;
  tallerModalMode: 'add' | 'edit' | null;
  tallerModalEditId: string | null;
  tallerFormNombre: string;
  tallerFormUbicacion: string;
  tallerFormContacto: string;
  tallerFormTelefono: string;
  tallerFormUso: string[];
  tallerFormUsoMenuOpen: boolean;
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
  flotaBuscar: '',
  flotaSearchAt: '',
  hijo: 'Ruedas',
  chipsActivo: ['Kilómetros'],
  chipsPos: [],
  appliedActivo: ['Kilómetros'],
  appliedPos: [],
  activoMenuOpen: false,
  posMenuOpen: false,
  historialPopupCode: null,
  movUnidad: '',
  movTipoComponente: '',
  movTipoOperacion: '',
  movBuscarId: '',
  movMenuOpenId: null,
  movPage: 1,
  movPageSize: 25,
  detalleRowId: null,
  soloIntercambiados: false,
  almacen: 'Taller Stock Urbos 100',
  dAlmacen: '',
  dTipoComponente: '',
  dNumeroSerie: '',
  numeroSerieNotFound: null,
  almacenApplied: false,
  almacenExpandedTipos: {},
  almacenCheckedIds: {},
  almacenSelectedId: null,
  almacenBuscar: '',
  almacenFilterOpen: false,
  almacenFilter: { conHijos: true, sinHijos: true, conPadre: true, sinPadre: true },
  almacenExpandedIds: {},
  talleres: TALLERES_SEED,
  tallerPage: 1,
  tallerPageSize: 25,
  tallerMenuOpenId: null,
  tallerModalMode: null,
  tallerModalEditId: null,
  tallerFormNombre: '',
  tallerFormUbicacion: '',
  tallerFormContacto: '',
  tallerFormTelefono: '',
  tallerFormUso: [],
  tallerFormUsoMenuOpen: false,
  tcTipo: '',
  tcDTipo: '',
  tcChipsFlota: [],
  tcAppliedFlota: [],
  tcFlotaMenuOpen: false,
  tcChipsTaller: [],
  tcAppliedTaller: [],
  tcTallerMenuOpen: false,
  tcChipsActivo: [],
  tcAppliedActivo: [],
  tcActivoMenuOpen: false,
  tcPage: 1,
  tcPageSize: 10,
};

function formatFechaHora(d: Date): string {
  const p = (v: number) => String(v).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  };

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <span
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              transform: 'translate(-50%, -100%)',
              background: '#18171C',
              color: '#FFF',
              fontSize: 12,
              lineHeight: '16px',
              padding: '6px 10px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
            }}
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  );
}

function Paginator({
  page,
  pageSize,
  total,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = Math.min(clampedPage * pageSize, total);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', color: '#18171C' }}>Elementos por página</span>
      <MatSelect
        label=""
        value={String(pageSize)}
        options={pageSizeOptions.map(String)}
        width={84}
        onSelect={(v) => onPageSizeChange(Number(v))}
      />
      <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', color: '#18171C', whiteSpace: 'nowrap' }}>
        {start} - {end} de {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <MatButtonIcon icon="FirstPage" title="Primera página" disabled={clampedPage <= 1} onClick={() => onPageChange(1)} />
        <MatButtonIcon
          icon="ChevronLeft"
          title="Página anterior"
          disabled={clampedPage <= 1}
          onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
        />
        <MatButtonIcon
          icon="ChevronRight"
          title="Página siguiente"
          disabled={clampedPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, clampedPage + 1))}
        />
        <MatButtonIcon icon="LastPage" title="Última página" disabled={clampedPage >= totalPages} onClick={() => onPageChange(totalPages)} />
      </div>
    </div>
  );
}

function Table({
  cols,
  rows,
  minWidth,
  onIdInfoClick,
  showIdInfo = true,
}: {
  cols: { label: string; sortableActive?: boolean; flex?: string }[];
  rows: { id: string; cells: Cell[] }[];
  minWidth?: number;
  onIdInfoClick?: (code: string) => void;
  showIdInfo?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth }}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {cols.map((col, i) => (
          <div key={i} style={{ flex: col.flex || '1 1 0', minWidth: 0, display: 'flex', overflow: 'hidden' }}>
            <MatCellIndexColStatic label={col.label} />
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
                  {showIdInfo && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onIdInfoClick?.(c.text);
                    }}
                    style={{
                      flexShrink: 0,
                      color: '#474554',
                      display: 'flex',
                      cursor: onIdInfoClick ? 'pointer' : 'default',
                    }}
                  >
                    <Icon name="Info" size={18} />
                  </span>
                  )}
                </div>
              )}
              {c.isText && (
                <div
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
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
                  <span
                    style={{
                      flex: '0 1 auto',
                      minWidth: 0,
                      fontSize: 14,
                      letterSpacing: '0.25px',
                      color: '#18171C',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.text}
                  </span>
                  {c.meta && (
                    <Tooltip text={c.meta || ''}>
                      <span style={{ color: '#474554', display: 'flex', flexShrink: 0 }}>
                        <Icon name="Info" size={18} />
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}
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
                  {c.meta && (
                    <Tooltip text={c.meta || ''}>
                      <span style={{ color: '#474554', display: 'flex' }}>
                        <Icon name="Info" size={18} />
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}
              {c.isTagBool && (
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
                    overflow: 'hidden',
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

function OperationChip({ icons, label, wrap }: { icons: string[]; label: string; wrap?: boolean }) {
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
          whiteSpace: wrap ? 'normal' : 'nowrap',
          overflow: 'hidden',
          textOverflow: wrap ? 'clip' : 'ellipsis',
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
  strike?: boolean;
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

const TAG_ANTES: Omit<DetailTag, 'label'> = { bg: '#FECAC8', fg: '#320301', strike: true };
const TAG_DESPUES: Omit<DetailTag, 'label'> = { bg: '#BAEBCE', fg: '#474554' };

// Fixed demo codes for the two ruedas of an eje in "Intercambio entre unidad y taller" — rojo
// (saliente) / verde (entrante) are swapped between unidad and taller since a wheel leaving one
// side is the wheel arriving at the other.
const RUEDA_ROTACION_CODES = [
  { rojo: '082809-0008', verde: '082809-0009' },
  { rojo: '082810-0001', verde: '082810-0002' },
];

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
      { label: '082809-0008', ...TAG_ANTES },
      { label: '082809-0009', ...TAG_DESPUES },
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
      { label: '082810-0001', ...TAG_ANTES },
      { label: '082810-0002', ...TAG_DESPUES },
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
      { label: '082809-0009', ...TAG_ANTES },
      { label: '082809-0008', ...TAG_DESPUES },
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
      { label: '082810-0002', ...TAG_ANTES },
      { label: '082810-0001', ...TAG_DESPUES },
    ],
    expandIcon: null,
    highlighted: true,
    km: '259.245km',
  },
  { id: 't-b1-e2', depth: 3, label: 'Eje 2', code: 'F462-U-001-C1-B1-E2', expandIcon: 'ChevronRight', km: '259.245km' },
];

// Builds the two detail trees for an "Intercambio entre unidad y taller" row from the REAL
// FLEETS data (Unidad > Coche > Bogie > Eje > Rueda), instead of the static mock above —
// row.antes/despues already carry real codes (see MOVIMIENTOS_BASE).
function buildIntercambioUnidadTallerTrees(
  row: MovimientoRow,
  soloIntercambiados: boolean
): { unidadRows: DetailRow[]; tallerRows: DetailRow[]; unidadLabel: string; tallerLabel: string; rotatedCount: number } | null {
  const unidadAntes = row.antes[0];
  const tallerAntes = row.antes[1];
  const unidadDespues = row.despues[0];
  const tallerDespues = row.despues[1];
  if (!unidadAntes || !tallerAntes || !unidadDespues || !tallerDespues) return null;

  let path: TreeNode[] | null = null;
  for (const flotaRoots of Object.values(FLEETS)) {
    path = findCodePath(flotaRoots, unidadAntes.code);
    if (path) break;
  }
  if (!path || path.length === 0) return null;

  const eje = path[path.length - 1];
  const bogie = path.length >= 2 ? path[path.length - 2] : undefined;
  const coche = path.length >= 3 ? path[path.length - 3] : undefined;
  const unidad = path[0];
  const ruedas = (eje.children || []).filter((c) => c.tipo === 'Rueda');

  const tagsUnidad = [
    { label: unidadAntes.code, ...TAG_ANTES },
    { label: unidadDespues.code, ...TAG_DESPUES },
  ];
  const tagsTaller = [
    { label: unidadDespues.code, ...TAG_ANTES },
    { label: unidadAntes.code, ...TAG_DESPUES },
  ];

  const unidadRows: DetailRow[] = [];
  if (coche) unidadRows.push({ id: 'c', depth: 0, label: coche.label, code: coche.code, expandIcon: 'ExpandMore', km: coche.km });
  if (bogie) unidadRows.push({ id: 'b', depth: 1, label: bogie.label, code: bogie.code, expandIcon: 'ExpandMore', km: bogie.km });
  unidadRows.push({
    id: 'e',
    depth: coche || bogie ? 2 : 0,
    label: eje.label,
    tags: tagsUnidad,
    expandIcon: ruedas.length ? 'ExpandMore' : null,
    highlighted: true,
    extra: ruedas.length ? `${ruedas.length} activos` : undefined,
    km: eje.km,
  });
  const ejeDepth = unidadRows[unidadRows.length - 1].depth;
  ruedas.forEach((rueda, i) => {
    const codes = RUEDA_ROTACION_CODES[i];
    const tagsRuedaUnidad = codes
      ? [
          { label: codes.rojo, ...TAG_ANTES },
          { label: codes.verde, ...TAG_DESPUES },
        ]
      : [
          { label: unidadAntes.code + '-R' + (i + 1), ...TAG_ANTES },
          { label: unidadDespues.code + '-R' + (i + 1), ...TAG_DESPUES },
        ];
    unidadRows.push({ id: 'r' + i, depth: ejeDepth + 1, label: rueda.label, tags: tagsRuedaUnidad, expandIcon: null, highlighted: true, km: rueda.km });
  });
  if (bogie) {
    (bogie.children || [])
      .filter((sib) => sib.tipo === 'Eje' && sib.id !== eje.id)
      .forEach((sib, i) => unidadRows.push({ id: 'sib-e' + i, depth: ejeDepth, label: sib.label, code: sib.code, expandIcon: 'ChevronRight', km: sib.km }));
  }
  if (coche) {
    (coche.children || [])
      .filter((sib) => sib.tipo === 'Bogie' && sib.id !== bogie?.id)
      .forEach((sib, i) => unidadRows.push({ id: 'sib-b' + i, depth: Math.max(ejeDepth - 1, 0), label: sib.label, code: sib.code, expandIcon: 'ChevronRight', km: sib.km }));
  }
  if (unidad.children) {
    unidad.children
      .filter((sib) => sib.tipo === 'Coche' && sib.id !== coche?.id)
      .forEach((sib, i) => unidadRows.push({ id: 'sib-c' + i, depth: 0, label: sib.label, code: sib.code, expandIcon: 'ChevronRight', km: sib.km }));
  }

  const tallerRows: DetailRow[] = [
    {
      id: 't-e',
      depth: 0,
      label: eje.label.replace(/\s*\d+$/, ''),
      tags: tagsTaller,
      expandIcon: ruedas.length ? 'ExpandMore' : null,
      highlighted: true,
      extra: ruedas.length ? `${ruedas.length} activos` : undefined,
      km: eje.km,
    },
    ...ruedas.map((rueda, i) => {
      const codes = RUEDA_ROTACION_CODES[i];
      const tagsRuedaTaller = codes
        ? [
            { label: codes.verde, ...TAG_ANTES },
            { label: codes.rojo, ...TAG_DESPUES },
          ]
        : [
            { label: unidadDespues.code + '-R' + (i + 1), ...TAG_ANTES },
            { label: unidadAntes.code + '-R' + (i + 1), ...TAG_DESPUES },
          ];
      return { id: 't-r' + i, depth: 1, label: rueda.label, tags: tagsRuedaTaller, expandIcon: null, highlighted: true, km: rueda.km };
    }),
  ];

  const filterRows = (rows: DetailRow[]): DetailRow[] => {
    if (!soloIntercambiados) return rows;
    const highlighted = rows.filter((r) => r.highlighted);
    if (!highlighted.length) return highlighted;
    const minDepth = Math.min(...highlighted.map((r) => r.depth));
    return highlighted.map((r) => ({ ...r, depth: r.depth - minDepth }));
  };

  return {
    unidadRows: filterRows(unidadRows),
    tallerRows: filterRows(tallerRows),
    unidadLabel: 'Unidad ' + unidad.code,
    tallerLabel: tallerAntes.title,
    rotatedCount: 1 + ruedas.length,
  };
}

function DetailTagPill({ label, bg, fg, strike }: { label: string; bg: string; fg: string; strike?: boolean }) {
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
        textDecoration: strike ? 'line-through' : 'none',
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
              <DetailTagPill key={i} label={t.label} bg={t.bg} fg={t.fg} strike={t.strike} />
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
  style,
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
  style?: CSSProperties;
}) {
  return (
    <div style={{ position: 'relative', flex: '1 1 340px', maxWidth: 460, ...style }}>
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

  // ---- derived data (ported from renderVals / helper methods) ----
  const roots = FLEETS[s.flota] || [];
  const treeRoots = s.unidad && s.unidad !== 'Todos' ? roots.filter((n) => n.code === s.unidad) : roots;
  const sel = s.selected ? find(roots, s.selected) : null;
  const isFlota = s.screen === 'flota';
  const isConsulta = s.screen === 'consulta';
  const isMovimientos = s.screen === 'movimientos';
  const isDetalleMovimiento = s.screen === 'detalleMovimiento';
  const detalleRow = s.detalleRowId ? MOVIMIENTOS.find((r) => r.id === s.detalleRowId) || null : null;
  const detalleIsUnidadTaller = detalleRow?.operacion === 'Intercambio entre unidad y taller';
  const detalleDynamic = detalleIsUnidadTaller && detalleRow ? buildIntercambioUnidadTallerTrees(detalleRow, s.soloIntercambiados) : null;
  const detalleUnidadRows = detalleDynamic?.unidadRows ?? UNIDAD_TREE;
  const detalleTallerRows = detalleDynamic?.tallerRows ?? TALLER_TREE;
  const detalleUnidadLabel = detalleDynamic?.unidadLabel ?? 'Unidad 1';

  // "Unidad"-shaped titles found in the movimientos mock (e.g. "30801", or "30801 - Eje 1"
  // whose leading token is the unidad) — powers the Unidad filter.
  const movUnidadOf = (title: string) => title.split(' ')[0];
  const movUnidadOptions = [
    'Todos',
    ...Array.from(
      new Set(
        MOVIMIENTOS.flatMap((r) => [...r.antes, ...r.despues])
          .map((p) => movUnidadOf(p.title))
          .filter((t) => /^\d+$/.test(t))
      )
    ),
  ];
  const movBuscarQ = s.movBuscarId.trim().toLowerCase();
  const movFilteredRows = MOVIMIENTOS.filter((r) => {
    if (!s.movUnidad) return false;
    if (s.movUnidad !== 'Todos') {
      const hasUnidad = [...r.antes, ...r.despues].some((p) => movUnidadOf(p.title) === s.movUnidad);
      if (!hasUnidad) return false;
    }
    if (s.movTipoComponente && r.componente !== s.movTipoComponente) return false;
    if (s.movTipoOperacion && r.operacion !== s.movTipoOperacion) return false;
    if (movBuscarQ) {
      const haystack = [r.componente, ...[...r.antes, ...r.despues].flatMap((p) => [p.title, p.code])]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(movBuscarQ)) return false;
    }
    return true;
  });
  const movPageSizeOptions = [10, 25, 50, 100];
  const movTotal = movFilteredRows.length;
  const movTotalPages = Math.max(1, Math.ceil(movTotal / s.movPageSize));
  const movPage = Math.min(Math.max(1, s.movPage), movTotalPages);
  const movPagedRows = movFilteredRows.slice((movPage - 1) * s.movPageSize, movPage * s.movPageSize);

  const isTalleres = s.screen === 'talleres';
  const tallerPageSizeOptions = [10, 25, 50, 100];
  const tallerTotal = s.talleres.length;
  const tallerTotalPages = Math.max(1, Math.ceil(tallerTotal / s.tallerPageSize));
  const tallerPage = Math.min(Math.max(1, s.tallerPage), tallerTotalPages);
  const tallerPagedRows = s.talleres.slice((tallerPage - 1) * s.tallerPageSize, tallerPage * s.tallerPageSize);
  const tallerFormValid = s.tallerFormNombre.trim().length > 0 && s.tallerFormUso.length > 0;
  const tallerEditingLockedName = s.tallerModalMode === 'edit';

  const isTipoComponente = s.screen === 'tipoComponente';

  const isAlmacen = s.screen === 'almacen';
  const almacenData = ALMACENES[s.almacen];
  const almacenFilterFn = (it: AlmacenItem) => {
    const f = s.almacenFilter;
    const hijosOk = it.conHijos ? f.conHijos : f.sinHijos;
    const padreOk = it.conPadre ? f.conPadre : f.sinPadre;
    return hijosOk && padreOk;
  };
  const almacenBuscarQ = s.almacenBuscar.trim().toLowerCase();
  const almacenSearchActive = almacenBuscarQ.length > 0;
  const almacenSearchFn = (it: AlmacenItem) =>
    !almacenSearchActive || it.tipo.toLowerCase().includes(almacenBuscarQ) || it.code.toLowerCase().includes(almacenBuscarQ);
  const almacenAllFlat: AlmacenItem[] = ALMACEN_TIPOS.flatMap((t) => almacenData.items[t.tipo] || []);
  const almacenCheckedItems = almacenAllFlat.filter((it) => s.almacenCheckedIds[it.id]);
  const almacenMulti = almacenCheckedItems.length > 1;
  const almacenSel = almacenMulti
    ? null
    : almacenCheckedItems.length === 1
    ? almacenCheckedItems[0]
    : s.almacenSelectedId
    ? almacenAllFlat.find((it) => it.id === s.almacenSelectedId) || null
    : null;
  const almacenAllExpanded = ALMACEN_TIPOS.every((t) => s.almacenExpandedTipos[t.tipo]);
  const almacenFilterActive =
    !s.almacenFilter.conHijos || !s.almacenFilter.sinHijos || !s.almacenFilter.conPadre || !s.almacenFilter.sinPadre;

  const flatten = (): TreeNode[] => {
    const out: TreeNode[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        out.push(n);
        if (n.children && n.children.length && s.expanded[n.id]) walk(n.children);
      }
    };
    walk(treeRoots);
    return out;
  };

  const flattenAll = (): TreeNode[] => {
    const out: TreeNode[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        out.push(n);
        if (n.children && n.children.length) walk(n.children);
      }
    };
    walk(treeRoots);
    return out;
  };

  const flotaBuscarQ = s.flotaBuscar.trim().toLowerCase();
  const treeSearchActive = flotaBuscarQ.length > 0;
  const treeSourceNodes = treeSearchActive
    ? flattenAll().filter(
        (n) =>
          (n.tipo || '').toLowerCase().includes(flotaBuscarQ) ||
          (n.label || '').toLowerCase().includes(flotaBuscarQ) ||
          (n.code || '').toLowerCase().includes(flotaBuscarQ)
      )
    : flatten();

  const treeRows = treeSourceNodes.map((n) => ({
    id: n.id,
    label: n.label,
    code: n.code,
    depth: treeSearchActive ? 0 : n.depth,
    state: (s.checkedIds[n.id] ? 'Selected' : 'Default') as 'Selected' | 'Default',
    expanded: treeSearchActive ? false : !!s.expanded[n.id],
    trailing: <TagSemanticStatus status="Info" label={n.km} />,
    onClick: (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        patch((prev) => {
          const next = { ...prev.checkedIds };
          if (next[n.id]) delete next[n.id];
          else next[n.id] = true;
          const keys = Object.keys(next);
          return {
            checkedIds: next,
            selected: keys.length === 1 ? keys[0] : keys.length === 0 ? null : prev.selected,
            tab: keys.length > 1 ? 0 : prev.tab,
          };
        });
        return;
      }
      patch({ selected: n.id, checkedIds: { [n.id]: true }, tab: 0 });
    },
    onToggleExpand: treeSearchActive
      ? undefined
      : () => {
          if (!n.children || !n.children.length) return;
          patch((prev) => ({ expanded: { ...prev.expanded, [n.id]: !prev.expanded[n.id] } }));
        },
  }));

  const typeGroups: Record<string, TreeNode[]> = { Unidad: [], Coche: [], Bogie: [], Eje: [], Rueda: [], Reductora: [] };
  (function walkTypes(nodes: TreeNode[]) {
    nodes.forEach((n) => {
      const t = n.tipo || 'Eje';
      if (
        typeGroups[t] &&
        (!treeSearchActive ||
          t.toLowerCase().includes(flotaBuscarQ) ||
          (n.label || '').toLowerCase().includes(flotaBuscarQ) ||
          (n.code || '').toLowerCase().includes(flotaBuscarQ))
      ) {
        typeGroups[t].push(n);
      }
      if (n.children) walkTypes(n.children);
    });
  })(treeRoots);

  type TypeRow = {
    id: string;
    label: string;
    isChild: boolean;
    chevron: string | null;
    checked: boolean | 'indeterminate';
    pos: string;
    trailing: ReactNode;
    onClick?: () => void;
    onChevron?: (e: MouseEvent) => void;
    onCheck: () => void;
  };
  const typeRows: TypeRow[] = [];
  Object.keys(typeGroups).forEach((t) => {
    const list = typeGroups[t];
    if (!list.length) return;
    const open = !!s.typeOpen[t];
    const checkedCount = list.filter((n) => s.checkedIds[n.id]).length;
    typeRows.push({
      id: 'g-' + t,
      label: t,
      isChild: false,
      chevron: open ? 'ExpandMore' : 'ChevronRight',
      checked: checkedCount === 0 ? false : checkedCount === list.length ? true : 'indeterminate',
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
          const keys = Object.keys(next);
          return {
            checkedIds: next,
            selected: keys.length === 1 ? keys[0] : keys.length === 0 ? null : prev.selected,
            tab: 0,
          };
        }),
    });
    if (!open) return;
    list.forEach((n) => {
      typeRows.push({
        id: n.id,
        label: n.code,
        pos: n.label,
        isChild: true,
        chevron: null,
        checked: !!s.checkedIds[n.id],
        trailing: <TagSemanticStatus status="Info" label={n.km} />,
        onClick: () => patch({ selected: n.id, checkedIds: { [n.id]: true }, tab: 0 }),
        onCheck: () =>
          patch((prev) => {
            const next = { ...prev.checkedIds };
            if (next[n.id]) delete next[n.id];
            else next[n.id] = true;
            const keys = Object.keys(next);
            return {
              checkedIds: next,
              selected: keys.length === 1 ? keys[0] : keys.length === 0 ? null : prev.selected,
              tab: keys.length > 1 ? 0 : prev.tab,
            };
          }),
      });
    });
  });

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
  const histCols = histLabels.map((label) => ({ label }));

  const hijoOptions = (sel && HIJOS[sel.tipo]) || [];
  const hijoValue = hijoOptions.indexOf(s.hijo) !== -1 ? s.hijo : hijoOptions[0] || '';
  const hijoSing = SING[hijoValue] || 'Componente';
  const hijosChildren = (sel?.children || []).filter((c) => (c.tipo || 'Eje') === hijoSing);

  const histRows = buildHistorial(sel);

  const hijoIsLeftRight = hijoSing === 'Rueda' || hijoSing === 'Reductora';
  const cocheCount = Math.max(1, (sel?.children || []).length);
  const hijoCols =
    hijoValue === 'Coches'
      ? ([{ label: 'Fecha desde', flex: W_DESDE }, { label: 'Fecha hasta', flex: W_HASTA }] as {
          label: string;
          flex: string;
        }[]).concat(
          Array.from({ length: cocheCount }, (_, i) => i + 1).reduce<{ label: string; flex: string }[]>(
            (acc, i) => acc.concat([{ label: 'Coche ' + i, flex: W_ID }, { label: 'Kilómetros', flex: W_DRIVER }]),
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
  const hijoMinWidth = hijoValue === 'Coches' ? Math.round((2 + cocheCount * 2) * (1750 / 12)) : undefined;
  const hijoRowsData = buildHijoRows(sel, hijoValue);

  const movHistCols = [{ label: 'Fecha' }, { label: 'Tipo' }, { label: 'Con padre' }, { label: 'Con hijos' }];
  const movHistRows = [
    { id: 'm1', cells: [txtCell('2025-06-30 08:20'), txtCell('Intercambio entre unidades'), txtCell('Sí'), txtCell('No')] },
  ];

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
  const EXTRA: Record<string, (n: unknown, i: number) => string> = {
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
  const buildAtrCell = (label: string, n: TreeNode, i: number, withMeta: boolean) => {
    const seed = (Number(n.code) || i + 1) + label.length;
    if (label === 'Tipo') return txtCell(n.tipo || 'Eje');
    if (label === 'ID') return idCell(n.code);
    if (label === 'Posición') return txtCell(n.label);
    if (label === 'Kilómetros') return kmCell(n.km, undefined, withMeta ? fechaActualizacion(seed) : undefined);
    return txtCell(EXTRA[label] ? EXTRA[label](n, i) : '—', undefined, withMeta ? fechaActualizacion(seed) : undefined);
  };
  const atrNodes = multi ? checkedNodes : sel ? [sel] : [];
  const activoColsLabels = ['Tipo', 'ID', 'Kilómetros'].concat(appA.filter((c) => c !== 'Kilómetros'));
  const posColsLabels = ['Tipo', 'Posición'].concat(appP);
  const activoCols = activoColsLabels.map((label) => ({ label }));
  const posCols = posColsLabels.map((label) => ({ label }));
  const activoRows = atrNodes.map((n, i) => ({ id: 'a' + i, cells: activoColsLabels.map((label) => buildAtrCell(label, n, i, true)) }));
  const posRows = atrNodes.map((n, i) => ({ id: 'p' + i, cells: posColsLabels.map((label) => buildAtrCell(label, n, i, false)) }));
  const contentTabs = multi
    ? ['Atributos de activo', 'Atributos de posición']
    : ['Histórico de vida', 'Atributos de activo', 'Atributos de posición'];
  const tab = s.tab;
  const showHistorial = !multi && !!sel && s.tab === 0;
  const showAtributosActivo = (multi && s.tab === 0) || (!multi && !!sel && s.tab === 1);
  const showAtributosPos = (multi && s.tab === 1) || (!multi && !!sel && s.tab === 2);
  const noSelection = !sel && !multi;

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

  const tcCanShow = (s.tcAppliedFlota.length > 0 || s.tcAppliedTaller.length > 0) && s.tcAppliedActivo.length > 0;
  const tcRows = tcCanShow && s.tcTipo ? buscarPorTipo(s.tcTipo as Tipo) : [];
  const tcFilteredRows = tcRows.filter((r) =>
    r.ubicacion === 'Flota'
      ? s.tcAppliedFlota.includes(r.ubicacionNombre)
      : s.tcAppliedTaller.includes(r.ubicacionNombre)
  );
  const tcColsLabels = ['Ubicación', 'Tipo', 'ID'].concat(s.tcAppliedActivo);
  const tcCols = tcColsLabels.map((label) => ({ label }));
  const tcTableRows = tcFilteredRows.map((r, i) => ({
    id: r.id,
    cells: tcColsLabels.map((label) => {
      if (label === 'Ubicación') return txtCell(r.ubicacionNombre);
      if (label === 'Tipo') return txtCell(r.tipo);
      if (label === 'ID') return idCell(r.code);
      const seed = (Number(r.code) || i + 1) + label.length;
      if (label === 'Kilómetros') {
        const hash = (seed * 2654435761) % 300000;
        return kmCell((50 + hash / 1000).toFixed(3) + 'km', undefined, fechaActualizacion(seed));
      }
      return txtCell(EXTRA[label] ? EXTRA[label](r, i) : '—', undefined, fechaActualizacion(seed));
    }),
  }));

  const tcPageSizeOptions = [10, 25, 50, 100];
  const tcTotal = tcTableRows.length;
  const tcTotalPages = Math.max(1, Math.ceil(tcTotal / s.tcPageSize));
  const tcPage = Math.min(Math.max(1, s.tcPage), tcTotalPages);
  const tcPagedRows = tcTableRows.slice((tcPage - 1) * s.tcPageSize, tcPage * s.tcPageSize);

  const historialPopupHit = s.historialPopupCode ? findAnywhereByCode(s.historialPopupCode) : null;
  const historialPopupTreeAnc = historialPopupHit?.kind === 'tree' ? ANCESTORS[historialPopupHit.node.tipo] || [] : [];
  const historialPopupCols =
    historialPopupHit?.kind === 'almacen'
      ? [{ label: 'Unidad' }, { label: 'Coche' }, { label: 'Bogie' }, { label: 'Fecha de montaje' }, { label: 'Fecha de desmontaje' }, { label: 'Kilometraje parcial' }]
      : (historialPopupTreeAnc as string[])
          .concat(['Fecha de montaje', 'Fecha de desmontaje', 'Kilometraje parcial'])
          .map((label) => ({ label }));
  const historialPopupRows =
    historialPopupHit?.kind === 'tree'
      ? buildHistorial(historialPopupHit.node)
      : historialPopupHit?.kind === 'almacen'
      ? almacenHistorial(historialPopupHit.item)
      : [];

  const unidadOptions = ['Todos'].concat(roots.map((n) => n.code));
  const treeTabs = ['Por estructura', 'Por componente'];
  const shortcutCards = [
    { title: 'Movimientos', body: 'Consulta el histórico de operaciones' },
    { title: 'Talleres', body: 'Información de talleres' },
    { title: 'Lineas', body: 'Consulta las líneas asignadas a las flotas' },
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
          <Image
            src="/assets/logo-caf.svg"
            alt="CAF"
            width={61}
            height={24}
            style={{ cursor: 'pointer' }}
            onClick={() => patch({ screen: 'consulta' })}
          />
          <PiecesNavbarItemGroup items={['Consultas', 'Operaciones', 'Registro']} selected={0} />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'stretch' }}>
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
                    <Icon name="Train" size={24} />
                  </span>
                  <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#18171C' }}>En flota</span>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    background: '#F9F9FB',
                    border: '1px solid #C8C7D1',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 16,
                    padding: 24,
                    alignItems: 'flex-end',
                    boxSizing: 'border-box',
                    alignSelf: 'stretch',
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
                    label="Consultar"
                    onClick={() =>
                      patch({
                        screen: 'flota',
                        selected: null,
                        expanded: {},
                        applied: false,
                        dUnidad: '',
                        checkedIds: {},
                        typeOpen: {},
                        flotaBuscar: '',
                        flotaSearchAt: '',
                      })
                    }
                  />
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
                    <Icon name="Warehouse" size={24} />
                  </span>
                  <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#18171C' }}>En almacén</span>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    background: '#F9F9FB',
                    border: '1px solid #C8C7D1',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 16,
                    padding: 24,
                    alignItems: 'flex-end',
                    boxSizing: 'border-box',
                    alignSelf: 'stretch',
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
                    label="Consultar"
                    onClick={() =>
                      patch({
                        screen: 'almacen',
                        dAlmacen: s.almacen,
                        almacenApplied: true,
                        almacenExpandedTipos: {},
                        almacenCheckedIds: {},
                        almacenSelectedId: null,
                        almacenBuscar: '',
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'stretch' }}>
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
                  <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#18171C' }}>Número de serie</span>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    background: '#F9F9FB',
                    border: '1px solid #C8C7D1',
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
                    <MatFormField
                      label="Número de serie"
                      width="100%"
                      value={s.dNumeroSerie}
                      onChange={(v) => patch({ dNumeroSerie: v, numeroSerieNotFound: null })}
                    />
                  </div>
                  <MatButtonTonal
                    label="Consultar"
                    disabled={!s.dNumeroSerie.trim()}
                    onClick={() => {
                      const code = s.dNumeroSerie.trim();
                      const hit = findAnywhereByCode(code);
                      if (!hit) {
                        patch({ numeroSerieNotFound: code });
                        return;
                      }
                      if (hit.kind === 'tree') {
                        patch({
                          screen: 'flota',
                          flota: hit.flotaNombre,
                          unidad: hit.node.unidadCode || 'Todos',
                          dUnidad: hit.node.unidadCode || '',
                          applied: true,
                          treeTab: 0,
                          selected: hit.node.id,
                          checkedIds: { [hit.node.id]: true },
                          expanded: {},
                          typeOpen: {},
                          tab: 0,
                          flotaBuscar: code,
                          flotaSearchAt: formatFechaHora(new Date()),
                          numeroSerieNotFound: null,
                        });
                      } else {
                        patch({
                          screen: 'almacen',
                          almacen: hit.almacenNombre,
                          dAlmacen: hit.almacenNombre,
                          almacenApplied: true,
                          almacenExpandedTipos: {},
                          almacenCheckedIds: {},
                          almacenSelectedId: hit.item.id,
                          almacenBuscar: code,
                          tab: 0,
                          numeroSerieNotFound: null,
                        });
                      }
                    }}
                    style={
                      s.dNumeroSerie.trim() ? undefined : { background: 'rgba(13,13,13,0.1)', color: 'rgba(24,23,28,0.38)' }
                    }
                  />
                  {s.numeroSerieNotFound && (
                    <span style={{ flexBasis: '100%', fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#8C1D18' }}>
                      No se ha encontrado ningún componente con el número de serie &quot;{s.numeroSerieNotFound}&quot;.
                    </span>
                  )}
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
                    <Icon name="Widgets" size={24} />
                  </span>
                  <span style={{ fontWeight: 500, fontSize: 24, lineHeight: '32px', color: '#18171C' }}>Listado de atributos</span>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    background: '#F9F9FB',
                    border: '1px solid #C8C7D1',
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
                  <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <MatSelect
                      label="Tipo de componente"
                      value={s.dTipoComponente || 'Seleccionar'}
                      options={TIPOS_COMPONENTE}
                      width="100%"
                      onSelect={(v) => patch({ dTipoComponente: v })}
                    />
                  </div>
                  <MatButtonTonal
                    label="Consultar"
                    disabled={!s.dTipoComponente}
                    onClick={() =>
                      patch((prev) => ({
                        screen: 'tipoComponente',
                        tcTipo: prev.dTipoComponente,
                        tcDTipo: prev.dTipoComponente,
                        tcChipsFlota: [],
                        tcAppliedFlota: [],
                        tcChipsTaller: [],
                        tcAppliedTaller: [],
                        tcChipsActivo: [],
                        tcAppliedActivo: [],
                        tcPage: 1,
                      }))
                    }
                    style={s.dTipoComponente ? undefined : { background: 'rgba(13,13,13,0.1)', color: 'rgba(24,23,28,0.38)' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 32 }}>
              <span style={{ fontSize: 24, lineHeight: '32px', color: '#000' }}>Otras búsquedas</span>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'stretch' }}>
                {shortcutCards.map((card) => {
                  const onOpen =
                    card.title === 'Movimientos'
                      ? () => patch({ screen: 'movimientos' })
                      : card.title === 'Talleres'
                      ? () => patch({ screen: 'talleres' })
                      : undefined;
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
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <MatSelect
                label="Flota"
                value={s.flota}
                options={flotaOptions}
                width={250}
                onSelect={(v) => patch({ flota: v, unidad: 'Todos', selected: null, expanded: {} })}
              />
              <MatSelect label="Unidad" value={s.dUnidad || 'Seleccionar'} options={unidadOptions} width={250} onSelect={(v) => patch({ dUnidad: v })} />
            </div>
            <MatButtonTonal
              label="Aplicar"
              onClick={() => {
                const searchAt = formatFechaHora(new Date());
                patch((prev) => ({
                  applied: true,
                  unidad: prev.dUnidad || 'Todos',
                  treeTab: 0,
                  selected: null,
                  expanded: {},
                  checkedIds: {},
                  typeOpen: {},
                  flotaBuscar: '',
                  flotaSearchAt: searchAt,
                }));
              }}
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
              <div style={{ border: '1px solid #C8C7D1', flexShrink: 0 }}>
                <MatTabs tabs={treeTabs} selected={s.treeTab} onSelect={(i) => patch({ treeTab: i })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: 24, gap: 24, boxSizing: 'border-box', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <MatFormField label="Buscar" width="100%" value={s.flotaBuscar} onChange={(v) => patch({ flotaBuscar: v })} />
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      height: 40,
                      width: 220,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 4px 0 16px',
                      border: '1px solid #77728D',
                      borderRadius: 4,
                      boxSizing: 'border-box',
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
                    <span style={{ flex: 1, fontSize: 16, lineHeight: '24px', letterSpacing: '0.5px', color: '#18171C', whiteSpace: 'nowrap' }}>
                      {s.flotaSearchAt || '-'}
                    </span>
                    <MatButtonIcon icon="CalendarMonth" title="Elegir fecha" />
                  </div>
                </div>

                {emptyFleet && <EmptyState icon="AccountTree" text="Esta flota no tiene datos cargados" width="100%" height={168} />}
                {notApplied && !emptyFleet && (
                  <EmptyState icon="AccountTree" text="Elige una unidad y pulsa Aplicar" width="100%" height={360} />
                )}
                {showTree &&
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
                      onToggleExpand={row.onToggleExpand}
                    />
                  ))}
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
                      <div style={{ flexShrink: 0 }}>{row.trailing}</div>
                    </div>
                  ))}
                {showTree && (
                  <MatButtonText label="Descargar arbol" icon="Download" style={{ padding: '6px 8px', height: 32, alignSelf: 'flex-start' }} />
                )}
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

              {!multi && (
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
                      {sel ? sel.label : 'Sin selección'}
                    </span>
                    <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#474554', whiteSpace: 'nowrap' }}>
                      {sel ? sel.code : '-'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 32, justifyContent: 'flex-end', alignItems: 'center', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', flexShrink: 0 }}>
                      <span style={{ fontWeight: 500, fontSize: 11, lineHeight: '16px', letterSpacing: '0.5px', color: '#474554' }}>Kilómetros</span>
                      {sel ? <TagSemanticStatus status="Info" label={sel.km} /> : <span style={{ color: '#18171C' }}>-</span>}
                    </div>
                    {(sel
                      ? [
                          { title: 'Tipo', value: sel.tipo || '-' },
                          { title: 'GMAO', value: sel.gmao || '-' },
                          { title: 'Tag', value: sel.tag || '-' },
                        ]
                      : [{ title: 'Tipo', value: '-' }]
                    ).map((m) => (
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: 32, boxSizing: 'border-box', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                      <span style={{ fontWeight: 500, fontSize: 16, lineHeight: '25px', letterSpacing: '0.15px', color: '#18171C' }}>
                        Histórico
                      </span>
                      <Table
                        cols={histCols}
                        rows={histRows}
                        onIdInfoClick={(code) => patch({ historialPopupCode: code })}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                          <Table
                            cols={hijoCols}
                            rows={hijoRowsData}
                            minWidth={hijoMinWidth}
                            onIdInfoClick={(code) => patch({ historialPopupCode: code })}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <MatButtonOutlined label="Descargar" icon="Download" />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                      <span style={{ fontWeight: 500, fontSize: 16, lineHeight: '25px', letterSpacing: '0.15px', color: '#18171C' }}>
                        Movimientos
                      </span>
                      <Table cols={movHistCols} rows={movHistRows} />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

                    <Table cols={activoCols} rows={activoRows} onIdInfoClick={(code) => patch({ historialPopupCode: code })} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <MatButtonOutlined label="Descargar" icon="Download" />
                    </div>
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <MatButtonOutlined label="Descargar" icon="Download" />
                    </div>
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
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <MatSelect
                  label="Flota"
                  value={s.flota}
                  options={flotaOptions}
                  width={250}
                  onSelect={(v) => patch({ flota: v, movUnidad: '', movPage: 1 })}
                />
                <MatSelect
                  label="Unidad"
                  value={s.movUnidad || 'Seleccionar'}
                  options={movUnidadOptions}
                  width={250}
                  onSelect={(v) => patch({ movUnidad: v, movPage: 1 })}
                />
              </div>
              <MatButtonTonal label="Aplicar" onClick={() => patch({ movPage: 1 })} />
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
                  onSelect={(v) => patch({ movTipoComponente: v, movPage: 1 })}
                  clearable
                  onClear={() => patch({ movTipoComponente: '', movPage: 1 })}
                />
                <MatSelect
                  label="Tipo de operación"
                  value={s.movTipoOperacion}
                  options={TIPOS_OPERACION}
                  width={250}
                  onSelect={(v) => patch({ movTipoOperacion: v, movPage: 1 })}
                  clearable
                  onClear={() => patch({ movTipoOperacion: '', movPage: 1 })}
                />
                <MatFormField
                  label="Buscar ID, componente, unidad..."
                  width={280}
                  value={s.movBuscarId}
                  onChange={(v) => patch({ movBuscarId: v, movPage: 1 })}
                />
                <MatButtonFilled label="Descargar CSV" icon="Add" />
              </div>

              {movTotal === 0 ? (
                <EmptyState
                  icon="List"
                  text={
                    s.movUnidad
                      ? 'No se han encontrado movimientos con estos filtros'
                      : 'Selecciona una unidad para ver sus movimientos'
                  }
                  width="100%"
                  height={168}
                />
              ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 1772 }}>
                  <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {[
                      { label: 'FECHA', w: 176 },
                      { label: 'OPERACIÓN', w: 336 },
                      { label: 'COMPONENTE', w: 242 },
                      { label: 'ANTES', w: 485 },
                      { label: 'DESPUES', w: 485 },
                      { label: '', w: 48 },
                    ].map((col) => (
                      <div key={col.label} style={{ width: col.w, flexShrink: 0 }}>
                        <MatCellIndexColStatic label={col.label} />
                      </div>
                    ))}
                  </div>
                  {movPagedRows.map((row) => {
                    const rowClickable = row.operacion === 'Intercambio entre unidad y taller';
                    return (
                    <div
                      key={row.id}
                      onClick={rowClickable ? () => patch({ screen: 'detalleMovimiento', detalleRowId: row.id }) : undefined}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        position: 'relative',
                        cursor: rowClickable ? 'pointer' : 'default',
                      }}
                      onMouseEnter={(e) => rowClickable && (e.currentTarget.style.background = '#F9F9FB')}
                      onMouseLeave={(e) => rowClickable && (e.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        style={{
                          width: 176,
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
                          width: 336,
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
                          width: 242,
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
                          width: 485,
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
                          width: 485,
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
                        onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => e.stopPropagation()}
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
                    );
                  })}
                </div>
              </div>
              )}

              {movTotal > 0 && (
                <Paginator
                  page={s.movPage}
                  pageSize={s.movPageSize}
                  total={movTotal}
                  pageSizeOptions={movPageSizeOptions}
                  onPageChange={(p) => patch({ movPage: p })}
                  onPageSizeChange={(sz) => patch({ movPageSize: sz, movPage: 1 })}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {isTalleres && (
        <div
          data-screen-label="Talleres"
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
          <Breadcrumb items={['Consultas', 'Talleres']} showBack onBack={() => patch({ screen: 'consulta' })} />

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 36, lineHeight: '44px', color: '#18171C' }}>Talleres</span>
            <MatButtonFilled
              label="Añadir taller"
              icon="Add"
              onClick={() =>
                patch({
                  tallerModalMode: 'add',
                  tallerModalEditId: null,
                  tallerFormNombre: '',
                  tallerFormUbicacion: '',
                  tallerFormContacto: '',
                  tallerFormTelefono: '',
                  tallerFormUso: [],
                  tallerFormUsoMenuOpen: false,
                })
              }
            />
          </div>

          <div style={{ borderRadius: 8, background: '#FFF', display: 'flex', flexDirection: 'column', padding: 16, gap: 16, boxSizing: 'border-box' }}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 800 }}>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  {[
                    { label: 'NOMBRE DE TALLER', w: 'flex' },
                    { label: 'UBICACIÓN', w: 'flex' },
                    { label: 'CONTACTO (TELÉFONO)', w: 'flex' },
                    { label: 'USO', w: 'flex' },
                    { label: '', w: 48 },
                  ].map((col) => (
                    <div key={col.label} style={col.w === 'flex' ? { flex: '1 1 0', minWidth: 0 } : { width: col.w, flexShrink: 0 }}>
                      <MatCellIndexColStatic label={col.label} />
                    </div>
                  ))}
                </div>
                {tallerPagedRows.map((t) => (
                  <div key={t.id} style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
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
                        fontSize: 14,
                        letterSpacing: '0.25px',
                        color: '#18171C',
                      }}
                    >
                      {t.nombre}
                    </div>
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
                        fontSize: 14,
                        letterSpacing: '0.25px',
                        color: '#18171C',
                      }}
                    >
                      {t.ubicacion || '—'}
                    </div>
                    <div
                      style={{
                        flex: '1 1 0',
                        minWidth: 0,
                        minHeight: 48,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '4px 8px',
                        borderBottom: '1px solid #C8C7D1',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ fontSize: 14, letterSpacing: '0.25px', color: '#18171C' }}>{t.contacto || '—'}</span>
                      {t.telefono && (
                        <span style={{ fontSize: 12, letterSpacing: '0.4px', color: '#474554' }}>{t.telefono}</span>
                      )}
                    </div>
                    <div
                      style={{
                        flex: '1 1 0',
                        minWidth: 0,
                        minHeight: 48,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 8px',
                        borderBottom: '1px solid #C8C7D1',
                        boxSizing: 'border-box',
                      }}
                    >
                      {t.uso.map((u) => (
                        <span
                          key={u}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: 24,
                            padding: '0 12px',
                            borderRadius: 8,
                            background: '#F0F0F4',
                            color: '#18171C',
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: '16px',
                            letterSpacing: '0.4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {u}
                        </span>
                      ))}
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
                        onClick={() => patch((prev) => ({ tallerMenuOpenId: prev.tallerMenuOpenId === t.id ? null : t.id }))}
                      />
                    </div>
                    {s.tallerMenuOpenId === t.id && (
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
                        <div
                          onClick={() =>
                            patch({
                              tallerMenuOpenId: null,
                              tallerModalMode: 'edit',
                              tallerModalEditId: t.id,
                              tallerFormNombre: t.nombre,
                              tallerFormUbicacion: t.ubicacion,
                              tallerFormContacto: t.contacto,
                              tallerFormTelefono: t.telefono,
                              tallerFormUso: t.uso.slice(),
                              tallerFormUsoMenuOpen: false,
                            })
                          }
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
                          <Icon name="Edit" size={18} />
                          Editar
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Paginator
              page={s.tallerPage}
              pageSize={s.tallerPageSize}
              total={tallerTotal}
              pageSizeOptions={tallerPageSizeOptions}
              onPageChange={(p) => patch({ tallerPage: p })}
              onPageSizeChange={(sz) => patch({ tallerPageSize: sz, tallerPage: 1 })}
            />
          </div>
        </div>
      )}

      {s.tallerModalMode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24,23,28,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => patch({ tallerModalMode: null })}
        >
          <div
            style={{
              width: 568,
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#FFF',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 20, fontWeight: 500, color: '#18171C' }}>
                {s.tallerModalMode === 'add' ? 'Añadir taller' : 'Editar taller'}
              </span>
              <MatButtonIcon icon="Close" title="Cerrar" onClick={() => patch({ tallerModalMode: null })} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <MatFormField
                label="Nombre de taller*"
                width="100%"
                value={s.tallerFormNombre}
                onChange={(v) => patch({ tallerFormNombre: v })}
                disabled={tallerEditingLockedName}
              />
              <MatFormField
                label="Ubicación"
                width="100%"
                value={s.tallerFormUbicacion}
                onChange={(v) => patch({ tallerFormUbicacion: v })}
              />
              <MatFormField
                label="Contacto"
                width="100%"
                value={s.tallerFormContacto}
                onChange={(v) => patch({ tallerFormContacto: v })}
              />
              <MatFormField
                label="Teléfono"
                width="100%"
                value={s.tallerFormTelefono}
                onChange={(v) => patch({ tallerFormTelefono: v })}
              />
              <AtributoChipField
                label="Uso*"
                chips={s.tallerFormUso}
                options={USOS_TALLER}
                empty={s.tallerFormUso.length === 0}
                menuOpen={s.tallerFormUsoMenuOpen}
                chipColor="#E5E3EC"
                chipText="#18171C"
                closeColor="#474554"
                style={{ flex: '0 0 auto', width: '100%', maxWidth: 'none' }}
                onToggleChip={(label) =>
                  patch((prev) => ({
                    tallerFormUso: prev.tallerFormUso.includes(label)
                      ? prev.tallerFormUso.filter((c) => c !== label)
                      : prev.tallerFormUso.concat([label]),
                  }))
                }
                onToggleMenu={() => patch((prev) => ({ tallerFormUsoMenuOpen: !prev.tallerFormUsoMenuOpen }))}
              />
              {/* Reserves room for the dropdown's absolutely-positioned menu so it doesn't
                  overlap the Cancelar/Guardar row right below it. */}
              {s.tallerFormUsoMenuOpen && <div style={{ height: USOS_TALLER.length * 40 + 16, flexShrink: 0 }} />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }}>
              <MatButtonOutlined label="Cancelar" onClick={() => patch({ tallerModalMode: null })} />
              <MatButtonFilled
                label={s.tallerModalMode === 'add' ? 'Añadir' : 'Guardar'}
                disabled={!tallerFormValid}
                onClick={() => {
                  if (!tallerFormValid) return;
                  if (s.tallerModalMode === 'add') {
                    const newTaller: TallerInfo = {
                      id: 'taller-' + Math.random().toString(36).slice(2),
                      nombre: s.tallerFormNombre.trim(),
                      ubicacion: s.tallerFormUbicacion.trim(),
                      contacto: s.tallerFormContacto.trim(),
                      telefono: s.tallerFormTelefono.trim(),
                      uso: s.tallerFormUso.slice(),
                      editableName: true,
                    };
                    patch((prev) => ({ talleres: prev.talleres.concat([newTaller]), tallerModalMode: null }));
                  } else if (s.tallerModalEditId) {
                    const editId = s.tallerModalEditId;
                    patch((prev) => ({
                      talleres: prev.talleres.map((t) =>
                        t.id === editId
                          ? {
                              ...t,
                              ubicacion: s.tallerFormUbicacion.trim(),
                              contacto: s.tallerFormContacto.trim(),
                              telefono: s.tallerFormTelefono.trim(),
                              uso: s.tallerFormUso.slice(),
                            }
                          : t
                      ),
                      tallerModalMode: null,
                    }));
                  }
                }}
              />
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

          <div style={{ borderRadius: 8, background: '#FFF', display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 40, padding: 24, boxSizing: 'border-box', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: '8px', boxSizing: 'border-box' }}>
                  <Icon name="Train" size={24} />
                  <span style={{ fontWeight: 500, fontSize: 22, lineHeight: '28px', color: '#000' }}>{detalleUnidadLabel}</span>
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
                  {detalleUnidadRows.map((row) => (
                    <DetailTreeRow key={row.id} row={row} />
                  ))}
                </div>
              </div>

              <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40 }}>
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
                  <OperationChip icons={detalleRow.operacionIcons} label={detalleRow.operacion} wrap />
                  <span style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.4px', color: '#000' }}>{detalleRow.fecha}</span>
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
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: '8px', boxSizing: 'border-box' }}>
                  <Icon name="Warehouse" size={24} />
                  <span style={{ fontWeight: 500, fontSize: 22, lineHeight: '28px', color: '#000' }}>Taller</span>
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
                  {detalleTallerRows.map((row) => (
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
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
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
                  almacenBuscar: '',
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
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: '1 1 0', minWidth: 0 }}>
                        <MatFormField
                          label="Buscar"
                          width="100%"
                          value={s.almacenBuscar}
                          onChange={(v) => patch({ almacenBuscar: v })}
                        />
                      </div>
                      {almacenFilterActive && (
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
                      )}
                      <div style={{ display: 'flex', flexDirection: 'row', gap: 4, flexShrink: 0 }}>
                        <MatButtonIcon
                          icon="UnfoldLess"
                          title={almacenAllExpanded ? 'Colapsar todo' : 'Expandir todo'}
                          onClick={() =>
                            patch(() => {
                              const next: Record<string, boolean> = {};
                              if (!almacenAllExpanded) ALMACEN_TIPOS.forEach((t) => (next[t.tipo] = true));
                              return { almacenExpandedTipos: next };
                            })
                          }
                        />
                        <MatButtonIcon
                          icon="Filter"
                          title="Filtros"
                          onClick={() => patch({ almacenFilterOpen: true })}
                          style={almacenFilterActive ? { color: '#2B1C74' } : undefined}
                        />
                      </div>
                    </div>
                    <MatDividerHorizontal />

                    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 680, overflowY: 'auto' }}>
                      {ALMACEN_TIPOS.map((t) => {
                        const rawItems = almacenData.items[t.tipo] || [];
                        const filteredItems = rawItems.filter(almacenFilterFn).filter(almacenSearchFn);
                        if (almacenSearchActive && filteredItems.length === 0) return null;
                        const expanded = almacenSearchActive ? filteredItems.length > 0 : !!s.almacenExpandedTipos[t.tipo];
                        const allCheckedInTipo = filteredItems.length > 0 && filteredItems.every((it) => s.almacenCheckedIds[it.id]);
                        const someCheckedInTipo = filteredItems.some((it) => s.almacenCheckedIds[it.id]);
                        const tipoCheckState: boolean | 'indeterminate' = allCheckedInTipo ? true : someCheckedInTipo ? 'indeterminate' : false;
                        const toggleTipoChecked = () =>
                          patch((prev) => {
                            const next = { ...prev.almacenCheckedIds };
                            if (allCheckedInTipo) filteredItems.forEach((it) => delete next[it.id]);
                            else filteredItems.forEach((it) => (next[it.id] = true));
                            return { almacenCheckedIds: next, almacenSelectedId: null, tab: 0 };
                          });
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
                              <MatCheckbox checked={tipoCheckState} onChange={toggleTipoChecked} />
                              <span style={{ flex: 1, fontSize: 16, lineHeight: '24px', letterSpacing: '0.5px', color: '#170F3E' }}>{t.label}</span>
                              <span
                                title={almacenFilterActive ? `Filtrado: ${filteredItems.length} de ${almacenData.counts[t.tipo] || 0}` : undefined}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  height: 24,
                                  padding: '0 12px',
                                  borderRadius: 8,
                                  background: almacenFilterActive ? '#DFDAF6' : '#F9F9FB',
                                  color: almacenFilterActive ? '#170F3E' : '#18171C',
                                  fontSize: 12,
                                  fontWeight: 500,
                                  lineHeight: '16px',
                                  letterSpacing: '0.4px',
                                }}
                              >
                                {filteredItems.length}
                                {almacenFilterActive ? ` / ${almacenData.counts[t.tipo] || 0}` : ''}
                              </span>
                            </div>

                            {expanded && (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <MatDividerHorizontal />
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
                                      onClick={() =>
                                        patch((prev) => {
                                          const next = { ...prev.almacenCheckedIds };
                                          if (next[it.id]) delete next[it.id];
                                          else next[it.id] = true;
                                          return { almacenCheckedIds: next, almacenSelectedId: null, tab: 0 };
                                        })
                                      }
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
                                            return { almacenCheckedIds: next, almacenSelectedId: null, tab: 0 };
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
                                    <MatDividerHorizontal />
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

          {s.almacenFilterOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(24,23,28,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
              }}
              onClick={() => patch({ almacenFilterOpen: false })}
            >
              <div
                style={{
                  width: 568,
                  background: '#F9F9FB',
                  borderRadius: 28,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  boxSizing: 'border-box',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 24, lineHeight: '32px', color: '#18171C' }}>Filtros de visualización del árbol</span>
                  <MatButtonIcon icon="Close" title="Cerrar" onClick={() => patch({ almacenFilterOpen: false })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'conHijos' as const, pair: 'sinHijos' as const, label: 'Activo con hijos' },
                    { key: 'sinHijos' as const, pair: 'conHijos' as const, label: 'Activo sin hijos' },
                    { key: 'conPadre' as const, pair: 'sinPadre' as const, label: 'Activo con padre' },
                    { key: 'sinPadre' as const, pair: 'conPadre' as const, label: 'Activo sin padre' },
                  ].map((f) => {
                    const isLastOn = s.almacenFilter[f.key] && !s.almacenFilter[f.pair];
                    return (
                      <SlideToggle
                        key={f.key}
                        label={f.label}
                        checked={s.almacenFilter[f.key]}
                        locked={isLastOn}
                        lockedTitle="Debe quedar seleccionada al menos una de las dos opciones"
                        onChange={() =>
                          patch((prev) => {
                            if (prev.almacenFilter[f.key] && !prev.almacenFilter[f.pair]) return {};
                            return { almacenFilter: { ...prev.almacenFilter, [f.key]: !prev.almacenFilter[f.key] } };
                          })
                        }
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 16, justifyContent: 'flex-end' }}>
                  <MatButtonOutlined label="Cancelar" onClick={() => patch({ almacenFilterOpen: false })} style={{ height: 40 }} />
                  <MatButtonFilled label="Aceptar" onClick={() => patch({ almacenFilterOpen: false })} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isTipoComponente && (
        <div
          data-screen-label="Consultar por tipo de componente"
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
          <Breadcrumb items={['Consultas', 'Listado de atributos']} showBack onBack={() => patch({ screen: 'consulta' })} />

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
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <MatSelect
                label="Tipo de componente"
                value={s.tcDTipo || 'Seleccionar'}
                options={TIPOS_COMPONENTE}
                width={250}
                onSelect={(v) => patch({ tcDTipo: v })}
              />
            </div>
            <MatButtonTonal
              label="Aplicar"
              onClick={() =>
                patch((prev) => ({
                  tcTipo: prev.tcDTipo,
                  tcChipsFlota: [],
                  tcAppliedFlota: [],
                  tcChipsTaller: [],
                  tcAppliedTaller: [],
                  tcChipsActivo: [],
                  tcAppliedActivo: [],
                }))
              }
            />
          </div>

          <div
            style={{
              borderRadius: 8,
              background: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              padding: 16,
              boxSizing: 'border-box',
              flexGrow: 1,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <AtributoChipField
                label="Flota"
                chips={s.tcChipsFlota}
                options={flotaOptions}
                empty={s.tcChipsFlota.length === 0}
                menuOpen={s.tcFlotaMenuOpen}
                chipColor="#E5E3EC"
                chipText="#18171C"
                closeColor="#474554"
                onToggleChip={(label) =>
                  patch((prev) => ({
                    tcChipsFlota: prev.tcChipsFlota.includes(label)
                      ? prev.tcChipsFlota.filter((c) => c !== label)
                      : prev.tcChipsFlota.concat([label]),
                  }))
                }
                onToggleMenu={() =>
                  patch((prev) => ({ tcFlotaMenuOpen: !prev.tcFlotaMenuOpen, tcTallerMenuOpen: false, tcActivoMenuOpen: false }))
                }
              />
              <AtributoChipField
                label="Taller"
                chips={s.tcChipsTaller}
                options={almacenOptions}
                empty={s.tcChipsTaller.length === 0}
                menuOpen={s.tcTallerMenuOpen}
                chipColor="#D7E3FF"
                chipText="#0B3A8C"
                closeColor="#0B3A8C"
                onToggleChip={(label) =>
                  patch((prev) => ({
                    tcChipsTaller: prev.tcChipsTaller.includes(label)
                      ? prev.tcChipsTaller.filter((c) => c !== label)
                      : prev.tcChipsTaller.concat([label]),
                  }))
                }
                onToggleMenu={() =>
                  patch((prev) => ({ tcTallerMenuOpen: !prev.tcTallerMenuOpen, tcFlotaMenuOpen: false, tcActivoMenuOpen: false }))
                }
              />
              <AtributoChipField
                label="Atributo activo"
                chips={s.tcChipsActivo}
                options={activoOpts}
                empty={s.tcChipsActivo.length === 0}
                menuOpen={s.tcActivoMenuOpen}
                chipColor="#E5E3EC"
                chipText="#18171C"
                closeColor="#474554"
                onToggleChip={(label) =>
                  patch((prev) => ({
                    tcChipsActivo: prev.tcChipsActivo.includes(label)
                      ? prev.tcChipsActivo.filter((c) => c !== label)
                      : prev.tcChipsActivo.concat([label]),
                  }))
                }
                onToggleMenu={() =>
                  patch((prev) => ({ tcActivoMenuOpen: !prev.tcActivoMenuOpen, tcFlotaMenuOpen: false, tcTallerMenuOpen: false }))
                }
              />
              <div style={{ display: 'flex', alignItems: 'center', minHeight: 56 }}>
                <MatButtonTonal
                  label="Aplicar"
                  onClick={() =>
                    patch((prev) => ({
                      tcAppliedFlota: prev.tcChipsFlota.slice(),
                      tcAppliedTaller: prev.tcChipsTaller.slice(),
                      tcAppliedActivo: prev.tcChipsActivo.slice(),
                      tcFlotaMenuOpen: false,
                      tcTallerMenuOpen: false,
                      tcActivoMenuOpen: false,
                      tcPage: 1,
                    }))
                  }
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontWeight: 500, fontSize: 16, lineHeight: '25px', letterSpacing: '0.15px', color: '#18171C' }}>
                Atributos de activo
              </span>
              {!tcCanShow ? (
                <EmptyState
                  icon="Component"
                  text="Elige al menos una flota o un taller, y un atributo activo, y pulsa Aplicar"
                  width="100%"
                  height={168}
                />
              ) : tcTableRows.length === 0 ? (
                <EmptyState icon="Component" text="No se han encontrado componentes de este tipo" width="100%" height={168} />
              ) : (
                <>
                  <Table cols={tcCols} rows={tcPagedRows} onIdInfoClick={(code) => patch({ historialPopupCode: code })} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <MatButtonOutlined label="Descargar" icon="Download" />
                  </div>
                  <Paginator
                    page={s.tcPage}
                    pageSize={s.tcPageSize}
                    total={tcTotal}
                    pageSizeOptions={tcPageSizeOptions}
                    onPageChange={(p) => patch({ tcPage: p })}
                    onPageSizeChange={(sz) => patch({ tcPageSize: sz, tcPage: 1 })}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {s.historialPopupCode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24,23,28,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => patch({ historialPopupCode: null })}
        >
          <div
            style={{
              width: 720,
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#FFF',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 500, color: '#18171C' }}>Histórico de este componente</span>
                <span style={{ fontSize: 14, color: '#474554' }}>{s.historialPopupCode}</span>
              </div>
              <MatButtonIcon icon="Close" title="Cerrar" onClick={() => patch({ historialPopupCode: null })} />
            </div>
            <Table cols={historialPopupCols} rows={historialPopupRows} showIdInfo={false} />
          </div>
        </div>
      )}
    </div>
  );
}
