import { useState } from 'react';
import { api } from '../api/cliente.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alerta, Campo, Encabezado, ErrorApiVista } from '../components/ui.jsx';
import { creditos, fecha } from '../utils/formato.js';

export default function Perfil() {
  const { usuario } = useAuth();
  const [form, setForm] = useState({ actual: '', nueva: '' });
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setOk('');
    try {
      const r = await api.put('/auth/password', form);
      setOk(r.mensaje);
      setForm({ actual: '', nueva: '' });
    } catch (err) {
      setError(err);
    }
  }

  return (
    <>
      <Encabezado titulo="Mi perfil" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="tarjeta space-y-2 text-sm">
          <p><span className="text-tenue">Nombre:</span> {usuario.nombre}</p>
          <p><span className="text-tenue">Correo:</span> {usuario.correo}</p>
          <p><span className="text-tenue">Rol:</span> {usuario.rol}</p>
          <p><span className="text-tenue">Fecha de nacimiento:</span> {fecha(usuario.fechaNacimiento, false)}</p>
          {usuario.rol === 'jugador' && <p><span className="text-tenue">Saldo:</span> {creditos(usuario.saldo)} créditos</p>}
          <p><span className="text-tenue">Miembro desde:</span> {fecha(usuario.creadoEn, false)}</p>
        </div>
        <form onSubmit={enviar} className="tarjeta space-y-4">
          <h2 className="font-semibold">Cambiar contraseña</h2>
          <ErrorApiVista error={error} />
          <Alerta tipo="exito">{ok}</Alerta>
          <Campo etiqueta="Contraseña actual">
            <input className="campo" type="password" autoComplete="current-password" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
          </Campo>
          <Campo etiqueta="Nueva contraseña">
            <input className="campo" type="password" autoComplete="new-password" value={form.nueva} onChange={(e) => setForm({ ...form, nueva: e.target.value })} />
          </Campo>
          <button className="btn-oro">Guardar</button>
        </form>
      </div>
    </>
  );
}
