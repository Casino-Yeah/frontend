import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/cliente.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Alerta, Campo, Cargando, Encabezado, ErrorApiVista, Insignia, Modal, Paginacion, Vacio, useDebounce } from '../../components/ui.jsx';
import { creditos, fecha } from '../../utils/formato.js';

const VACIO = { nombre: '', correo: '', password: '', fechaNacimiento: '', rol: 'jugador', activo: true };

function FormUsuario({ inicial, onGuardado, onCancelar }) {
  const editando = Boolean(inicial?.id);
  const [form, setForm] = useState(editando ? { ...inicial, password: '', fechaNacimiento: inicial.fechaNacimiento?.slice(0, 10) } : VACIO);
  const [error, setError] = useState(null);
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const errorDe = (c) => error?.errores?.find((x) => x.campo === c)?.mensaje;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    const { nombre, correo, password, fechaNacimiento, rol, activo } = form;
    const datos = { nombre, correo, fechaNacimiento, rol, activo, ...(password ? { password } : {}) };
    try {
      const u = editando ? await api.put(`/usuarios/${inicial.id}`, datos) : await api.post('/usuarios', datos);
      onGuardado(u, editando);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3" noValidate>
      <ErrorApiVista error={error?.errores?.length ? { message: error.message } : error} />
      <Campo etiqueta="Nombre" error={errorDe('nombre')}><input className="campo" value={form.nombre} onChange={cambiar('nombre')} /></Campo>
      <Campo etiqueta="Correo" error={errorDe('correo')}><input className="campo" type="email" value={form.correo} onChange={cambiar('correo')} /></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Fecha de nacimiento" error={errorDe('fechaNacimiento')}><input className="campo" type="date" value={form.fechaNacimiento} onChange={cambiar('fechaNacimiento')} /></Campo>
        <Campo etiqueta="Rol"><select className="campo" value={form.rol} onChange={cambiar('rol')}><option value="jugador">Jugador</option><option value="admin">Administrador</option></select></Campo>
      </div>
      <Campo etiqueta={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'} error={errorDe('password')}>
        <input className="campo" type="password" autoComplete="new-password" value={form.password} onChange={cambiar('password')} />
      </Campo>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.activo} onChange={cambiar('activo')} className="accent-[#f5b83d]" /> Cuenta activa</label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
        <button className="btn-oro">{editando ? 'Guardar cambios' : 'Crear usuario'}</button>
      </div>
    </form>
  );
}

