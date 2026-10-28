import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, ErrorApiVista } from '../components/ui.jsx';

export function MarcoAcceso({ titulo, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src="/ficha.svg" alt="" className="mx-auto h-14 w-14" />
          <h1 className="mt-3 text-2xl font-bold">Casino Online</h1>
          <p className="text-sm text-tenue">{titulo}</p>
        </div>
        <div className="tarjeta">{children}</div>
        <p className="mt-4 text-center text-xs text-tenue">Plataforma con créditos virtuales. No se usa dinero real.</p>
      </div>
    </div>
  );
}

export default function Login() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [form, setForm] = useState({ correo: '', password: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const u = await entrar(form.correo, form.password);
      navegar(u.rol === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoAcceso titulo="Inicia sesión para jugar">
      <form onSubmit={enviar} className="space-y-4">
        <ErrorApiVista error={error} />
        <Campo etiqueta="Correo">
          <input className="campo" type="email" autoComplete="email" required value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
        </Campo>
        <Campo etiqueta="Contraseña">
          <input className="campo" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Campo>
        <button className="btn-oro w-full" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        <p className="text-center text-sm text-tenue">¿No tienes cuenta? <Link to="/registro" className="text-oro hover:underline">Regístrate</Link></p>
      </form>
    </MarcoAcceso>
  );
}
