// Ported 1:1 from the original prototype logic (Trazabilidad Leadmind.dc.html)

export type Tipo = 'Unidad' | 'Coche' | 'Bogie' | 'Eje' | 'Rueda' | 'Reductora';

export interface TreeNode {
  id: string;
  label: string;
  code: string;
  tipo: Tipo;
  depth: number;
  km: string;
  cocheCode?: string;
  bogieCode?: string;
  ejeCode?: string;
  gmao?: string;
  tag?: string;
  children?: TreeNode[];
}

const U3220_KM = '122.885km';
const U3230_KM = '117.930km';

const pad = (n: number) => String(n).padStart(3, '0');

function coche(n: number, i: number): TreeNode {
  return {
    id: 'c' + n,
    label: 'Coche ' + (i + 1),
    code: String(n),
    tipo: 'Coche',
    depth: 1,
    km: U3220_KM,
    gmao: 'GMAO-' + n,
    tag: '\u2014',
    cocheCode: String(n),
    children: [1, 2].map((b) => {
      const seq = i * 2 + b;
      const bogieCode = '5149-MK6-' + pad(seq);
      return {
        id: 'c' + n + 'b' + b,
        label: 'Bogie ' + seq,
        code: bogieCode,
        tipo: 'Bogie',
        depth: 2,
        km: U3220_KM,
        gmao: 'GMAO-' + bogieCode,
        tag: 'TAG-' + bogieCode,
        cocheCode: String(n),
        bogieCode,
        children: [1, 2].map((e) => {
          const idx = (seq - 1) * 2 + (e - 1);
          const ejeCode = String(415875 + (seq - 1) * 2 + (2 - e));
          const child = (label: string, code: string, tipo: Tipo, k: string): TreeNode => ({
            id: 'c' + n + 'b' + b + 'e' + e + '-' + k,
            label,
            code,
            tipo,
            depth: 4,
            km: U3220_KM,
            cocheCode: String(n),
            bogieCode,
            ejeCode,
            gmao: 'GMAO-' + code,
            tag: 'TAG-' + code,
          });
          return {
            id: 'c' + n + 'b' + b + 'e' + e,
            label: 'Eje ' + (idx + 1),
            code: ejeCode,
            tipo: 'Eje',
            depth: 3,
            km: U3220_KM,
            cocheCode: String(n),
            bogieCode,
            gmao: 'GMAO-' + n + '-' + seq + '-' + e,
            tag: 'TAG-E' + pad(seq) + e,
            children: [
              child('Rueda ' + (idx * 2 + 1), '082801-0025', 'Rueda', 'r1'),
              child('Rueda ' + (idx * 2 + 2), '082801-0005r', 'Rueda', 'r2'),
              child('Reductora ' + (idx * 2 + 1), '9427/B/001', 'Reductora', 'd1'),
              child('Reductora ' + (idx * 2 + 2), '9427/A/004', 'Reductora', 'd2'),
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
      children: [3221, 3222, 3223, 3224, 3225].map((n, i) => coche(n, i)),
    },
    { id: 'u3230', label: 'Unidad', code: '3230', tipo: 'Unidad', depth: 0, km: U3230_KM, children: [] },
  ],
  'Zaragoza 3000': [],
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

export type CellKind = 'text' | 'id' | 'bool' | 'km';

export interface Cell {
  text: string;
  flex: string;
  isText: boolean;
  isId: boolean;
  isTagBool: boolean;
  isTagKm: boolean;
}

const cell = (t: string, kind: CellKind, flex?: string): Cell => ({
  text: t,
  flex: flex || '1 1 0',
  isText: kind === 'text',
  isId: kind === 'id',
  isTagBool: kind === 'bool',
  isTagKm: kind === 'km',
});

export const txt = (t: string, flex?: string) => cell(t, 'text', flex);
export const id = (t: string, flex?: string) => cell(t, 'id', flex);
export const bool = (flex?: string) => cell('En servicio', 'bool', flex);
export const km = (t: string, flex?: string) => cell(t, 'km', flex);

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

export function historial(sel: TreeNode | null): { id: string; cells: Cell[] }[] {
  const c = sel?.cocheCode || '3221';
  const b = sel?.bogieCode || '5149-MK6-001';
  const k = sel?.km || U3220_KM;
  const anc = ANCESTORS[(sel?.tipo as Tipo) || 'Eje'] || [];
  if (anc.length < 3) {
    const pre: Record<string, Cell> = {
      Unidad: id('3220'),
      Coche: id(c),
      Bogie: id(b),
      Eje: id(sel?.ejeCode || '415876'),
    };
    const lead = anc.map((t) => pre[t]);
    return [{ id: 'h1', cells: lead.concat([txt('04-ene-2000 1:00:00'), bool(), km(k)]) }];
  }
  const e = sel?.ejeCode || '415876';
  const lead = (cc: string, bb: string, ee: string) =>
    anc.map((t) => id(({ Unidad: '3220', Coche: cc, Bogie: bb, Eje: ee } as Record<string, string>)[t]));
  return [
    { id: 'h1', cells: lead(c, b, e).concat([txt('2025-06-10'), bool(), km(k)]) },
    { id: 'h2', cells: lead('3225', '5149-MK6-009', e).concat([txt('2024-06-10'), txt('2025-07-10'), km(k)]) },
    { id: 'h3', cells: lead('3223', '5149-MK6-005', e).concat([txt('2023-06-10'), txt('2025-07-11'), km(k)]) },
  ];
}

export function hijoRows(sel: TreeNode | null, tipo: string): { id: string; cells: Cell[] }[] {
  const SETS: Record<string, string[]> = {
    Reductoras: ['9427/B/001', '9427/A/004', '9427/B/002', '9427/A/005', '9427/B/003', '9427/A/006'],
    Ruedas: ['082801-0025', '082801-0005r', '082801-0024', '082801-0004r', '082801-0023', '082801-0003r'],
    Ejes: ['415876', '415875', '415878', '415877', '415880', '415879'],
    Bogies: ['5149-MK6-001', '5149-MK6-002', '5149-MK6-003', '5149-MK6-004', '5149-MK6-005', '5149-MK6-006'],
    Coches: ['3221', '3222', '3223', '3224', '3225', '3221'],
  };
  const ids = (SETS[tipo] || SETS.Ruedas).slice();
  const real = (sel?.children || []).filter((c) => c.tipo === SING[tipo]);
  if (real[0]) ids[0] = real[0].code;
  if (real[1]) ids[1] = real[1].code;
  const k = sel?.km || U3220_KM;
  if (tipo === 'Coches') {
    const coches = ['3221', '3222', '3223', '3224', '3225'];
    const pairs: Cell[] = [];
    coches.forEach((c) => {
      pairs.push(id(c, W_ID));
      pairs.push(km(k, W_DRIVER));
    });
    return [{ id: 'r1', cells: [txt('04-ene-2000 1:00:00', W_DESDE), bool(W_HASTA)].concat(pairs) }];
  }
  return [
    { id: 'r1', cells: [txt('2025-12-27'), bool(), id(ids[0]), km(k), id(ids[1]), km(k)] },
    { id: 'r2', cells: [txt('2025-06-30'), txt('2026-01-11'), id(ids[2]), km(k), id(ids[3]), km(k)] },
    { id: 'r3', cells: [txt('2025-01-01'), txt('2025-07-15'), id(ids[4]), km(k), id(ids[5]), km(k)] },
  ];
}
