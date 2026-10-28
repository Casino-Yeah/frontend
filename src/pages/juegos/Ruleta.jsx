import { useState } from 'react';
import { ErrorApiVista, SelectorApuesta } from '../../components/ui.jsx';
import { Resultado, usePartida } from './comunes.jsx';

// Debe coincidir con backend/src/games/ruleta.js (solo para dibujar antes del primer giro)
const SEGMENTOS = [0, 1.5, 0, 2, 0.5, 0, 5, 0, 1, 0, 1.5, 0];
const COLOR = (m) => (m === 0 ? '#1f2937' : m < 1 ? '#7c3aed' : m === 1 ? '#0284c7' : m < 3 ? '#16a34a' : '#f5b83d');
const DURACION = 4000;

function Rueda({ segmentos, rotacion }) {
  const n = segmentos.length;
  const paso = 360 / n;
  const punto = (ang, r) => [100 + r * Math.sin((ang * Math.PI) / 180), 100 - r * Math.cos((ang * Math.PI) / 180)];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 text-3xl text-oro drop-shadow" aria-hidden>▼</div>
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-2xl"
        style={{ transform: `rotate(${rotacion}deg)`, transition: `transform ${DURACION}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` }}>
        {segmentos.map((m, i) => {
          const [x1, y1] = punto(i * paso, 96);
          const [x2, y2] = punto((i + 1) * paso, 96);
          const [tx, ty] = punto(i * paso + paso / 2, 68);
          return (
            <g key={i}>
              <path d={`M100 100 L${x1} ${y1} A96 96 0 0 1 ${x2} ${y2} Z`} fill={COLOR(m)} stroke="#0b1220" strokeWidth="1.5" />
              <text x={tx} y={ty} fill={m >= 3 ? '#111' : '#fff'} fontSize="12" fontWeight="700" textAnchor="middle" dominantBaseline="middle"
                transform={`rotate(${i * paso + paso / 2} ${tx} ${ty})`}>x{m}</text>
            </g>
          );
        })}
        <circle cx="100" cy="100" r="96" fill="none" stroke="#f5b83d" strokeWidth="4" />
        <circle cx="100" cy="100" r="14" fill="#f5b83d" stroke="#0b1220" strokeWidth="3" />
      </svg>
    </div>
  );
}

export default function Ruleta({ juego }) {
  const { partida, error, setError, ocupado, apostar, actualizarSaldo } = usePartida(juego);
  const [monto, setMonto] = useState(juego.apuestaMin);
  const [rotacion, setRotacion] = useState(0);
  const [girando, setGirando] = useState(false);
  const [mostrar, setMostrar] = useState(null);

  async function girar() {
    setMostrar(null);
    // el saldo se actualiza al terminar la animación para no adelantar el resultado
    const p = await apostar(monto, { saldoDespues: true });
    if (!p) return;
    const paso = 360 / p.vista.segmentos.length;
    const centro = p.vista.segmento * paso + paso / 2;
    // varias vueltas completas y el segmento ganador queda bajo el indicador
    setRotacion((r) => r - (r % 360) + 360 * 5 + (360 - centro));
    setGirando(true);
    setTimeout(() => {
      setGirando(false);
      setMostrar(p);
      actualizarSaldo(p.saldo);
    }, DURACION + 100);
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <div className="tarjeta pano">
        <Rueda segmentos={partida?.vista?.segmentos ?? SEGMENTOS} rotacion={rotacion} />
      </div>
      <div className="space-y-4">
        <ErrorApiVista error={error} onCerrar={() => setError(null)} />
        <div className="tarjeta space-y-4">
          <p className="text-sm text-tenue">Gira la rueda: tu apuesta se multiplica por el valor del segmento donde se detiene. Hay segmentos x0, x0.5, x1, x1.5, x2 y uno de x5.</p>
          <SelectorApuesta juego={juego} monto={monto} setMonto={setMonto} disabled={ocupado || girando} />
          <button type="button" className="btn-oro w-full py-3 text-base" disabled={ocupado || girando || !monto} onClick={girar}>
            {girando ? 'Girando…' : 'Girar la rueda'}
          </button>
        </div>
        <Resultado partida={mostrar} texto={mostrar ? `La rueda se detuvo en x${mostrar.multiplicador}` : ''} />
      </div>
    </div>
  );
}
