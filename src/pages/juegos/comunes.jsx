import { useCallback, useState } from 'react';
import { api } from '../../api/cliente.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { creditos } from '../../utils/formato.js';

/** Maneja el ciclo de una partida: apostar (endpoint 19) y jugar (endpoint 20) */
export function usePartida(juego) {
  const { actualizarSaldo } = useAuth();
  const [partida, setPartida] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const ejecutar = useCallback(async (fn, { saldoDespues = false } = {}) => {
    setOcupado(true);
    setError(null);
    setAviso('');
    try {
      const p = await fn();
      setPartida(p);
      if (!saldoDespues) actualizarSaldo(p.saldo);
      return p;
    } catch (err) {
      // RN-05: si ya hay una partida en curso, la retomamos
      if (err.estado === 409 && err.cuerpo?.partida) {
        setPartida(err.cuerpo.partida);
        actualizarSaldo(err.cuerpo.partida.saldo);
        setAviso('Tenías una partida en curso de este juego: puedes continuarla.');
        return err.cuerpo.partida;
      }
      setError(err);
      return null;
    } finally {
      setOcupado(false);
    }
  }, [actualizarSaldo]);

  const apostar = useCallback((monto, opciones) => ejecutar(() => api.post('/apuestas', { juegoId: juego.id, monto: Number(monto) }), opciones), [ejecutar, juego.id]);
  const jugar = useCallback((accion, datos = {}, opciones) => ejecutar(() => api.post(`/apuestas/${partida.id}/acciones`, { accion, ...datos }), opciones), [ejecutar, partida?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const reanudar = useCallback(() => apostar(juego.apuestaMin), [apostar, juego.apuestaMin]);
  const nueva = useCallback(() => { setPartida(null); setError(null); setAviso(''); }, []);

  return { partida, error, setError, aviso, ocupado, apostar, jugar, reanudar, nueva, actualizarSaldo };
}

export function Resultado({ partida, texto }) {
  if (!partida || partida.estado === 'en_curso') return null;
  const estilos = {
    ganada: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
    empate: 'border-slate-400/50 bg-slate-500/15 text-slate-200',
    perdida: 'border-red-400/50 bg-red-500/15 text-red-200',
  };
  const titulo = { ganada: '¡Ganaste!', empate: 'Recuperas tu apuesta', perdida: 'Esta vez no' }[partida.estado];
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${estilos[partida.estado]}`} role="status">
      <p className="text-lg font-bold">{titulo}</p>
      {texto && <p className="text-sm">{texto}</p>}
      <p className="text-sm">
        Apostaste {creditos(partida.monto)} · multiplicador x{partida.multiplicador} · pago <strong>{creditos(partida.pago)}</strong>
      </p>
    </div>
  );
}

const PALOS = { S: '♠', H: '♥', D: '♦', C: '♣' };
const VALORES = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

export function Carta({ carta, seleccionada, onClick, pequena }) {
  const tam = pequena ? 'h-20 w-14 text-base' : 'h-24 w-16 text-lg sm:h-32 sm:w-22 sm:text-2xl';
  if (!carta) {
    return <div className={`${tam} shrink-0 rounded-lg border-2 border-white/80 bg-[repeating-linear-gradient(45deg,#7f1d1d_0_6px,#991b1b_6px_12px)] shadow-lg`} aria-label="Carta oculta" />;
  }
  const roja = carta.p === 'H' || carta.p === 'D';
  const valor = VALORES[carta.v] ?? carta.v;
  const Etiqueta = onClick ? 'button' : 'div';
  return (
    <Etiqueta type={onClick ? 'button' : undefined} onClick={onClick}
      className={`${tam} relative flex shrink-0 flex-col justify-between rounded-lg bg-white p-1.5 font-bold shadow-lg transition ${roja ? 'text-red-600' : 'text-slate-900'} ${seleccionada ? '-translate-y-3 ring-4 ring-oro' : ''} ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
      aria-label={`${valor} de ${PALOS[carta.p]}${seleccionada ? ', conservada' : ''}`} aria-pressed={onClick ? Boolean(seleccionada) : undefined}>
      <span className="leading-none">{valor}<br />{PALOS[carta.p]}</span>
      <span className="self-end text-2xl leading-none sm:text-4xl">{PALOS[carta.p]}</span>
      {seleccionada && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-oro px-1 text-[10px] text-slate-900">CONSERVAR</span>}
    </Etiqueta>
  );
}
