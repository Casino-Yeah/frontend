import { useEffect, useState } from 'react';
import { creditos } from '../utils/formato.js';

export function Alerta({ tipo = 'error', children, onCerrar }) {
  if (!children) return null;
  const estilos = {
    error: 'border-red-500/40 bg-red-500/10 text-red-200',
    exito: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  };
  return (
    <div role="alert" className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${estilos[tipo]}`}>
      <div>{children}</div>
      {onCerrar && <button type="button" onClick={onCerrar} className="opacity-70 hover:opacity-100" aria-label="Cerrar">✕</button>}
    </div>
  );
}

// Muestra el mensaje de un ErrorApi y, si existe, el detalle por campo
export function ErrorApiVista({ error, onCerrar }) {
  if (!error) return null;
  return (
    <Alerta tipo="error" onCerrar={onCerrar}>
      <p className="font-medium">{error.message}</p>
      {error.errores?.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-xs">{error.errores.map((e, i) => <li key={i}>{e.mensaje}</li>)}</ul>
      )}
    </Alerta>
  );
}

export function Campo({ etiqueta, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="etiqueta">{etiqueta}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-tenue"><span className="h-4 w-4 animate-spin rounded-full border-2 border-oro border-t-transparent" />{texto}</div>;
}

export function Vacio({ texto = 'No hay resultados' }) {
  return <p className="py-8 text-center text-sm text-tenue">{texto}</p>;
}

export function Insignia({ clase, children }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${clase}`}>{children}</span>;
}

export function Paginacion({ paginacion, onCambiar }) {
  if (!paginacion) return null;
  const { pagina, paginas, total } = paginacion;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-tenue">
      <span>{total} resultado{total === 1 ? '' : 's'} · página {pagina} de {paginas}</span>
      <div className="flex gap-2">
        <button type="button" className="btn-sec" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>Anterior</button>
        <button type="button" className="btn-sec" disabled={pagina >= paginas} onClick={() => onCambiar(pagina + 1)}>Siguiente</button>
      </div>
    </div>
  );
}

export function Modal({ titulo, abierto, onCerrar, children }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const tecla = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onMouseDown={onCerrar}>
      <div role="dialog" aria-modal="true" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-borde bg-panel p-5 sm:max-w-lg sm:rounded-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="text-tenue hover:text-texto" aria-label="Cerrar">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Encabezado({ titulo, descripcion, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-tenue">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

// Control de monto con fichas rápidas, respetando los límites del juego (RN-02)
export function SelectorApuesta({ juego, monto, setMonto, disabled }) {
  const fichas = [juego.apuestaMin, 50, 100, 250, 500, juego.apuestaMax]
    .filter((v, i, a) => v >= juego.apuestaMin && v <= juego.apuestaMax && a.indexOf(v) === i)
    .sort((a, b) => a - b);
  return (
    <div>
      <span className="etiqueta">Apuesta (de {creditos(juego.apuestaMin)} a {creditos(juego.apuestaMax)})</span>
      <div className="flex flex-wrap items-center gap-2">
        <input type="number" className="campo w-32" min={juego.apuestaMin} max={juego.apuestaMax} step="1" value={monto}
          disabled={disabled} onChange={(e) => setMonto(e.target.value === '' ? '' : Number(e.target.value))} aria-label="Monto de la apuesta" />
        {fichas.map((f) => (
          <button key={f} type="button" disabled={disabled} onClick={() => setMonto(f)}
            className={`h-10 min-w-10 rounded-full border-2 border-dashed px-2 text-xs font-bold transition ${monto === f ? 'border-oro bg-oro text-slate-900' : 'border-white/40 bg-red-700 text-white hover:bg-red-600'}`}>
            {creditos(f)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function useDebounce(valor, ms = 350) {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}
