import { useEffect, useState } from 'react';
import { api } from '../../api/cliente.js';
import { Campo, Cargando, Encabezado, ErrorApiVista, Vacio } from '../../components/ui.jsx';
import { creditos, haceDiasISO, hoyISO, porcentaje } from '../../utils/formato.js';
import { exportarCSV, exportarPDF } from '../../utils/exportar.js';

const COLUMNAS_JUEGOS = [
  { clave: 'nombre', titulo: 'Juego' },
  { clave: 'apuestas', titulo: 'Apuestas', formato: creditos },
  { clave: 'jugadores', titulo: 'Jugadores', formato: creditos },
  { clave: 'ganadas', titulo: 'Ganadas', formato: creditos },
  { clave: 'perdidas', titulo: 'Perdidas', formato: creditos },
  { clave: 'empates', titulo: 'Empates', formato: creditos },
  { clave: 'apostado', titulo: 'Apostado', formato: creditos },
  { clave: 'pagado', titulo: 'Pagado', formato: creditos },
  { clave: 'gananciaCasa', titulo: 'Ganancia casa', formato: creditos },
  { clave: 'devolucion', titulo: 'Devolución', formato: porcentaje },
];
const COLUMNAS_JUGADORES = [
  { clave: 'nombre', titulo: 'Jugador' },
  { clave: 'correo', titulo: 'Correo' },
  { clave: 'apuestas', titulo: 'Apuestas', formato: creditos },
  { clave: 'apostado', titulo: 'Apostado', formato: creditos },
  { clave: 'pagado', titulo: 'Ganado', formato: creditos },
  { clave: 'neto', titulo: 'Neto', formato: creditos },
  { clave: 'recargas', titulo: 'Recargas', formato: creditos },
  { clave: 'saldo', titulo: 'Saldo actual', formato: creditos },
  { clave: 'juegoFavorito', titulo: 'Juego favorito' },
];

function Tabla({ columnas, filas, totales }) {
  return (
    <div className="overflow-x-auto">
      <table className="tabla">
        <thead><tr>{columnas.map((c) => <th key={c.clave} className={c.formato ? 'text-right' : ''}>{c.titulo}</th>)}</tr></thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id}>
              {columnas.map((c) => (
                <td key={c.clave} className={`${c.formato ? 'text-right' : ''} ${c.clave === 'neto' || c.clave === 'gananciaCasa' ? (f[c.clave] < 0 ? 'text-red-300' : 'text-emerald-300') : ''} whitespace-nowrap`}>
                  {c.formato ? c.formato(f[c.clave]) : f[c.clave] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totales && (
          <tfoot>
            <tr className="font-semibold text-oro">
              {columnas.map((c) => <td key={c.clave} className={c.formato ? 'text-right' : ''}>{totales[c.clave] !== undefined ? (c.formato ? c.formato(totales[c.clave]) : totales[c.clave]) : ''}</td>)}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default function Reportes() {
  const [rango, setRango] = useState({ desde: haceDiasISO(29), hasta: hoyISO() });
  const [orden, setOrden] = useState('apostado');
  const [porJuego, setPorJuego] = useState(null);
  const [jugadores, setJugadores] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    api.get('/reportes/apuestas-por-juego', rango).then(setPorJuego).catch(setError);
  }, [rango]);
  useEffect(() => {
    api.get('/reportes/jugadores', { ...rango, orden, limite: 50 }).then(setJugadores).catch(setError);
  }, [rango, orden]);

  const periodo = `Periodo: ${rango.desde} a ${rango.hasta}`;
  const totalesJuego = porJuego && { nombre: 'Total', ...porJuego.totales };

  return (
    <>
      <Encabezado titulo="Reportes" descripcion="Elige un rango de fechas y exporta cada reporte en PDF o CSV." />
      <div className="tarjeta mb-4 flex flex-wrap items-end gap-3">
        <Campo etiqueta="Desde"><input type="date" className="campo" value={rango.desde} max={rango.hasta} onChange={(e) => setRango({ ...rango, desde: e.target.value })} /></Campo>
        <Campo etiqueta="Hasta"><input type="date" className="campo" value={rango.hasta} min={rango.desde} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} /></Campo>
      </div>
      <ErrorApiVista error={error} onCerrar={() => setError(null)} />

      <section className="tarjeta mb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Reporte 1 · Apuestas por juego</h2>
            <p className="text-xs text-tenue">Actividad, pagos y ganancia de la casa por juego en el rango de fechas.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-sec" disabled={!porJuego} onClick={() => exportarCSV(`apuestas-por-juego_${rango.desde}_${rango.hasta}`, COLUMNAS_JUEGOS, [...porJuego.datos, totalesJuego])}>CSV</button>
            <button type="button" className="btn-sec" disabled={!porJuego} onClick={() => exportarPDF(`apuestas-por-juego_${rango.desde}_${rango.hasta}`, 'Reporte de apuestas por juego', periodo, COLUMNAS_JUEGOS, porJuego.datos, totalesJuego)}>PDF</button>
          </div>
        </div>
        {!porJuego ? <Cargando /> : <Tabla columnas={COLUMNAS_JUEGOS} filas={porJuego.datos} totales={totalesJuego} />}
      </section>

      <section className="tarjeta">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Reporte 2 · Ranking de jugadores</h2>
            <p className="text-xs text-tenue">Jugadores con actividad en el rango (máximo 50).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="campo w-auto" value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar por">
              <option value="apostado">Más apostado</option>
              <option value="neto">Mayor ganancia neta</option>
              <option value="apuestas">Más apuestas</option>
              <option value="recargas">Más recargas</option>
              <option value="saldo">Mayor saldo</option>
            </select>
            <button type="button" className="btn-sec" disabled={!jugadores} onClick={() => exportarCSV(`ranking-jugadores_${rango.desde}_${rango.hasta}`, COLUMNAS_JUGADORES, jugadores.datos)}>CSV</button>
            <button type="button" className="btn-sec" disabled={!jugadores} onClick={() => exportarPDF(`ranking-jugadores_${rango.desde}_${rango.hasta}`, 'Ranking de jugadores', periodo, COLUMNAS_JUGADORES, jugadores.datos)}>PDF</button>
          </div>
        </div>
        {!jugadores && <Cargando />}
        {jugadores?.datos.length === 0 && <Vacio texto="Ningún jugador tuvo actividad en este rango" />}
        {jugadores?.datos.length > 0 && <Tabla columnas={COLUMNAS_JUGADORES} filas={jugadores.datos} />}
      </section>
    </>
  );
}
