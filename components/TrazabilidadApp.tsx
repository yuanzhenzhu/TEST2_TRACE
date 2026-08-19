'use client';

import Image from 'next/image';
import { MouseEvent, ReactNode, useState } from 'react';
import { Icon } from './ui/Icon';
import { MatButtonIcon, MatButtonTonal } from './ui/Buttons';
import { MatSelect } from './ui/MatSelect';
import {
  Breadcrumb,
  EmptyState,
  MatAvatar,
  MatCellCellText,
  MatCellIndexColDynamic,
  MatCellIndexColStatic,
  MatCheckbox,
  MatFormField,
  MatTabs,
  PiecesNavbarItemGroup,
  PiecesNavbarSelector,
  PiecesNavlistItemNested,
  TagSemanticStatus,
} from './ui/Misc';
import {
  ANCESTORS,
  Cell,
  FLEETS,
  HIJOS,
  SING,
  Tipo,
  TreeNode,
  find,
  hijoRows as buildHijoRows,
  historial as buildHistorial,
  id as idCell,
  km as kmCell,
  txt as txtCell,
} from '@/lib/data';

interface AppState {
  screen: 'consulta' | 'flota';
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
  dMode: string;
  hijo: string;
  chipsActivo: string[];
  chipsPos: string[];
  appliedActivo: string[];
  appliedPos: string[];
  activoMenuOpen: boolean;
  posMenuOpen: boolean;
  sortDesc: boolean;
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
  dMode: '',
  hijo: 'Ruedas',
  chipsActivo: [],
  chipsPos: [],
  appliedActivo: [],
  appliedPos: [],
  activoMenuOpen: false,
  posMenuOpen: false,
  sortDesc: true,
};

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

  const treeRows = flatten().map((n) => ({
    id: n.id,
    label: n.label,
    code: n.code,
    depth: n.depth,
    state: (s.selected === n.id ? 'Selected' : 'Default') as 'Selected' | 'Default',
    expanded: !!s.expanded[n.id],
    trailing: <TagSemanticStatus status="Info" label={n.km} />,
    onClick: () => {
      patch((prev) => {
        const next: Partial<AppState> = { selected: n.id, tab: 0 };
        if (n.children && n.children.length) {
          next.expanded = { ...prev.expanded, [n.id]: !prev.expanded[n.id] };
        }
        return next;
      });
    },
  }));

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
          return { checkedIds: next, selected: all ? prev.selected : list[0].id, tab: 1 };
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
        onClick: () => patch({ selected: n.id, tab: 0 }),
        onCheck: () =>
          patch((prev) => {
            const next = { ...prev.checkedIds };
            if (next[n.id]) delete next[n.id];
            else next[n.id] = true;
            return { checkedIds: next, selected: n.id, tab: Object.keys(next).length > 1 ? 1 : prev.tab };
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
  const histLabels: string[] = (selAnc as string[]).concat(['Montaje', 'Desmontaje', 'Driver parcial']);
  const sortIdx = selAnc.length;
  const histCols = histLabels.map((label) => ({ label }));

  const hijoOptions = (sel && HIJOS[sel.tipo]) || [];
  const hijoValue = hijoOptions.indexOf(s.hijo) !== -1 ? s.hijo : hijoOptions[0] || '';
  const hijoSing = SING[hijoValue] || 'Componente';
  const hijosChildren = (sel?.children || []).filter((c) => (c.tipo || 'Eje') === hijoSing);

  let histRows = buildHistorial(sel);
  if (!s.sortDesc) histRows = histRows.slice().reverse();

  const hijoCols =
    hijoValue === 'Coches'
      ? ([{ label: 'Fecha desde' }, { label: 'Fecha hasta' }] as { label: string }[]).concat(
          [1, 2, 3, 4, 5].reduce<{ label: string }[]>(
            (acc, i) => acc.concat([{ label: 'Coche ' + i }, { label: 'Driver parcial' }]),
            []
          )
        )
      : [
          'Fecha desde',
          'Fecha hasta',
          hijosChildren[0]?.label || hijoSing + ' 1',
          'Driver',
          hijosChildren[1]?.label || hijoSing + ' 2',
          'Driver parcial',
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
  const activoBg = pOn ? '#F3F2F7' : '#FFF';
  const posBg = aOn ? '#F3F2F7' : '#FFF';
  const activoOpacity = pOn ? 0.5 : 1;
  const posOpacity = aOn ? 0.5 : 1;
  const activoMenuOpen = s.activoMenuOpen && !pOn;
  const posMenuOpen = s.posMenuOpen && !aOn;

  const appA = s.appliedActivo;
  const appP = s.appliedPos;
  const atrColsLabels = (appP.length ? ['Tipo', 'Pos', 'Kilómetros'] : ['Tipo', 'ID', 'Pos', 'Kilómetros'])
    .concat(appA.filter((c) => c !== 'Kilómetros'))
    .concat(appP);
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
  const atrNodes = multi ? checkedNodes : sel ? [sel] : [];
  const atrCols = atrColsLabels.map((label) => ({ label }));
  const atrRows = atrNodes.map((n, i) => ({
    id: 'a' + i,
    cells: atrColsLabels.map((label) => {
      if (label === 'Tipo') return txtCell(n.tipo || 'Eje');
      if (label === 'ID') return idCell(n.code);
      if (label === 'Pos') return idCell(String(i + 1));
      if (label === 'Kilómetros') return kmCell(n.km);
      return txtCell(EXTRA[label] ? EXTRA[label](n, i) : '\u2014');
    }),
  }));

  const contentTabs = multi ? ['Atributos'] : ['Historial', 'Atributos'];
  const tab = multi ? 0 : s.tab;
  const showHistorial = !multi && !!sel && s.tab === 0;
  const showAtributos = !!sel && (multi || s.tab === 1);
  const noSelection = !sel;
  const emptyFleet = isFlota && treeRoots.length === 0;
  const notApplied = !s.applied;
  const showTree = s.applied && s.treeTab === 0;
  const showTypes = s.applied && s.treeTab === 1;

  const flotaOptions = ['Urbos 100', 'Zaragoza 3000'];
  const almacenOptions = ['ALM-Mad', 'ALM-Bcn', 'ALM-Zar'];
  const unidadOptions = ['Todos'].concat(roots.map((n) => n.code));
  const treeTabs = ['Estructura árbol', 'Tipo de componente'];
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
                          dMode: '',
                          checkedIds: {},
                          typeOpen: {},
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
                      <MatSelect label="Almacén" value="ALM-Central" options={almacenOptions} width="100%" />
                    </div>
                    <MatButtonTonal label="Consultar almacén" />
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
              {shortcutCards.map((card) => (
                <div
                  key={card.title}
                  style={{
                    flex: '1 1 0',
                    borderRadius: 8,
                    background: '#F9F9FB',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: 24,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 24, lineHeight: '32px', color: '#18171C' }}>{card.title}</span>
                    <MatButtonIcon icon="ChevronRight" />
                  </div>
                  <span style={{ fontSize: 16, lineHeight: '25px', letterSpacing: '0.5px', color: '#18171C' }}>{card.body}</span>
                </div>
              ))}
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
                onSelect={(v) => patch({ flota: v, unidad: 'Todos', selected: null, expanded: {} })}
              />
              <MatSelect label="Unidad" value={s.dUnidad || 'Seleccionar'} options={unidadOptions} width={250} onSelect={(v) => patch({ dUnidad: v })} />
              <MatSelect
                label="Consultar por"
                value={s.dMode || 'Seleccionar'}
                options={treeTabs}
                width={250}
                onSelect={(v) => patch({ dMode: v })}
              />
            </div>
            <MatButtonTonal
              label="Aplicar"
              onClick={() =>
                patch((prev) => ({
                  applied: true,
                  unidad: prev.dUnidad || 'Todos',
                  treeTab: prev.dMode === 'Tipo de componente' ? 1 : 0,
                  selected: null,
                  expanded: {},
                  checkedIds: {},
                  typeOpen: {},
                }))
              }
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'stretch', flexGrow: 1 }}>
            <div
              style={{
                width: 486,
                height: 696,
                flexShrink: 0,
                borderRadius: 8,
                background: '#FFF',
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'flex-start',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', padding: 16, boxSizing: 'border-box', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
                {emptyFleet && <EmptyState icon="AccountTree" text="Esta flota no tiene datos cargados" width="100%" height={168} />}
                {notApplied && !emptyFleet && (
                  <EmptyState icon="AccountTree" text="Elige unidad y tipo de consulta, y pulsa Aplicar" width="100%" height={400} />
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
                        Historial del componente
                      </span>
                      <Table
                        cols={histCols}
                        rows={histRows}
                        sortIdx={sortIdx}
                        sortDesc={s.sortDesc}
                        onSort={() => patch((prev) => ({ sortDesc: !prev.sortDesc }))}
                      />
                    </div>

                    {hijoOptions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <MatSelect label="Componentes" value={hijoValue} options={hijoOptions} width={220} onSelect={(v) => patch({ hijo: v })} />
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <Table cols={hijoCols} rows={hijoRowsData} minWidth={hijoMinWidth} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showAtributos && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 32, boxSizing: 'border-box', flexGrow: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
                            background: activoBg,
                            opacity: activoOpacity,
                          }}
                          onClick={() => {
                            if (!pOn) patch((prev) => ({ activoMenuOpen: !prev.activoMenuOpen, posMenuOpen: false }));
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
                            Atributo activo
                          </span>
                          {activoEmpty && <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', color: '#77728D' }}>Seleccionar</span>}
                          {s.chipsActivo.map((label) => (
                            <span
                              key={label}
                              onClick={(e) => {
                                e.stopPropagation();
                                tA(label);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                height: 32,
                                padding: '0 8px 0 12px',
                                borderRadius: 16,
                                background: '#E5E3EC',
                                color: '#18171C',
                                fontSize: 14,
                                lineHeight: '20px',
                                letterSpacing: '0.25px',
                                cursor: 'pointer',
                              }}
                            >
                              {label}
                              <span style={{ display: 'flex', color: '#474554' }}>
                                <Icon name="Close" size={18} />
                              </span>
                            </span>
                          ))}
                          <span style={{ marginLeft: 'auto', color: '#474554', display: 'flex' }}>
                            <Icon name="ArrowDropDown" size={24} />
                          </span>
                        </div>
                        {activoMenuOpen && (
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
                            {activoOpts.map((label) => {
                              const active = s.chipsActivo.indexOf(label) >= 0;
                              return (
                                <div
                                  key={label}
                                  onClick={() => tA(label)}
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
                                  <span style={{ display: 'flex', color: active ? '#18171C' : 'transparent' }}>
                                    <Icon name={active ? 'Check' : 'Remove'} size={20} />
                                  </span>
                                  {label}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

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
                            background: posBg,
                            opacity: posOpacity,
                          }}
                          onClick={() => {
                            if (!aOn) patch((prev) => ({ posMenuOpen: !prev.posMenuOpen, activoMenuOpen: false }));
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
                            Atributo de posición
                          </span>
                          {posEmpty && <span style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '0.25px', color: '#77728D' }}>Seleccionar</span>}
                          {s.chipsPos.map((label) => (
                            <span
                              key={label}
                              onClick={(e) => {
                                e.stopPropagation();
                                tP(label);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                height: 32,
                                padding: '0 8px 0 12px',
                                borderRadius: 16,
                                background: '#D7E3FF',
                                color: '#0B3A8C',
                                fontSize: 14,
                                lineHeight: '20px',
                                letterSpacing: '0.25px',
                                cursor: 'pointer',
                              }}
                            >
                              {label}
                              <span style={{ display: 'flex', color: '#0B3A8C' }}>
                                <Icon name="Close" size={18} />
                              </span>
                            </span>
                          ))}
                          <span style={{ marginLeft: 'auto', color: '#474554', display: 'flex' }}>
                            <Icon name="ArrowDropDown" size={24} />
                          </span>
                        </div>
                        {posMenuOpen && (
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
                            {posOpts.map((label) => {
                              const active = s.chipsPos.indexOf(label) >= 0;
                              return (
                                <div
                                  key={label}
                                  onClick={() => tP(label)}
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
                                  <span style={{ display: 'flex', color: active ? '#0B3A8C' : 'transparent' }}>
                                    <Icon name={active ? 'Check' : 'Remove'} size={20} />
                                  </span>
                                  {label}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

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
                        <MatButtonTonal label="Aplicar" onClick={() => patch({ appliedActivo: s.chipsActivo.slice(), appliedPos: s.chipsPos.slice(), activoMenuOpen: false, posMenuOpen: false })} />
                      </div>
                    </div>

                    <Table cols={atrCols} rows={atrRows} />
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