function FormAjuste({ usuario, onHecho, onCancelar }) {
  const [form, setForm] = useState({ monto: '', motivo: '' });
  const [error, setError] = useState(null);
  async function enviar(e) {
    e.preventDefault();
    setError(null);
    try {
      const r = await api.post(`/usuarios/${usuario.id}/ajuste-saldo`, { monto: Number(form.monto), motivo: form.motivo });
      onHecho(r);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <form onSubmit={enviar} className="space-y-3">
      <p className="text-sm text-tenue">Saldo actual de {usuario.nombre}: <strong className="text-oro">{creditos(usuario.saldo)}</strong></p>
      <ErrorApiVista error={error} />
      <Campo etiqueta="Monto (negativo para descontar)"><input className="campo" type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></Campo>
      <Campo etiqueta="Motivo (obligatorio, queda en la bitácora)"><input className="campo" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} /></Campo>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-sec" onClick={onCancelar}>Cancelar</button>
        <button className="btn-oro">Aplicar ajuste</button>
      </div>
    </form>
  );
}

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const [filtros, setFiltros] = useState({ q: '', rol: '', activo: '', orden: 'creadoEn', dir: 'desc', pagina: 1 });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState(null); // { tipo: 'form' | 'ajuste' | 'baja', usuario }
  const q = useDebounce(filtros.q);

  const cargar = useCallback(() => api.get('/usuarios', { ...filtros, q, limite: 10 }).then(setDatos).catch(setError),
    [filtros.rol, filtros.activo, filtros.orden, filtros.dir, filtros.pagina, q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, [cargar]);

  const filtrar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value, pagina: 1 });
  const ordenar = (orden) => setFiltros({ ...filtros, orden, dir: filtros.orden === orden && filtros.dir === 'asc' ? 'desc' : 'asc', pagina: 1 });
  const flecha = (orden) => (filtros.orden === orden ? (filtros.dir === 'desc' ? ' ↓' : ' ↑') : '');
  const cerrar = () => setModal(null);
  const terminar = (mensaje) => { cerrar(); setOk(mensaje); cargar(); };

  async function darDeBaja(u) {
    try {
      await api.delete(`/usuarios/${u.id}`);
      terminar(`${u.nombre} fue dado de baja`);
    } catch (err) {
      cerrar();
      setError(err);
    }
  }

  return (
    <>
      <Encabezado titulo="Usuarios" descripcion="Administra jugadores y administradores.">
        <button type="button" className="btn-oro" onClick={() => setModal({ tipo: 'form', usuario: null })}>+ Nuevo usuario</button>
      </Encabezado>
      <div className="tarjeta">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Campo etiqueta="Buscar" className="sm:col-span-2"><input className="campo" placeholder="Nombre o correo" value={filtros.q} onChange={filtrar('q')} /></Campo>
          <Campo etiqueta="Rol"><select className="campo" value={filtros.rol} onChange={filtrar('rol')}><option value="">Todos</option><option value="jugador">Jugador</option><option value="admin">Administrador</option></select></Campo>
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
                  <th><button type="button" onClick={() => ordenar('nombre')}>Nombre{flecha('nombre')}</button></th>
                  <th><button type="button" onClick={() => ordenar('correo')}>Correo{flecha('correo')}</button></th>
                  <th>Rol</th>
                  <th className="text-right"><button type="button" onClick={() => ordenar('saldo')}>Saldo{flecha('saldo')}</button></th>
                  <th><button type="button" onClick={() => ordenar('creadoEn')}>Alta{flecha('creadoEn')}</button></th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datos.datos.map((u) => (
                  <tr key={u.id}>
                    <td className="whitespace-nowrap font-medium">{u.nombre}</td>
                    <td className="text-tenue">{u.correo}</td>
                    <td><Insignia clase={u.rol === 'admin' ? 'bg-oro/15 text-oro' : 'bg-sky-500/15 text-sky-300'}>{u.rol}</Insignia></td>
                    <td className="text-right">{u.saldo === null ? '—' : creditos(u.saldo)}</td>
                    <td className="whitespace-nowrap text-tenue">{fecha(u.creadoEn, false)}</td>
                    <td><Insignia clase={u.activo ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}>{u.activo ? 'Activo' : 'Inactivo'}</Insignia></td>
                    <td className="whitespace-nowrap text-right">
                      <button type="button" className="px-2 text-oro hover:underline" onClick={() => setModal({ tipo: 'form', usuario: u })}>Editar</button>
                      {u.rol === 'jugador' && <button type="button" className="px-2 text-sky-300 hover:underline" onClick={() => setModal({ tipo: 'ajuste', usuario: u })}>Saldo</button>}
                      {u.activo && u.id !== yo.id && <button type="button" className="px-2 text-red-300 hover:underline" onClick={() => setModal({ tipo: 'baja', usuario: u })}>Baja</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion paginacion={datos?.paginacion} onCambiar={(pagina) => setFiltros({ ...filtros, pagina })} />
      </div>

      <Modal abierto={modal?.tipo === 'form'} titulo={modal?.usuario ? 'Editar usuario' : 'Nuevo usuario'} onCerrar={cerrar}>
        {modal?.tipo === 'form' && <FormUsuario inicial={modal.usuario} onCancelar={cerrar} onGuardado={(u, ed) => terminar(`${u.nombre} ${ed ? 'actualizado' : 'creado'}`)} />}
      </Modal>
      <Modal abierto={modal?.tipo === 'ajuste'} titulo="Ajustar saldo" onCerrar={cerrar}>
        {modal?.tipo === 'ajuste' && <FormAjuste usuario={modal.usuario} onCancelar={cerrar} onHecho={(r) => terminar(`Ajuste aplicado. Nuevo saldo: ${creditos(r.saldo)}`)} />}
      </Modal>
      <Modal abierto={modal?.tipo === 'baja'} titulo="Dar de baja" onCerrar={cerrar}>
        {modal?.tipo === 'baja' && (
          <>
            <p className="text-sm">¿Desactivar la cuenta de <strong>{modal.usuario.nombre}</strong>? No podrá iniciar sesión, pero su historial se conserva y puedes reactivarla al editarla.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-sec" onClick={cerrar}>Cancelar</button>
              <button type="button" className="btn-peligro" onClick={() => darDeBaja(modal.usuario)}>Dar de baja</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
