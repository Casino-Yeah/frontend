import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/cliente.js';
import { Cargando, ErrorApiVista } from '../../components/ui.jsx';
import { creditos } from '../../utils/formato.js';
import Blackjack from './Blackjack.jsx';
import Poker from './Poker.jsx';
import Ruleta from './Ruleta.jsx';
import Billar from './Billar.jsx';

const COMPONENTES = { blackjack: Blackjack, poker: Poker, ruleta: Ruleta, billar: Billar };

export default function Jugar() {
  const { id } = useParams();
  const [juego, setJuego] = useState(null);
  const [enCurso, setEnCurso] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setJuego(null);
    setError(null);
    api.get(`/juegos/${id}`).then(setJuego).catch(setError);
    api.get('/apuestas', { juegoId: id, estado: 'en_curso', limite: 1 }).then((r) => setEnCurso(r.datos[0] ?? null)).catch(() => {});
  }, [id]);

  if (error) return <><ErrorApiVista error={error} /><Link to="/" className="btn-sec mt-4">Volver a los juegos</Link></>;
  if (!juego) return <Cargando />;
  const Componente = COMPONENTES[juego.tipo];
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link to="/" className="text-sm text-tenue hover:text-texto">← Juegos</Link>
        <h1 className="text-2xl font-bold">{juego.nombre}</h1>
        <span className="text-xs text-tenue">Apuesta de {creditos(juego.apuestaMin)} a {creditos(juego.apuestaMax)}</span>
      </div>
      <Componente key={juego.id} juego={juego} hayEnCurso={Boolean(enCurso)} />
    </>
  );
}
