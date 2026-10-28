import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, ErrorApiVista } from '../components/ui.jsx';
import { MarcoAcceso } from './Login.jsx';

export default function Registro() {
  const { registrar } = useAuth();
  const navegar = useNavigate();
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', confirmar: '', fechaNacimiento: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const errorDe = (campo) => error?.errores?.find((x) => x.campo === campo)?.mensaje;

  async function enviar(e) {
    e.preventDefault();
    if (form.password !== form.confirmar) {
      setError({ message: 'Las contraseñas no coinciden', errores: [] });
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const { confirmar, ...datos } = form;
      await registrar(datos);
      navegar('/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoAcceso titulo="Crea tu cuenta y recibe 1,000 créditos de bienvenida">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <ErrorApiVista error={error?.errores?.length ? { message: error.message } : error} />
        <Campo etiqueta="Nombre completo" error={errorDe('nombre')}>
          <input className="campo" autoComplete="name" required value={form.nombre} onChange={cambiar('nombre')} />
        </Campo>
        <Campo etiqueta="Correo" error={errorDe('correo')}>
          <input className="campo" type="email" autoComplete="email" required value={form.correo} onChange={cambiar('correo')} />
        </Campo>
        <Campo etiqueta="Fecha de nacimiento (debes ser mayor de 18)" error={errorDe('fechaNacimiento')}>
          <input className="campo" type="date" required value={form.fechaNacimiento} onChange={cambiar('fechaNacimiento')} />
        </Campo>
        <Campo etiqueta="Contraseña (8+ caracteres, letras y números)" error={errorDe('password')}>
          <input className="campo" type="password" autoComplete="new-password" required value={form.password} onChange={cambiar('password')} />
        </Campo>
        <Campo etiqueta="Confirmar contraseña">
          <input className="campo" type="password" autoComplete="new-password" required value={form.confirmar} onChange={cambiar('confirmar')} />
        </Campo>
        <button className="btn-oro w-full" disabled={enviando}>{enviando ? 'Creando cuenta…' : 'Crear cuenta'}</button>
        <p className="text-center text-sm text-tenue">¿Ya tienes cuenta? <Link to="/login" className="text-oro hover:underline">Inicia sesión</Link></p>
      </form>
    </MarcoAcceso>
  );
}
