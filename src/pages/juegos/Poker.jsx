import { useState } from 'react';
import { Alerta, ErrorApiVista, SelectorApuesta } from '../../components/ui.jsx';
import { Carta, Resultado, usePartida } from './comunes.jsx';
import { creditos } from '../../utils/formato.js';

export default function Poker({ juego, hayEnCurso }) {
  const { partida, error, setError, aviso, ocupado, apostar, jugar, reanudar, nueva } = usePartida(juego);
  const [monto, setMonto] = useState(juego.apuestaMin);
  const [conservar, setConservar] = useState([]);
  const v = partida?.vista;
  const jugando = partida?.estado === 'en_curso';

  const alternar = (i) => setConservar((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  const repartir = async () => { setConservar([]); await apostar(monto); };
  const cambiar = () => jugar('cambiar', { conservar });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <ErrorApiVista error={error} onCerrar={() => setError(null)} />
        <Alerta tipo="info">{aviso}</Alerta>
        {!partida && hayEnCurso && <Alerta tipo="info">Tienes una mano sin terminar. <button type="button" className="underline" onClick={reanudar}>Continuarla</button></Alerta>}
        <div className="rounded-2xl border-4 border-indigo-900 bg-gradient-to-b from-indigo-800 to-indigo-950 p-4 pb-10 sm:p-6 sm:pb-12">
          <p className="mb-3 text-center text-sm text-white/70">
            {jugando ? 'Toca las cartas que quieres conservar y luego cambia las demás' : 'Jacks or Better · forma un par de J o mejor'}
          </p>
          <div className="flex justify-center gap-1.5 sm:gap-3">
            {v ? v.mano.map((c, i) => (
              <Carta key={`${i}-${c.v}${c.p}`} carta={c} seleccionada={jugando && conservar.includes(i)} onClick={jugando ? () => alternar(i) : undefined} />
            )) : [0, 1, 2, 3, 4].map((i) => <Carta key={i} carta={null} />)}
          </div>
          {v?.resultado && <p className="mt-6 text-center text-xl font-bold text-oro">{v.resultado.nombre}</p>}
        </div>
        <Resultado partida={partida} />
        <div className="tarjeta flex flex-wrap items-end justify-between gap-4">
          {jugando ? (
            <button type="button" className="btn-oro" disabled={ocupado} onClick={cambiar}>
              {conservar.length === 5 ? 'Quedarme con todas' : `Cambiar ${5 - conservar.length} carta${5 - conservar.length === 1 ? '' : 's'}`}
            </button>
          ) : (
            <>
              <SelectorApuesta juego={juego} monto={monto} setMonto={setMonto} disabled={ocupado} />
              <div className="flex gap-2">
                {partida && <button type="button" className="btn-sec" onClick={nueva}>Limpiar</button>}
                <button type="button" className="btn-oro" disabled={ocupado || !monto} onClick={repartir}>Repartir</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="tarjeta h-fit">
        <h2 className="mb-2 font-semibold">Tabla de pagos</h2>
        <table className="tabla">
          <thead><tr><th>Mano</th><th className="text-right">Paga</th><th className="text-right">Con {creditos(monto || 0)}</th></tr></thead>
          <tbody>
            {[['Escalera real', 250], ['Escalera de color', 50], ['Póker', 25], ['Full', 9], ['Color', 6], ['Escalera', 4], ['Tercia', 3], ['Dos pares', 2], ['Par de J o mejor', 1]].map(([n, m]) => (
              <tr key={n} className={v?.resultado?.nombre === n ? 'bg-oro/15 text-oro' : ''}>
                <td>{n}</td><td className="text-right">x{m}</td><td className="text-right">{creditos((monto || 0) * m)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
