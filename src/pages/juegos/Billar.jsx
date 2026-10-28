import { useCallback, useEffect, useRef, useState } from 'react';
import { MESA, BUCHACAS, estadoInicial, simularTiro, MULTIPLICADORES } from '@shared/billar.js';
import { Alerta, ErrorApiVista, SelectorApuesta } from '../../components/ui.jsx';
import { Resultado, usePartida } from './comunes.jsx';

const COLORES = ['#f8fafc', '#facc15', '#2563eb', '#dc2626', '#7c3aed', '#f97316', '#16a34a'];
const MARCO = 26;

function dibujar(ctx, bolas, mira) {
  const { ancho, alto, radio, radioBuchaca } = MESA;
  ctx.clearRect(0, 0, ancho + MARCO * 2, alto + MARCO * 2);
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(0, 0, ancho + MARCO * 2, alto + MARCO * 2);
  ctx.save();
  ctx.translate(MARCO, MARCO);
  const pano = ctx.createRadialGradient(ancho / 2, alto / 2, 50, ancho / 2, alto / 2, ancho / 1.3);
  pano.addColorStop(0, '#17784d');
  pano.addColorStop(1, '#0a4029');
  ctx.fillStyle = pano;
  ctx.fillRect(0, 0, ancho, alto);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(200, alto); ctx.stroke();
  for (const p of BUCHACAS) {
    ctx.fillStyle = '#05140d';
    ctx.beginPath(); ctx.arc(p.x, p.y, radioBuchaca - 4, 0, Math.PI * 2); ctx.fill();
  }
  if (mira) {
    const blanca = bolas.find((b) => b.id === 0);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(blanca.x, blanca.y);
    ctx.lineTo(blanca.x + Math.cos(mira.angulo) * 900, blanca.y + Math.sin(mira.angulo) * 900);
    ctx.stroke();
    ctx.setLineDash([]);
    // taco
    const atras = 20 + mira.potencia * 60;
    ctx.strokeStyle = '#d6b37a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(blanca.x - Math.cos(mira.angulo) * atras, blanca.y - Math.sin(mira.angulo) * atras);
    ctx.lineTo(blanca.x - Math.cos(mira.angulo) * (atras + 220), blanca.y - Math.sin(mira.angulo) * (atras + 220));
    ctx.stroke();
  }
  for (const b of bolas) {
    if (!b.enMesa) continue;
    ctx.fillStyle = COLORES[b.id];
    ctx.beginPath(); ctx.arc(b.x, b.y, radio, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    if (b.id > 0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(b.x, b.y, radio * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(b.id), b.x, b.y + 0.5);
    }
  }
  ctx.restore();
}

export default function Billar({ juego, hayEnCurso }) {
  const { partida, error, setError, aviso, ocupado, apostar, jugar, reanudar, nueva, actualizarSaldo } = usePartida(juego);
  const [monto, setMonto] = useState(juego.apuestaMin);
  const [angulo, setAngulo] = useState(0);
  const [potencia, setPotencia] = useState(0.6);
  const [animando, setAnimando] = useState(false);
  const [bolas, setBolas] = useState(() => estadoInicial().bolas);
  const [ultimo, setUltimo] = useState(null);
  const lienzo = useRef(null);
  const anim = useRef(0);

  const v = partida?.vista;
  const jugando = partida?.estado === 'en_curso';
  const puedeTirar = jugando && !animando && !ocupado;

  // Al recibir el estado del servidor (si no se está animando) se usan sus posiciones
  useEffect(() => { if (v && !animando) setBolas(v.bolas); }, [v, animando]);
  useEffect(() => {
    const ctx = lienzo.current?.getContext('2d');
    if (ctx) dibujar(ctx, bolas, puedeTirar ? { angulo, potencia } : null);
  }, [bolas, angulo, potencia, puedeTirar]);
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const apuntar = useCallback((e) => {
    if (!puedeTirar) return;
    const rect = lienzo.current.getBoundingClientRect();
    const escala = (MESA.ancho + MARCO * 2) / rect.width;
    const x = (e.clientX - rect.left) * escala - MARCO;
    const y = (e.clientY - rect.top) * escala - MARCO;
    const blanca = bolas.find((b) => b.id === 0);
    setAngulo(Math.atan2(y - blanca.y, x - blanca.x));
  }, [puedeTirar, bolas]);

  async function tirar() {
    const tiro = { angulo, potencia };
    const estadoLocal = { bolas, tiros: v.tiros, embocadas: v.embocadas };
    // Animación local con el mismo motor; el resultado oficial lo calcula el servidor
    const { cuadros } = simularTiro(estadoLocal, tiro, { cuadros: true });
    setAnimando(true);
    const respuesta = jugar('tiro', tiro, { saldoDespues: true });
    // la animación dura como máximo ~2.5 s (150 cuadros de pantalla)
    const salto = Math.max(2, Math.ceil(cuadros.length / 150));
    let i = 0;
    await new Promise((fin) => {
      const paso = () => {
        i = Math.min(i + salto, cuadros.length - 1);
        setBolas(cuadros[i]);
        if (i < cuadros.length - 1) anim.current = requestAnimationFrame(paso);
        else fin();
      };
      anim.current = requestAnimationFrame(paso);
    });
    const p = await respuesta;
    if (p) {
      setUltimo(p.vista.ultimoTiro);
      actualizarSaldo(p.saldo);
    }
    setAnimando(false);
  }

  async function iniciar() {
    setUltimo(null);
    setBolas(estadoInicial().bolas);
    await apostar(monto);
  }

  return (
    <div className="space-y-4">
      <ErrorApiVista error={error} onCerrar={() => setError(null)} />
      <Alerta tipo="info">{aviso}</Alerta>
      {!partida && hayEnCurso && <Alerta tipo="info">Tienes una partida sin terminar. <button type="button" className="underline" onClick={reanudar}>Continuarla</button></Alerta>}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-tenue">{jugando ? 'Mueve el cursor (o toca) sobre la mesa para apuntar.' : 'Mete el mayor número de bolas en 5 tiros.'}</span>
        {v && (
          <span className="flex gap-3">
            <span>Tiros restantes: <strong className="text-oro">{animando ? '…' : v.tirosRestantes}</strong></span>
            <span>Embocadas: <strong className="text-oro">{v.embocadas}</strong>/{v.bolasObjetivo}</span>
          </span>
        )}
      </div>

      <canvas ref={lienzo} width={MESA.ancho + MARCO * 2} height={MESA.alto + MARCO * 2}
        className={`w-full touch-none rounded-xl shadow-2xl ${puedeTirar ? 'cursor-crosshair' : ''}`}
        onPointerMove={apuntar} onPointerDown={apuntar} aria-label="Mesa de billar" />

      {ultimo && !animando && (
        <p className="text-center text-sm text-tenue">
          {ultimo.falta ? 'Falta: la bola blanca cayó y se recolocó. ' : ''}
          {ultimo.embocadasTiro.filter((b) => b !== 0).length > 0 ? `¡Embocaste ${ultimo.embocadasTiro.filter((b) => b !== 0).length} bola(s)!` : 'No entró ninguna bola en este tiro.'}
        </p>
      )}

      {!animando && <Resultado partida={partida} texto={v ? `Embocaste ${v.embocadas} de ${v.bolasObjetivo} bolas` : ''} />}

      <div className="tarjeta flex flex-wrap items-end justify-between gap-4">
        {jugando ? (
          <>
            <label className="min-w-56 flex-1">
              <span className="etiqueta">Potencia: {Math.round(potencia * 100)} %</span>
              <input type="range" min="0.05" max="1" step="0.01" value={potencia} onChange={(e) => setPotencia(Number(e.target.value))} className="w-full accent-[#f5b83d]" disabled={!puedeTirar} />
            </label>
            <label className="w-40">
              <span className="etiqueta">Ángulo: {Math.round((angulo * 180) / Math.PI)}°</span>
              <input type="range" min={-Math.PI} max={Math.PI} step="0.005" value={angulo} onChange={(e) => setAngulo(Number(e.target.value))} className="w-full accent-[#f5b83d]" disabled={!puedeTirar} />
            </label>
            <button type="button" className="btn-oro px-8 py-3" disabled={!puedeTirar} onClick={tirar}>Tirar</button>
          </>
        ) : (
          <>
            <SelectorApuesta juego={juego} monto={monto} setMonto={setMonto} disabled={ocupado || animando} />
            <div className="flex gap-2">
              {partida && !animando && <button type="button" className="btn-sec" onClick={() => { nueva(); setBolas(estadoInicial().bolas); setUltimo(null); }}>Nueva mesa</button>}
              <button type="button" className="btn-oro" disabled={ocupado || animando || !monto} onClick={iniciar}>Apostar y jugar</button>
            </div>
          </>
        )}
      </div>
      <p className="text-center text-xs text-tenue">
        Premio según bolas embocadas: {MULTIPLICADORES.map((m, i) => `${i}→x${m}`).join(' · ')}
      </p>
    </div>
  );
}
