import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/cliente.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Cargando, Encabezado, ErrorApiVista, Vacio } from '../../components/ui.jsx';
import { creditos } from '../../utils/formato.js';

export const ICONOS = { blackjack: '🂡', poker: '🃏', ruleta: '🎡', billar: '🎱' };
const FONDOS = {
  blackjack: 'from-emerald-700 to-emerald-950',
  poker: 'from-indigo-700 to-indigo-950',
  ruleta: 'from-rose-700 to-rose-950',
  billar: 'from-teal-700 to-cyan-950',
};

export default function Lobby() {
  const { usuario } = useAuth();
  const [juegos, setJuegos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/juegos', { limite: 50, orden: 'nombre' }).then((r) => setJuegos(r.datos)).catch(setError);
  }, []);

  return (
    <>
      <Encabezado titulo={`Hola, ${usuario.nombre.split(' ')[0]}`} descripcion="Elige un juego. Todas las apuestas usan créditos virtuales." />
      <ErrorApiVista error={error} />
      {!juegos && !error && <Cargando />}
      {juegos?.length === 0 && <Vacio texto="No hay juegos disponibles por ahora" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {juegos?.map((j) => (
          <Link key={j.id} to={`/jugar/${j.id}`} className="group overflow-hidden rounded-xl border border-borde bg-panel transition hover:-translate-y-0.5 hover:border-oro/60">
            <div className={`flex h-32 items-center justify-center bg-gradient-to-br text-6xl ${FONDOS[j.tipo]}`}>
              <span className="transition group-hover:scale-110">{ICONOS[j.tipo]}</span>
            </div>
            <div className="p-4">
              <h2 className="font-semibold">{j.nombre}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-tenue">{j.descripcion}</p>
              <p className="mt-3 text-xs text-oro">Apuesta: {creditos(j.apuestaMin)} – {creditos(j.apuestaMax)}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
