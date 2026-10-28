import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/cliente.js';
import { Alerta, Campo, Cargando, Encabezado, ErrorApiVista, Insignia, Modal, Paginacion, Vacio, useDebounce } from '../../components/ui.jsx';
import { creditos } from '../../utils/formato.js';
import { ICONOS } from '../jugador/Lobby.jsx';

const TIPOS = { blackjack: 'Blackjack', poker: 'Video póker', ruleta: 'Ruleta de la suerte', billar: 'Billar 2D' };
const VACIO = { slug: '', tipo: 'blackjack', nombre: '', descripcion: '', apuestaMin: 10, apuestaMax: 1000, activo: true };

function FormJuego({ inicial, onGuardado, onCancelar }) {
  const editando = Boolean(inicial?.id);
  const [form, setForm] = useState(editando ? inicial : VACIO);
  const [error, setError] = useState(null);
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const errorDe = (c) => error?.errores?.find((x) => x.campo === c)?.mensaje;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    const datos = {
      slug: form.slug, tipo: form.tipo, nombre: form.nombre, descripcion: form.descripcion,
      apuestaMin: Number(form.apuestaMin), apuestaMax: Number(form.apuestaMax), activo: form.activo,
    };
    try {
      const j = editando ? await api.put(`/juegos/${inicial.id}`, datos) : await api.post('/juegos', datos);
      onGuardado(j, editando);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3" noValidate>
      <ErrorApiVista error={error?.errores?.length ? { message: error.message } : error} />
      <Campo etiqueta="Nombre" error={errorDe('nombre')}><input className="campo" value={form.nombre} onChange={cambiar('nombre')} /></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Identificador (slug)" error={errorDe('slug')}><input className="campo" placeholder="blackjack-vip" value={form.slug} onChange={cambiar('slug')} /></Campo>
        <Campo etiqueta="Tipo de juego" error={errorDe('tipo')}>
          <select className="campo" value={form.tipo} onChange={cambiar('tipo')} disabled={editando && inicial.apuestas > 0}>
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Descripción" error={errorDe('descripcion')}><textarea className="campo" rows={2} value={form.descripcion} onChange={cambiar('descripcion')} /></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Apuesta mínima" error={errorDe('apuestaMin')}><input className="campo" type="number" min="1" value={form.apuestaMin} onChange={cambiar('apuestaMin')} /></Campo>
        <Campo etiqueta="Apuesta máxima" error={errorDe('apuestaMax')}><input className="campo" type="number" min="1" value={form.apuestaMax} onChange={cambiar('apuestaMax')} /></Campo>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.activo} onChange={cambiar('activo')} className="accent-[#f5b83d]" /> Disponible para los jugadores</label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
        <button className="btn-oro">{editando ? 'Guardar cambios' : 'Crear juego'}</button>
      </div>
    </form>
  );
}

