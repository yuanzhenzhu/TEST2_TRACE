// Ported 1:1 from the original prototype logic (Trazabilidad Leadmind.dc.html)

export type Tipo = 'Unidad' | 'Coche' | 'Bogie' | 'Eje' | 'Rueda' | 'Reductora';

export interface TreeNode {
  id: string;
  label: string;
  code: string;
  tipo: Tipo;
  depth: number;
  km: string;
  unidadCode?: string;
  cocheCode?: string;
  bogieCode?: string;
  ejeCode?: string;
  gmao?: string;
  tag?: string;
  children?: TreeNode[];
}

const U3220_KM = '125.668km';
const U3230_KM = '120.670km';
const Z3240_KM = '98.412km';
const Z3250_KM = '102.150km';

const pad = (n: number, len = 3) => String(n).padStart(len, '0');

// Deterministic bijective shuffle (x -> x*mult mod m, gcd(mult,m)=1) so distinct
// inputs always produce distinct "random-looking" outputs \u2014 no collisions.
function shuffle(x: number, mod: number, mult: number): number {
  return (x * mult) % mod;
}

interface CocheOpts {
  unidadCode: string;
  km: string;
  bogieSeqOffset: number;
  ejeBase: number;
  ejeRandom: boolean;
  ruedaPrefix: string;
  ruedaRandom: boolean;
  reductoraPrefixes: [string, string];
  reductoraRandom: boolean;
}

function coche(n: number, i: number, opts: CocheOpts): TreeNode {
  const { unidadCode, km: unidadKm, bogieSeqOffset, ejeBase, ejeRandom, ruedaPrefix, ruedaRandom, reductoraPrefixes, reductoraRandom } = opts;
  return {
    id: 'c' + n,
    label: 'Coche ' + (i + 1),
    code: String(n),
    tipo: 'Coche',
    depth: 1,
    km: unidadKm,
    unidadCode,
    gmao: 'GMAO-' + n,
    tag: '\u2014',
    cocheCode: String(n),
    children: [1, 2].map((b) => {
      const localSeq = i * 2 + b; // 1..10, unique within this unidad
      const seq = bogieSeqOffset + localSeq; // globally unique across unidades
      const bogieCode = '5149-MK6-' + pad(seq);
      return {
        id: 'c' + n + 'b' + b,
        label: 'Bogie ' + seq,
        code: bogieCode,
        tipo: 'Bogie',
        depth: 2,
        km: unidadKm,
        unidadCode,
        gmao: 'GMAO-' + bogieCode,
        tag: 'TAG-' + bogieCode,
        cocheCode: String(n),
        bogieCode,
        children: [1, 2].map((e) => {
          const idx = (localSeq - 1) * 2 + (e - 1); // 0..19, unique within this unidad
          const ejeNum = ejeRandom ? shuffle(idx, 10000, 6803) : idx;
          const ejeCode = String(ejeBase + ejeNum);
          const child = (label: string, code: string, tipo: Tipo, k: string): TreeNode => ({
            id: 'c' + n + 'b' + b + 'e' + e + '-' + k,
            label,
            code,
            tipo,
            depth: 4,
            km: unidadKm,
            unidadCode,
            cocheCode: String(n),
            bogieCode,
            ejeCode,
            gmao: 'GMAO-' + code,
            tag: 'TAG-' + code,
          });
          const r1 = ruedaRandom ? shuffle(idx * 2 + 1, 10000, 6803) : idx * 2 + 1;
          const r2 = ruedaRandom ? shuffle(idx * 2 + 2, 10000, 6803) : idx * 2 + 2;
          const d1 = reductoraRandom ? shuffle(idx * 2 + 1, 1000, 387) : idx * 2 + 1;
          const d2 = reductoraRandom ? shuffle(idx * 2 + 2, 1000, 387) : idx * 2 + 2;
          return {
            id: 'c' + n + 'b' + b + 'e' + e,
            label: 'Eje ' + (idx + 1),
            code: ejeCode,
            tipo: 'Eje',
            depth: 3,
            km: unidadKm,
            unidadCode,
            cocheCode: String(n),
            bogieCode,
            gmao: 'GMAO-' + n + '-' + seq + '-' + e,
            tag: 'TAG-E' + pad(seq) + e,
            children: [
              child('Rueda ' + (idx * 2 + 1), ruedaPrefix + pad(r1, 4), 'Rueda', 'r1'),
              child('Rueda ' + (idx * 2 + 2), ruedaPrefix + pad(r2, 4), 'Rueda', 'r2'),
              child('Reductora ' + (idx * 2 + 1), reductoraPrefixes[0] + pad(d1), 'Reductora', 'd1'),
              child('Reductora ' + (idx * 2 + 2), reductoraPrefixes[1] + pad(d2), 'Reductora', 'd2'),
            ],
          };
        }),
      };
    }),
  };
}

