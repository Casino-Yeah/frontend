import { useState } from 'react';
import { Alerta, ErrorApiVista, SelectorApuesta } from '../../components/ui.jsx';
import { Carta, Resultado, usePartida } from './comunes.jsx';

const TEXTOS = { blackjack: '¡Blackjack natural! Paga 3 a 2.', gana: 'Tu mano vence al crupier.', empate: 'Misma puntuación que el crupier.', pierde: 'El crupier gana esta mano.' };

export default function Blackjack({ juego, hayEnCurso }) {
  const { partida, error, setError, aviso, ocupado, apostar, jugar, reanudar, nueva } = usePartida(juego);
  const [monto, setMonto] = useState(juego.apuestaMin);
  const v = partida?.vista;
  const jugando = partida?.estado === 'en_curso';

  return (
    <div className="space-y-4">
      <ErrorApiVista error={error} onCerrar={() => setError(null)} />
      <Alerta tipo="info">{aviso}</Alerta>
      {!partida && hayEnCurso && <Alerta tipo="info">Tienes una mano sin terminar. <button type="button" className="underline" onClick={reanudar}>Continuarla</button></Alerta>}

      <div className="pano rounded-2xl border-4 border-amber-900/70 p-4 shadow-inner sm:p-6">
        <div className="min-h-36">
          <p className="mb-2 text-sm font-semibold text-white/80">Crupier {v && <span className="ml-1 rounded bg-black/30 px-2">{v.totalCrupier}</span>}</p>
          <div className="flex flex-wrap gap-2">{v ? v.crupier.map((c, i) => <Carta key={i} carta={c} />) : [0, 1].map((i) => <Carta key={i} carta={null} />)}</div>
        </div>
        <div className="my-4 text-center text-xs uppercase tracking-[0.3em] text-white/50">Blackjack paga 3 a 2 · el crupier se planta en 17</div>
        <div className="min-h-36">
          <p className="mb-2 text-sm font-semibold text-white/80">Tu mano {v && <span className="ml-1 rounded bg-black/30 px-2">{v.totalJugador}</span>}</p>
          <div className="flex flex-wrap gap-2">{v ? v.jugador.map((c, i) => <Carta key={i} carta={c} />) : <p className="text-sm text-white/60">Haz tu apuesta para repartir.</p>}</div>
        </div>
      </div>

      <Resultado partida={partida} texto={TEXTOS[v?.resultado]} />

      <div className="tarjeta flex flex-wrap items-end justify-between gap-4">
        {jugando ? (
          <div className="flex gap-2">
            <button type="button" className="btn-oro" disabled={ocupado} onClick={() => jugar('pedir')}>Pedir carta</button>
            <button type="button" className="btn-sec" disabled={ocupado} onClick={() => jugar('plantarse')}>Plantarse</button>
          </div>
        ) : (
          <>
            <SelectorApuesta juego={juego} monto={monto} setMonto={setMonto} disabled={ocupado} />
            <div className="flex gap-2">
              {partida && <button type="button" className="btn-sec" onClick={nueva}>Limpiar mesa</button>}
              <button type="button" className="btn-oro" disabled={ocupado || !monto} onClick={() => apostar(monto)}>Repartir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
