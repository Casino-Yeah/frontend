import { useEffect, useState } from 'react';
import { api } from '../api/cliente.js';
import { Campo, Cargando, ErrorApiVista, Insignia, Paginacion, Vacio, useDebounce } from './ui.jsx';
import { creditos, fecha, ESTADOS_APUESTA } from '../utils/formato.js';

// Historial de apuestas con filtros, orden y paginación. Lo usan el jugador y el administrador.
export default function TablaApuestas({ admin = false }) {
  const [juegos, setJuegos] = useState([]);
  const [filtros, setFiltros] = useState({ q: '', juegoId: '', estado: '', desde: '', hasta: '', orden: 'creadoEn', dir: 'desc', pagina: 1 });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const q = useDebounce(filtros.q);

  useEffect(() => { api.get('/juegos', { limite: 100 }).then((r) => setJuegos(r.datos)).catch(() => {}); }, []);
  useEffect(() => {
    setError(null);
    api.get('/apuestas', { ...filtros, q, limite: 10 }).then(setDatos).catch(setError);
  }, [filtros.juegoId, filtros.estado, filtros.desde, filtros.hasta, filtros.orden, filtros.dir, filtros.pagina, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value, pagina: 1 });
  const ordenar = (orden) => setFiltros({ ...filtros, orden, dir: filtros.orden === orden && filtros.dir === 'desc' ? 'asc' : 'desc', pagina: 1 });
  const flecha = (orden) => (filtros.orden === orden ? (filtros.dir === 'desc' ? ' ↓' : ' ↑') : '');

  return (
    <div className="tarjeta">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {admin && (
          <Campo etiqueta="Jugador" className="col-span-2 sm:col-span-3 lg:col-span-5">
            <input className="campo" placeholder="Buscar por nombre o correo" value={filtros.q} onChange={filtrar('q')} />
          </Campo>
        )}
        <Campo etiqueta="Juego">
          <select className="campo" value={filtros.juegoId} onChange={filtrar('juegoId')}>
            <option value="">Todos</option>
            {juegos.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Estado">
          <select className="campo" value={filtros.estado} onChange={filtrar('estado')}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_APUESTA).map(([k, v]) => <option key={k} value={k}>{v.texto}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Desde"><input type="date" className="campo" value={filtros.desde} onChange={filtrar('desde')} /></Campo>
        <Campo etiqueta="Hasta"><input type="date" className="campo" value={filtros.hasta} onChange={filtrar('hasta')} /></Campo>
      </div>
      <ErrorApiVista error={error} />
      {!datos && !error && <Cargando />}
      {datos?.datos.length === 0 && <Vacio texto="No hay apuestas con esos filtros" />}
      {datos?.datos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th><button type="button" onClick={() => ordenar('creadoEn')}>Fecha{flecha('creadoEn')}</button></th>
                {admin && <th>Jugador</th>}
                <th><button type="button" onClick={() => ordenar('juego')}>Juego{flecha('juego')}</button></th>
                <th className="text-right"><button type="button" onClick={() => ordenar('monto')}>Apuesta{flecha('monto')}</button></th>
                <th className="text-right">Mult.</th>
                <th className="text-right"><button type="button" onClick={() => ordenar('pago')}>Pago{flecha('pago')}</button></th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {datos.datos.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-tenue">{fecha(a.creadoEn)}</td>
                  {admin && <td className="whitespace-nowrap">{a.usuario}</td>}
                  <td className="whitespace-nowrap">{a.juego}</td>
                  <td className="text-right">{creditos(a.monto)}</td>
                  <td className="text-right text-tenue">{a.multiplicador === null ? '—' : `x${a.multiplicador}`}</td>
                  <td className="text-right">{creditos(a.pago)}</td>
                  <td><Insignia clase={ESTADOS_APUESTA[a.estado].clase}>{ESTADOS_APUESTA[a.estado].texto}</Insignia></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacion paginacion={datos?.paginacion} onCambiar={(pagina) => setFiltros({ ...filtros, pagina })} />
    </div>
  );
}