export const FLEETS: Record<string, TreeNode[]> = {
  'Urbos 100': [
    {
      id: 'u3220',
      label: 'Unidad',
      code: '3220',
      tipo: 'Unidad',
      depth: 0,
      km: U3220_KM,
      unidadCode: '3220',
      children: [3221, 3222, 3223, 3224, 3225].map((n, i) =>
        coche(n, i, {
          unidadCode: '3220',
          km: U3220_KM,
          bogieSeqOffset: 0,
          ejeBase: 415875,
          ejeRandom: false,
          ruedaPrefix: '082801-',
          ruedaRandom: false,
          reductoraPrefixes: ['9427/B/', '9427/A/'],
          reductoraRandom: false,
        })
      ),
    },
    {
      id: 'u3230',
      label: 'Unidad',
      code: '3230',
      tipo: 'Unidad',
      depth: 0,
      km: U3230_KM,
      unidadCode: '3230',
      children: [3231, 3232, 3233, 3234, 3235].map((n, i) =>
        coche(n, i, {
          unidadCode: '3230',
          km: U3230_KM,
          bogieSeqOffset: 10,
          ejeBase: 700000,
          ejeRandom: true,
          ruedaPrefix: '082830-',
          ruedaRandom: true,
          reductoraPrefixes: ['9427/D/', '9427/C/'],
          reductoraRandom: true,
        })
      ),
    },
  ],
  'Zaragoza 3000': [
    {
      id: 'u3240',
      label: 'Unidad',
      code: '3240',
      tipo: 'Unidad',
      depth: 0,
      km: Z3240_KM,
      unidadCode: '3240',
      children: [3241, 3242, 3243].map((n, i) =>
        coche(n, i, {
          unidadCode: '3240',
          km: Z3240_KM,
          bogieSeqOffset: 20,
          ejeBase: 850000,
          ejeRandom: false,
          ruedaPrefix: '082870-',
          ruedaRandom: false,
          reductoraPrefixes: ['9427/F/', '9427/E/'],
          reductoraRandom: false,
        })
      ),
    },
    {
      id: 'u3250',
      label: 'Unidad',
      code: '3250',
      tipo: 'Unidad',
      depth: 0,
      km: Z3250_KM,
      unidadCode: '3250',
      children: [3251, 3252, 3253].map((n, i) =>
        coche(n, i, {
          unidadCode: '3250',
          km: Z3250_KM,
          bogieSeqOffset: 26,
          ejeBase: 860000,
          ejeRandom: false,
          ruedaPrefix: '082880-',
          ruedaRandom: false,
          reductoraPrefixes: ['9427/H/', '9427/G/'],
          reductoraRandom: false,
        })
      ),
    },
  ],
};

