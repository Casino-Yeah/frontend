const numero = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
export const creditos = (n) => numero.format(Number(n ?? 0));
export const porcentaje = (n) => `${numero.format(Number(n ?? 0))} %`;

export function fecha(texto, conHora = true) {
  if (!texto) return '—';
  const d = new Date(String(texto).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return texto;
  return d.toLocaleString('es-MX', conHora
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
}

export const hoyISO = () => new Date().toLocaleDateString('en-CA');
export function haceDiasISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
}

export const ESTADOS_APUESTA = {
  en_curso: { texto: 'En curso', clase: 'bg-sky-500/15 text-sky-300' },
  ganada: { texto: 'Ganada', clase: 'bg-emerald-500/15 text-emerald-300' },
  perdida: { texto: 'Perdida', clase: 'bg-red-500/15 text-red-300' },
  empate: { texto: 'Empate', clase: 'bg-slate-500/20 text-slate-300' },
};

export const TIPOS_MOVIMIENTO = {
  recarga: 'Recarga', apuesta: 'Apuesta', premio: 'Premio', ajuste: 'Ajuste', bono: 'Bono',
};
