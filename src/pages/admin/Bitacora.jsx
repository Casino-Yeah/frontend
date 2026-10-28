import { useEffect, useState } from 'react';
import { api } from '../../api/cliente.js';
import { Campo, Cargando, Encabezado, ErrorApiVista, Insignia, Paginacion, Vacio, useDebounce } from '../../components/ui.jsx';
import { fecha } from '../../utils/formato.js';

const ACCIONES = {
  registro: 'Registro', login: 'Inicio de sesión', login_fallido: 'Inicio fallido', cambio_password: 'Cambio de contraseña',
  recarga: 'Recarga', ajuste_saldo: 'Ajuste de saldo', apuesta: 'Apuesta', apuesta_resuelta: 'Partida resuelta',
  crear_usuario: 'Alta de usuario', editar_usuario: 'Edición de usuario', baja_usuario: 'Baja de usuario',
  crear_juego: 'Alta de juego', editar_juego: 'Edición de juego', borrar_juego: 'Juego borrado',
};

function detalleTexto(detalle) {
  if (!detalle) return '';
  return Object.entries(detalle).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ');
}

export default function Bitacora() {
  const [filtros, setFiltros] = useState({ q: '', accion: '', desde: '', hasta: '', dir: 'desc', pagina: 1 });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const q = useDebounce(filtros.q);

  useEffect(() => {
    setError(null);
    api.get('/bitacora', { ...filtros, q, limite: 15 }).then(setDatos).catch(setError);
  }, [filtros.accion, filtros.desde, filtros.hasta, filtros.dir, filtros.pagina, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value, pagina: 1 });

  return (
    <>
      <Encabezado titulo="Bitácora" descripcion="Registro de cada operación realizada en el sistema." />
      <div className="tarjeta">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Campo etiqueta="Usuario" className="col-span-2"><input className="campo" placeholder="Nombre o correo" value={filtros.q} onChange={filtrar('q')} /></Campo>
          <Campo etiqueta="Acción" className="col-span-2 sm:col-span-1">
            <select className="campo" value={filtros.accion} onChange={filtrar('accion')}>
              <option value="">Todas</option>
              {Object.entries(ACCIONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Desde"><input type="date" className="campo" value={filtros.desde} onChange={filtrar('desde')} /></Campo>
          <Campo etiqueta="Hasta"><input type="date" className="campo" value={filtros.hasta} onChange={filtrar('hasta')} /></Campo>
        </div>
        <ErrorApiVista error={error} />
        {!datos && !error && <Cargando />}
        {datos?.datos.length === 0 && <Vacio />}
        {datos?.datos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th><button type="button" onClick={() => setFiltros({ ...filtros, dir: filtros.dir === 'desc' ? 'asc' : 'desc' })}>Fecha {filtros.dir === 'desc' ? '↓' : '↑'}</button></th>
                  <th>Usuario</th><th>Acción</th><th>Detalle</th><th>IP</th>
                </tr>
              </thead>
              <tbody>
                {datos.datos.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-tenue">{fecha(e.creadoEn)}</td>
                    <td className="whitespace-nowrap">{e.usuarioNombre ?? '—'}</td>
                    <td><Insignia clase={e.accion === 'login_fallido' ? 'bg-red-500/15 text-red-300' : 'bg-white/10 text-texto'}>{ACCIONES[e.accion] ?? e.accion}</Insignia></td>
                    <td className="min-w-56 text-xs text-tenue">{detalleTexto(e.detalle)}</td>
                    <td className="whitespace-nowrap text-xs text-tenue">{e.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion paginacion={datos?.paginacion} onCambiar={(pagina) => setFiltros({ ...filtros, pagina })} />
      </div>
    </>
  );
}