export function find(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = find(n.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

export function findByCode(nodes: TreeNode[], code: string): TreeNode | null {
  for (const n of nodes) {
    if (n.code === code) return n;
    if (n.children) {
      const hit = findByCode(n.children, code);
      if (hit) return hit;
    }
  }
  return null;
}

// The full ancestor chain (root-first) down to the node with this code — used by the
// "Detalle movimiento" screen to render a real Unidad > Coche > Bogie > Eje path instead of
// a hardcoded one.
export function findCodePath(nodes: TreeNode[], code: string, path: TreeNode[] = []): TreeNode[] | null {
  for (const n of nodes) {
    const next = path.concat([n]);
    if (n.code === code) return next;
    if (n.children) {
      const hit = findCodePath(n.children, code, next);
      if (hit) return hit;
    }
  }
  return null;
}

function findAlmacenItemByCode(items: AlmacenItem[], code: string): AlmacenItem | null {
  for (const it of items) {
    if (it.code === code) return it;
    if (it.children) {
      const hit = findAlmacenItemByCode(it.children, code);
      if (hit) return hit;
    }
  }
  return null;
}

export type AnywhereHit =
  | { kind: 'tree'; node: TreeNode; flotaNombre: string }
  | { kind: 'almacen'; item: AlmacenItem; almacenNombre: string };

// Looks up a code across every flota AND every almacén/taller — used by the "Histórico de
// este componente" popup from screens (like "Consultar por tipo de componente") whose rows
// can come from either source, not just the currently selected flota/almacén, and by the
// landing "Número de serie" card to know which flota/almacén to jump into.
export function findAnywhereByCode(code: string): AnywhereHit | null {
  for (const [flotaNombre, roots] of Object.entries(FLEETS)) {
    const hit = findByCode(roots, code);
    if (hit) return { kind: 'tree', node: hit, flotaNombre };
  }
  for (const [almacenNombre, almacen] of Object.entries(ALMACENES)) {
    for (const list of Object.values(almacen.items)) {
      const hit = findAlmacenItemByCode(list, code);
      if (hit) return { kind: 'almacen', item: hit, almacenNombre };
    }
  }
  return null;
}

export interface TipoComponenteRow {
  id: string;
  ubicacion: 'Flota' | 'Taller';
  ubicacionNombre: string;
  tipo: Tipo;
  code: string;
  km: string;
}

// Every real instance of a given tipo across every flota (in service) and every
// almacén/taller (in stock) — powers "Consultar por tipo de componente".
export function buscarPorTipo(tipo: Tipo): TipoComponenteRow[] {
  const rows: TipoComponenteRow[] = [];
  Object.entries(FLEETS).forEach(([flotaNombre, roots]) => {
    (function walk(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        if (n.tipo === tipo) {
          rows.push({ id: n.id, ubicacion: 'Flota', ubicacionNombre: flotaNombre, tipo: n.tipo, code: n.code, km: n.km });
        }
        if (n.children) walk(n.children);
      });
    })(roots);
  });
  Object.entries(ALMACENES).forEach(([tallerNombre, almacen]) => {
    (almacen.items[tipo] || []).forEach((it) => {
      rows.push({ id: it.id, ubicacion: 'Taller', ubicacionNombre: tallerNombre, tipo: it.tipo, code: it.code, km: it.km });
    });
  });
  return rows;
}

export type CellKind = 'text' | 'id' | 'bool' | 'km';

export interface Cell {
  text: string;
  flex: string;
  isText: boolean;
  isId: boolean;
  isTagBool: boolean;
  isTagKm: boolean;
  meta?: string;
}

const cell = (t: string, kind: CellKind, flex?: string, meta?: string): Cell => ({
  text: t,
  flex: flex || '1 1 0',
  isText: kind === 'text',
  isId: kind === 'id',
  isTagBool: kind === 'bool',
  isTagKm: kind === 'km',
  meta,
});

export const txt = (t: string, flex?: string, meta?: string) => cell(t, 'text', flex, meta);
export const id = (t: string, flex?: string) => cell(t, 'id', flex);
export const bool = (flex?: string) => cell('En servicio', 'bool', flex);
export const km = (t: string, flex?: string, updatedAt?: string) => cell(t, 'km', flex, updatedAt);

