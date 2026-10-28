import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { creditos } from '../utils/formato.js';

const MENU = {
  jugador: [
    { a: '/', texto: 'Juegos', fin: true },
    { a: '/billetera', texto: 'Billetera' },
    { a: '/historial', texto: 'Historial' },
  ],
  admin: [
    { a: '/admin', texto: 'Dashboard', fin: true },
    { a: '/admin/usuarios', texto: 'Usuarios' },
    { a: '/admin/juegos', texto: 'Juegos' },
    { a: '/admin/apuestas', texto: 'Apuestas' },
    { a: '/admin/reportes', texto: 'Reportes' },
    { a: '/admin/bitacora', texto: 'Bitácora' },
  ],
};

export default function Layout() {
  const { usuario, salir } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const enlaces = MENU[usuario.rol] ?? [];
  const clase = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-oro/15 text-oro' : 'text-tenue hover:bg-white/5 hover:text-texto'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-borde bg-fondo/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link to={usuario.rol === 'admin' ? '/admin' : '/'} className="flex items-center gap-2 font-bold">
            <img src="/ficha.svg" alt="" className="h-7 w-7" />
            <span className="hidden sm:inline">Casino Online</span>
          </Link>
          <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
            {enlaces.map((e) => <NavLink key={e.a} to={e.a} end={e.fin} className={clase}>{e.texto}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {usuario.rol === 'jugador' && (
              <Link to="/billetera" className="rounded-full border border-oro/40 bg-oro/10 px-3 py-1 text-sm font-semibold text-oro" title="Saldo">
                🪙 {creditos(usuario.saldo)}
              </Link>
            )}
            <Link to="/perfil" className="hidden text-sm text-tenue hover:text-texto sm:block" title="Mi perfil">{usuario.nombre.split(' ')[0]}</Link>
            <button type="button" onClick={salir} className="btn-sec hidden px-3 py-1.5 md:inline-flex">Salir</button>
            <button type="button" className="btn-sec px-3 py-1.5 md:hidden" onClick={() => setAbierto((v) => !v)} aria-label="Menú" aria-expanded={abierto}>☰</button>
          </div>
        </div>
        {abierto && (
          <nav className="flex flex-col gap-1 border-t border-borde px-4 py-3 md:hidden" onClick={() => setAbierto(false)}>
            {enlaces.map((e) => <NavLink key={e.a} to={e.a} end={e.fin} className={clase}>{e.texto}</NavLink>)}
            <NavLink to="/perfil" className={clase}>Mi perfil</NavLink>
            <button type="button" onClick={salir} className="rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-white/5">Cerrar sesión</button>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-borde py-4 text-center text-xs text-tenue">
        Casino Online · Equipo 08 · Solo créditos virtuales, sin dinero real
      </footer>
    </div>
  );
}
