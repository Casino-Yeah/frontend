import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/cliente.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alerta, Campo, Cargando, Encabezado, ErrorApiVista, Paginacion, Vacio } from '../../components/ui.jsx';
import { creditos, fecha, TIPOS_MOVIMIENTO } from '../../utils/formato.js';

export default function Billetera() {
  const { actualizarSaldo } = useAuth();
  const [billetera, setBilletera] = useState(null);
  const [monto, setMonto] = useState(500);
  const [filtros, setFiltros] = useState({ tipo: '', desde: '', hasta: '', pagina: 1 });
  const [movs, setMovs] = useState(null);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargarBilletera = useCallback(() => api.get('/billetera').then((b) => { setBilletera(b); actualizarSaldo(b.saldo); }), [actualizarSaldo]);
  const cargarMovs = useCallback(() => api.get('/billetera/movimientos', { ...filtros, limite: 10 }).then(setMovs), [filtros]);

  useEffect(() => { cargarBilletera().catch(setError); }, [cargarBilletera]);
  useEffect(() => { cargarMovs().catch(setError); }, [cargarMovs]);

  async function recargar(e) {
    e.preventDefault();
    setError(null);
    setOk('');
    setEnviando(true);
    try {
      const r = await api.post('/billetera/recargas', { monto: Number(monto) });
      setOk(`Recarga aplicada. Nuevo saldo: ${creditos(r.saldo)} créditos`);
      await Promise.all([cargarBilletera(), cargarMovs()]);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  const filtrar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value, pagina: 1 });

  return (
    <>
      <Encabezado titulo="Mi billetera" descripcion="Créditos virtuales: recarga, consulta tu saldo y revisa tus movimientos." />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="tarjeta md:col-span-1">
          <p className="text-sm text-tenue">Saldo disponible</p>
          <p className="mt-1 text-4xl font-bold text-oro">{billetera ? creditos(billetera.saldo) : '…'}</p>
          <p className="mt-1 text-xs text-tenue">créditos</p>
          {billetera && (
            <p className="mt-4 text-xs text-tenue">
              Hoy has recargado {creditos(billetera.recargadoHoy)} · disponible hoy {creditos(billetera.recargaDisponibleHoy)}
            </p>
          )}
        </div>
        <form onSubmit={recargar} className="tarjeta space-y-3 md:col-span-2">
          <h2 className="font-semibold">Recargar créditos</h2>
          <ErrorApiVista error={error} onCerrar={() => setError(null)} />
          <Alerta tipo="exito" onCerrar={() => setOk('')}>{ok}</Alerta>
          <div className="flex flex-wrap items-end gap-2">
            <Campo etiqueta={billetera ? `Monto (${creditos(billetera.limites.minima)} a ${creditos(billetera.limites.maxima)})` : 'Monto'}>
              <input type="number" className="campo w-40" value={monto} min={100} max={5000} onChange={(e) => setMonto(e.target.value)} />
            </Campo>
            {[100, 500, 1000, 5000].map((v) => <button key={v} type="button" className="btn-sec" onClick={() => setMonto(v)}>{creditos(v)}</button>)}
            <button className="btn-oro" disabled={enviando}>{enviando ? 'Recargando…' : 'Recargar'}</button>
          </div>
          <p className="text-xs text-tenue">Límite diario de recarga: {billetera ? creditos(billetera.limites.diaria) : '…'} créditos.</p>
        </form>
      </div>

      <div className="tarjeta mt-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto font-semibold">Movimientos</h2>
          <Campo etiqueta="Tipo">
            <select className="campo" value={filtros.tipo} onChange={filtrar('tipo')}>
              <option value="">Todos</option>
              {Object.entries(TIPOS_MOVIMIENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Desde"><input type="date" className="campo" value={filtros.desde} onChange={filtrar('desde')} /></Campo>
          <Campo etiqueta="Hasta"><input type="date" className="campo" value={filtros.hasta} onChange={filtrar('hasta')} /></Campo>
        </div>
        {!movs && <Cargando />}
        {movs?.datos.length === 0 && <Vacio texto="Sin movimientos con esos filtros" />}
        {movs?.datos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th className="text-right">Monto</th><th className="text-right">Saldo</th></tr></thead>
              <tbody>
                {movs.datos.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap text-tenue">{fecha(m.creadoEn)}</td>
                    <td>{TIPOS_MOVIMIENTO[m.tipo]}</td>
                    <td className="min-w-40">{m.descripcion}</td>
                    <td className={`text-right font-medium ${m.monto < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{m.monto > 0 ? '+' : ''}{creditos(m.monto)}</td>
                    <td className="text-right">{creditos(m.saldoResultante)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion paginacion={movs?.paginacion} onCambiar={(pagina) => setFiltros({ ...filtros, pagina })} />
      </div>
    </>
  );
}