export default function Juegos() {
  const [filtros, setFiltros] = useState({ q: '', tipo: '', activo: '', orden: 'nombre', dir: 'asc', pagina: 1 });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState(null);
  const q = useDebounce(filtros.q);

  const cargar = useCallback(() => api.get('/juegos', { ...filtros, q, limite: 10 }).then(setDatos).catch(setError),
    [filtros.tipo, filtros.activo, filtros.orden, filtros.dir, filtros.pagina, q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, [cargar]);

  const filtrar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value, pagina: 1 });
  const ordenar = (orden) => setFiltros({ ...filtros, orden, dir: filtros.orden === orden && filtros.dir === 'asc' ? 'desc' : 'asc', pagina: 1 });
  const flecha = (orden) => (filtros.orden === orden ? (filtros.dir === 'desc' ? ' ↓' : ' ↑') : '');
  const cerrar = () => setModal(null);
  const terminar = (m) => { cerrar(); setOk(m); cargar(); };

  async function borrar(j) {
    try {
      await api.delete(`/juegos/${j.id}`);
      terminar(`${j.nombre} fue eliminado`);
    } catch (err) {
      cerrar();
      setError(err);
    }
  }

  return (
    <>
      <Encabezado titulo="Juegos" descripcion="Límites de apuesta, disponibilidad y variantes de cada juego.">
        <button type="button" className="btn-oro" onClick={() => setModal({ tipo: 'form', juego: null })}>+ Nuevo juego</button>
      </Encabezado>
      <div className="tarjeta">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Campo etiqueta="Buscar" className="sm:col-span-2"><input className="campo" placeholder="Nombre o descripción" value={filtros.q} onChange={filtrar('q')} /></Campo>
          <Campo etiqueta="Tipo"><select className="campo" value={filtros.tipo} onChange={filtrar('tipo')}><option value="">Todos</option>{Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Campo>
          <Campo etiqueta="Estado"><select className="campo" value={filtros.activo} onChange={filtrar('activo')}><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></Campo>
        </div>
        <ErrorApiVista error={error} onCerrar={() => setError(null)} />
        <Alerta tipo="exito" onCerrar={() => setOk('')}>{ok}</Alerta>
        {!datos && !error && <Cargando />}
        {datos?.datos.length === 0 && <Vacio />}
        {datos?.datos.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th><button type="button" onClick={() => ordenar('nombre')}>Juego{flecha('nombre')}</button></th>
                  <th>Tipo</th>
                  <th className="text-right"><button type="button" onClick={() => ordenar('apuestaMin')}>Mín.{flecha('apuestaMin')}</button></th>
                  <th className="text-right"><button type="button" onClick={() => ordenar('apuestaMax')}>Máx.{flecha('apuestaMax')}</button></th>
                  <th className="text-right"><button type="button" onClick={() => ordenar('apuestas')}>Apuestas{flecha('apuestas')}</button></th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datos.datos.map((j) => (
                  <tr key={j.id}>
                    <td className="whitespace-nowrap font-medium">{ICONOS[j.tipo]} {j.nombre}</td>
                    <td className="whitespace-nowrap text-tenue">{TIPOS[j.tipo]}</td>
                    <td className="text-right">{creditos(j.apuestaMin)}</td>
                    <td className="text-right">{creditos(j.apuestaMax)}</td>
                    <td className="text-right">{creditos(j.apuestas)}</td>
                    <td><Insignia clase={j.activo ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}>{j.activo ? 'Activo' : 'Inactivo'}</Insignia></td>
                    <td className="whitespace-nowrap text-right">
                      <button type="button" className="px-2 text-oro hover:underline" onClick={() => setModal({ tipo: 'form', juego: j })}>Editar</button>
                      <button type="button" className="px-2 text-red-300 hover:underline" onClick={() => setModal({ tipo: 'borrar', juego: j })}>Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion paginacion={datos?.paginacion} onCambiar={(pagina) => setFiltros({ ...filtros, pagina })} />
      </div>

      <Modal abierto={modal?.tipo === 'form'} titulo={modal?.juego ? 'Editar juego' : 'Nuevo juego'} onCerrar={cerrar}>
        {modal?.tipo === 'form' && <FormJuego inicial={modal.juego} onCancelar={cerrar} onGuardado={(j, ed) => terminar(`${j.nombre} ${ed ? 'actualizado' : 'creado'}`)} />}
      </Modal>
      <Modal abierto={modal?.tipo === 'borrar'} titulo="Borrar juego" onCerrar={cerrar}>
        {modal?.tipo === 'borrar' && (
          <>
            <p className="text-sm">
              ¿Borrar <strong>{modal.juego.nombre}</strong>?
              {modal.juego.apuestas > 0 && ' Este juego tiene apuestas registradas, por lo que no se puede borrar: desactívalo desde Editar.'}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-sec" onClick={cerrar}>Cancelar</button>
              <button type="button" className="btn-peligro" disabled={modal.juego.apuestas > 0} onClick={() => borrar(modal.juego)}>Borrar</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