// Deterministic "fecha de actualización" (down to the minute) for a cell tooltip — no live
// clock, so the value stays stable between server and client render. Returns the full
// tooltip text (Table renders `meta` verbatim).
export function fechaActualizacion(seed: number): string {
  const d = new Date(2026, 7, 20 - (seed % 10), 8 + (seed % 12), (seed * 7) % 60);
  const p = (v: number) => String(v).padStart(2, '0');
  return `Fecha de actualización: ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Fixed column widths for the wide (per-coche) child table
export const W_DESDE = '0 0 190px';
export const W_HASTA = '0 0 160px';
export const W_ID = '0 0 130px';
export const W_DRIVER = '0 0 150px';

export const ANCESTORS: Record<Tipo, Tipo[]> = {
  Unidad: [],
  Coche: ['Unidad'],
  Bogie: ['Unidad', 'Coche'],
  Eje: ['Unidad', 'Coche', 'Bogie'],
  Rueda: ['Unidad', 'Coche', 'Bogie', 'Eje'],
  Reductora: ['Unidad', 'Coche', 'Bogie', 'Eje'],
};

export const HIJOS: Record<string, string[]> = {
  Unidad: ['Coches'],
  Coche: ['Bogies'],
  Bogie: ['Ejes'],
  Eje: ['Ruedas', 'Reductoras'],
  Rueda: [],
  Reductora: [],
};

export const SING: Record<string, string> = {
  Coches: 'Coche',
  Bogies: 'Bogie',
  Ejes: 'Eje',
  Ruedas: 'Rueda',
  Reductoras: 'Reductora',
};

export interface AlmacenItem {
  id: string;
  label: string;
  code: string;
  km: string;
  tipo: Tipo;
  gmao: string;
  tag: string;
  conHijos: boolean;
  conPadre: boolean;
  groupLabel?: string;
  groupCode?: string;
  groupKm?: string;
  children?: AlmacenItem[];
}

export interface Almacen {
  code: string;
  counts: Record<string, number>;
  items: Record<string, AlmacenItem[]>;
}

interface AlmacenTipoConfig {
  tipo: Tipo;
  label: string;
  count: number;
  prefix: string;
  digits: number;
  mult: number;
  seed: number;
  kmBase: number;
}

// Ejes are loose, individually serialized parts (no positional numbering): a fixed
// per-index pattern gives the variety asked for — 2 with a padre bogie, 3 with hijo
// ruedas/reductoras (one overlaps both), and one fully standalone. These flags drive
// REAL cross-references into the Bogie/Rueda/Reductora lists below (buildAlmacen),
// so e.g. "2 ejes con padre" always means exactly 2 bogies show up marked "con hijos".
const EJE_PADRE = [true, true, false, false, false];
const EJE_HIJO = [false, true, true, true, false];

function buildBaseItems(cfg: AlmacenTipoConfig): AlmacenItem[] {
  const items: AlmacenItem[] = [];
  for (let i = 0; i < cfg.count; i++) {
    const n = shuffle(i + cfg.seed, Math.pow(10, cfg.digits), cfg.mult);
    const code = cfg.prefix + pad(n, cfg.digits);
    const kmVal = fmtKm(cfg.kmBase + shuffle(i + cfg.seed, 50000, 6803));
    items.push({
      id: cfg.tipo + '-' + cfg.seed + '-' + i,
      label: cfg.label,
      code,
      km: kmVal,
      tipo: cfg.tipo,
      gmao: 'GMAO-' + code,
      tag: 'TAG-' + code,
      conHijos: false,
      conPadre: false,
    });
  }
  return items;
}

function buildAlmacen(seedOffset: number, bogiePrefix: string, ruedaPrefix: string, reductoraPrefix: string): Almacen {
  const bogies = buildBaseItems({ tipo: 'Bogie', label: 'Bogie', count: 5, prefix: bogiePrefix, digits: 3, mult: 387, seed: seedOffset + 10, kmBase: 40000 });
  const ejes = buildBaseItems({ tipo: 'Eje', label: 'Eje', count: 5, prefix: '', digits: 6, mult: 6803, seed: seedOffset + 900000, kmBase: 60000 });
  const ruedas = buildBaseItems({ tipo: 'Rueda', label: 'Rueda', count: 20, prefix: ruedaPrefix, digits: 4, mult: 6803, seed: seedOffset + 20, kmBase: 30000 });
  const reductoras = buildBaseItems({ tipo: 'Reductora', label: 'Reductora', count: 10, prefix: reductoraPrefix, digits: 3, mult: 387, seed: seedOffset + 30, kmBase: 20000 });

  // Wire "con padre" ejes to a real bogie (marks that bogie "con hijos" in its own list).
  let bogieCursor = 0;
  ejes.forEach((eje, i) => {
    if (!EJE_PADRE[i]) return;
    const bogie = bogies[bogieCursor++];
    eje.conPadre = true;
    eje.groupLabel = bogie.label;
    eje.groupCode = bogie.code;
    eje.groupKm = bogie.km;
    bogie.conHijos = true;
    bogie.children = (bogie.children || []).concat(eje);
  });

  // Wire "con hijos" ejes to a real rueda + reductora (marks those "con padre" in their own lists).
  let hijoCursor = 0;
  ejes.forEach((eje, i) => {
    if (!EJE_HIJO[i]) return;
    const rueda = ruedas[hijoCursor];
    const reductora = reductoras[hijoCursor];
    hijoCursor++;
    rueda.conPadre = true;
    rueda.groupLabel = eje.label;
    rueda.groupCode = eje.code;
    rueda.groupKm = eje.km;
    reductora.conPadre = true;
    reductora.groupLabel = eje.label;
    reductora.groupCode = eje.code;
    reductora.groupKm = eje.km;
    eje.conHijos = true;
    eje.children = [rueda, reductora];
  });

  const items: Record<string, AlmacenItem[]> = { Bogie: bogies, Eje: ejes, Rueda: ruedas, Reductora: reductoras };
  const counts: Record<string, number> = { Bogie: bogies.length, Eje: ejes.length, Rueda: ruedas.length, Reductora: reductoras.length };
  return { code: '', counts, items };
}

export const ALMACENES: Record<string, Almacen> = {
  'Taller Stock Urbos 100': { ...buildAlmacen(0, '5149-WH-', '082850-', '9427/W/'), code: 'Taller Stock Urbos 100' },
  'Taller Tranvía Zaragoza': { ...buildAlmacen(137, '5149-WZ-', '082860-', '9427/Z/'), code: 'Taller Tranvía Zaragoza' },
};

export const ALMACEN_TIPOS: { tipo: Tipo; label: string; plural: string }[] = [
  { tipo: 'Bogie', label: 'Bogie', plural: 'bogies' },
  { tipo: 'Eje', label: 'Eje', plural: 'ejes' },
  { tipo: 'Rueda', label: 'Rueda', plural: 'ruedas' },
  { tipo: 'Reductora', label: 'Reductor', plural: 'reductores' },
];

// Mock historial + related-movements rows for a loose warehouse item (self-contained, not tied to FLEETS).
export function almacenHistorial(item: AlmacenItem): { id: string; cells: Cell[] }[] {
  const [k1, k2, k3] = splitKm(item.km);
  return [
    { id: 'h1', cells: [id('3220'), id('3221'), id('5149-MK6-001'), txt('2025-06-10'), bool(), km(k1)] },
    { id: 'h2', cells: [id('3220'), id('3225'), id('5149-MK6-009'), txt('2024-06-10'), txt('2025-07-10'), km(k2)] },
    { id: 'h3', cells: [id('3220'), id('3223'), id('5149-MK6-005'), txt('2023-06-10'), txt('2025-07-11'), km(k3)] },
  ];
}

export function toKmNumber(kmStr: string): number {
  return parseInt(kmStr.replace(/[^\d]/g, ''), 10) || 0;
}

export function fmtKm(n: number): string {
  return n.toLocaleString('es-ES') + 'km';
}

// Splits a total km into 3 partial ("Driver parcial") stints that add up exactly to the total.
export function splitKm(kmStr: string): [string, string, string] {
  const total = toKmNumber(kmStr);
  const k1 = Math.round(total * 0.55);
  const k2 = Math.round(total * 0.3);
  const k3 = total - k1 - k2;
  return [fmtKm(k1), fmtKm(k2), fmtKm(k3)];
}

function findUnidad(unidadCode: string): TreeNode | null {
  for (const fleet of Object.values(FLEETS)) {
    for (const u of fleet) {
      if (u.code === unidadCode) return u;
    }
  }
  return null;
}

// Picks two other coche/bogie references from the same unidad, for the mock "previously mounted on" rows.
function altMounts(unidadCode: string, currentCocheCode: string): { coche: string; bogie: string }[] {
  const coches = findUnidad(unidadCode)?.children || [];
  const others = coches.filter((cc) => cc.code !== currentCocheCode);
  const pick = (i: number) => others[i % Math.max(others.length, 1)] || coches[0];
  const a = pick(others.length - 1);
  const b = pick(others.length - 2);
  return [
    { coche: a?.code || currentCocheCode, bogie: a?.children?.[0]?.code || '' },
    { coche: b?.code || currentCocheCode, bogie: b?.children?.[0]?.code || '' },
  ];
}

export function historial(sel: TreeNode | null): { id: string; cells: Cell[] }[] {
  const unidadCode = sel?.unidadCode || '3220';
  const c = sel?.cocheCode || '3221';
  const b = sel?.bogieCode || '5149-MK6-001';
  const k = sel?.km || U3220_KM;
  const seedBase = Number(sel?.code) || 1;
  const anc = ANCESTORS[(sel?.tipo as Tipo) || 'Eje'] || [];
  if (anc.length < 3) {
    const pre: Record<string, Cell> = {
      Unidad: id(unidadCode),
      Coche: id(c),
      Bogie: id(b),
      Eje: id(sel?.ejeCode || '415876'),
    };
    const lead = anc.map((t) => pre[t]);
    return [{ id: 'h1', cells: lead.concat([txt('04-ene-2000 01:00'), bool(), km(k, undefined, fechaActualizacion(seedBase))]) }];
  }
  const e = sel?.ejeCode || '415876';
  const lead = (cc: string, bb: string, ee: string) =>
    anc.map((t) => id(({ Unidad: unidadCode, Coche: cc, Bogie: bb, Eje: ee } as Record<string, string>)[t]));
  const [alt1, alt2] = altMounts(unidadCode, c);
  const [k1, k2, k3] = splitKm(k);
  // Most recent ("En servicio") first, oldest last — matches the info icon on Kilómetros
  // only ever showing on the most recent (first) row.
  return [
    { id: 'h1', cells: lead(c, b, e).concat([txt('2025-06-10 09:15'), bool(), km(k1, undefined, fechaActualizacion(seedBase + 1))]) },
    { id: 'h2', cells: lead(alt1.coche, alt1.bogie, e).concat([txt('2024-06-10 08:30'), txt('2025-07-10 16:45'), km(k2)]) },
    { id: 'h3', cells: lead(alt2.coche, alt2.bogie, e).concat([txt('2023-06-10 11:20'), txt('2025-07-11 09:40'), km(k3)]) },
  ];
}

export interface PositionRef {
  title: string;
  code: string;
}

export interface MovimientoRow {
  id: string;
  fecha: string;
  operacion: string;
  operacionIcons: string[];
  componente: string;
  antes: PositionRef[];
  despues: PositionRef[];
}

// Antes/después reference real ids already present elsewhere in the mock data (unidades,
// talleres, ejes, ruedas) rather than the placeholder codes from the original design, so a
// movimiento here tells a story that's internally consistent with the rest of the app.
// Only truly untracked auxiliary parts (Ventilador, Compresor, Patín, HVAC) get invented codes.
const MOVIMIENTOS_BASE: Omit<MovimientoRow, 'id' | 'fecha'>[] = [
  {
    operacion: 'Intercambio entre unidades',
    operacionIcons: ['Train', 'SwapHoriz', 'Train'],
    componente: 'Ventilador',
    antes: [
      { title: '3220', code: 'VENT-0142' },
      { title: '3230', code: 'VENT-0891' },
    ],
    despues: [
      { title: '3220', code: 'VENT-0891' },
      { title: '3230', code: 'VENT-0142' },
    ],
  },
  {
    operacion: 'Intercambio entre unidad y taller',
    operacionIcons: ['Train', 'SwapHoriz', 'Warehouse'],
    componente: 'Eje',
    antes: [
      { title: '3220', code: '415875' },
      { title: 'Taller Stock Urbos 100', code: '706821' },
    ],
    despues: [
      { title: '3220', code: '706821' },
      { title: 'Taller Stock Urbos 100', code: '415875' },
    ],
  },
  {
    operacion: 'Intercambio dentro de la misma unidad',
    operacionIcons: ['Train', 'Cycle'],
    componente: 'Rueda',
    antes: [
      { title: '3220 - Eje 1', code: '082801-0001' },
      { title: '3220 - Eje 2', code: '082801-0003' },
    ],
    despues: [
      { title: '3220 - Eje 1', code: '082801-0003' },
      { title: '3220 - Eje 2', code: '082801-0001' },
    ],
  },
  {
    operacion: 'Montaje en taller',
    operacionIcons: ['AssemblyOn'],
    componente: 'Compresor',
    antes: [
      { title: 'Taller Stock Urbos 100', code: 'COMP-0511' },
      { title: '3230', code: 'Vacio' },
    ],
    despues: [
      { title: 'Taller Stock Urbos 100', code: 'Vacio' },
      { title: '3230', code: 'COMP-0511' },
    ],
  },
  {
    operacion: 'Desmontaje en taller',
    operacionIcons: ['AssemblyOff'],
    componente: 'Motor ventilador condensadora HVAC Sala',
    antes: [
      { title: 'Taller Stock Urbos 100', code: 'Vacio' },
      { title: '3230', code: 'HVAC-0074' },
    ],
    despues: [
      { title: 'Taller Stock Urbos 100', code: 'HVAC-0074' },
      { title: '3230', code: 'Vacio' },
    ],
  },
  {
    operacion: 'Envio entre talleres',
    operacionIcons: ['Warehouse', 'MoveRight', 'Warehouse'],
    componente: 'Patín captación',
    antes: [
      { title: 'Taller Stock Urbos 100', code: 'PC-0027' },
      { title: 'Taller Tranvía Zaragoza', code: 'Vacio' },
    ],
    despues: [
      { title: 'Taller Stock Urbos 100', code: 'Vacio' },
      { title: 'Taller Tranvía Zaragoza', code: 'PC-0027' },
    ],
  },
];

// Deterministic (no Date.now()/Math.random()) but varied per-row timestamp, down to the
// minute — spreads movimientos across a couple of weeks instead of all sharing one instant.
function movFecha(seed: number): string {
  const base = new Date(2026, 7, 20, 8, 0);
  const offsetMinutes = shuffle(seed, 100000, 6803) % (14 * 24 * 60);
  const d = new Date(base.getTime() + offsetMinutes * 60000);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const MOVIMIENTOS: MovimientoRow[] = [0, 1].flatMap((rep) =>
  MOVIMIENTOS_BASE.map((row, i) => ({
    ...row,
    id: 'mov-' + rep + '-' + i,
    fecha: movFecha(rep * MOVIMIENTOS_BASE.length + i + 1),
  }))
);

export const TIPOS_COMPONENTE = ['Eje', 'Rueda', 'Reductora', 'Ventilador', 'Compresor', 'Patín captación'];
export const TIPOS_OPERACION = MOVIMIENTOS_BASE.map((r) => r.operacion);

export interface TallerInfo {
  id: string;
  nombre: string;
  ubicacion: string;
  contacto: string;
  telefono: string;
  uso: string[];
  editableName: boolean;
}

export const USOS_TALLER = ['Almacén', 'Mantenimiento'];

// The only two talleres backed by real data elsewhere in the app (ALMACENES) — their name is
// locked when editing since other screens look them up by this exact string.
export const TALLERES_SEED: TallerInfo[] = [
  {
    id: 'taller-1',
    nombre: 'Taller Stock Urbos 100',
    ubicacion: 'Beasain',
    contacto: 'Servicio técnico CAF',
    telefono: '943 10 50 45',
    uso: ['Almacén'],
    editableName: false,
  },
  {
    id: 'taller-2',
    nombre: 'Taller Tranvía Zaragoza',
    ubicacion: 'Zaragoza',
    contacto: 'Servicio técnico CAF',
    telefono: '943 10 50 45',
    uso: ['Almacén', 'Mantenimiento'],
    editableName: false,
  },
];

// All codes of a given tipo that exist within the same unidad as unidadCode — used to fill
// "previously mounted" hijo-historial slots with REAL codes from that unidad (never another
// unidad's), instead of a fleet-agnostic hardcoded list.
function siblingsOfType(unidadCode: string, tipo: Tipo): string[] {
  const unidad = findUnidad(unidadCode);
  const out: string[] = [];
  (function walk(nodes: TreeNode[]) {
    nodes.forEach((n) => {
      if (n.tipo === tipo) out.push(n.code);
      if (n.children) walk(n.children);
    });
  })(unidad?.children || []);
  return out;
}

export function hijoRows(sel: TreeNode | null, tipo: string): { id: string; cells: Cell[] }[] {
  const unidadCode = sel?.unidadCode || '3220';
  const k = sel?.km || U3220_KM;
  const seedBase = Number(sel?.code) || 1;
  if (tipo === 'Coches') {
    const coches = (sel?.children || []).map((cc) => cc.code);
    const pairs: Cell[] = [];
    coches.forEach((c, i) => {
      pairs.push(id(c, W_ID));
      pairs.push(km(k, W_DRIVER, fechaActualizacion(seedBase + i)));
    });
    return [{ id: 'r1', cells: [txt('04-ene-2000 01:00', W_DESDE), bool(W_HASTA)].concat(pairs) }];
  }
  const singTipo = (SING[tipo] || 'Rueda') as Tipo;
  const real = (sel?.children || []).filter((c) => c.tipo === singTipo).map((c) => c.code);
  const pool = siblingsOfType(unidadCode, singTipo).filter((code) => !real.includes(code));
  const pick = (i: number) => pool[i % Math.max(pool.length, 1)] || real[0] || '';
  const ids = [real[0] || pick(0), real[1] || pick(1), pick(2), pick(3), pick(4), pick(5)];
  // Most recent ("En servicio") first, oldest last — matches the info icon on Kilómetros
  // only ever showing on the most recent (first) row.
  return [
    {
      id: 'r1',
      cells: [
        txt('2025-12-27 09:00'),
        bool(),
        id(ids[0]),
        km(k, undefined, fechaActualizacion(seedBase + 1)),
        id(ids[1]),
        km(k, undefined, fechaActualizacion(seedBase + 2)),
      ],
    },
    {
      id: 'r2',
      cells: [
        txt('2025-06-30 15:50'),
        txt('2026-01-11 10:05'),
        id(ids[2]),
        km(k),
        id(ids[3]),
        km(k),
      ],
    },
    {
      id: 'r3',
      cells: [
        txt('2025-01-01 07:10'),
        txt('2025-07-15 12:25'),
        id(ids[4]),
        km(k),
        id(ids[5]),
        km(k),
      ],
    },
  ];
}
