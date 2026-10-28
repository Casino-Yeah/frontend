import { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../../api/cliente.js';
import { Campo, Cargando, Encabezado, ErrorApiVista } from '../../components/ui.jsx';
import { creditos, haceDiasISO, hoyISO } from '../../utils/formato.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);
ChartJS.defaults.color = '#93a0b8';
ChartJS.defaults.borderColor = 'rgba(147,160,184,0.15)';

const RANGOS = [{ texto: '7 días', dias: 6 }, { texto: '30 días', dias: 29 }, { texto: '90 días', dias: 89 }];

function Indicador({ titulo, valor, detalle, color = 'text-texto' }) {
  return (
    <div className="tarjeta">
      <p className="text-xs font-medium uppercase tracking-wide text-tenue">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-tenue">{detalle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [rango, setRango] = useState({ desde: haceDiasISO(29), hasta: hoyISO() });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    api.get('/admin/dashboard', rango).then(setDatos).catch(setError);
  }, [rango]);

  const ind = datos?.indicadores;
  const etiquetaDia = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  const opciones = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } } };

  return (
    <>
      <Encabezado titulo="Dashboard" descripcion="Actividad del casino en el periodo seleccionado.">
        {RANGOS.map((r) => (
          <button key={r.dias} type="button" className="btn-sec" onClick={() => setRango({ desde: haceDiasISO(r.dias), hasta: hoyISO() })}>{r.texto}</button>
        ))}
      </Encabezado>
      <div className="tarjeta mb-4 flex flex-wrap items-end gap-3">
        <Campo etiqueta="Desde"><input type="date" className="campo" value={rango.desde} max={rango.hasta} onChange={(e) => setRango({ ...rango, desde: e.target.value })} /></Campo>
        <Campo etiqueta="Hasta"><input type="date" className="campo" value={rango.hasta} min={rango.desde} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} /></Campo>
        <p className="pb-2 text-xs text-tenue">Las gráficas y los indicadores cambian con este filtro.</p>
      </div>
      <ErrorApiVista error={error} />
      {!datos && !error && <Cargando />}
      {datos && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador titulo="Total apostado" valor={creditos(ind.totalApostado)} detalle={`${creditos(ind.apuestas)} apuestas`} />
            <Indicador titulo="Total pagado" valor={creditos(ind.totalPagado)} />
            <Indicador titulo="Ganancia de la casa" valor={creditos(ind.gananciaCasa)} color={ind.gananciaCasa >= 0 ? 'text-emerald-300' : 'text-red-300'} />
            <Indicador titulo="Recargas" valor={creditos(ind.recargas)} detalle={`${ind.cantidadRecargas} operaciones`} />
            <Indicador titulo="Jugadores activos" valor={ind.jugadoresActivos} detalle={`de ${ind.jugadoresTotales} registrados`} />
            <Indicador titulo="Jugadores nuevos" valor={ind.jugadoresNuevos} detalle="en el periodo" />
            <Indicador titulo="Jugaron en el periodo" valor={ind.jugadoresConApuestas} />
            <Indicador titulo="Créditos en circulación" valor={creditos(ind.creditosEnCirculacion)} detalle="suma de saldos actuales" color="text-oro" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <div className="tarjeta lg:col-span-3">
              <h2 className="mb-3 font-semibold">Apostado vs. pagado por día</h2>
              <div className="h-72">
                <Line options={opciones} data={{
                  labels: datos.serieDiaria.map((d) => etiquetaDia(d.dia)),
                  datasets: [
                    { label: 'Apostado', data: datos.serieDiaria.map((d) => d.apostado), borderColor: '#f5b83d', backgroundColor: 'rgba(245,184,61,0.15)', fill: true, tension: 0.3 },
                    { label: 'Pagado', data: datos.serieDiaria.map((d) => d.pagado), borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)', fill: true, tension: 0.3 },
                  ],
                }} />
              </div>
            </div>
            <div className="tarjeta lg:col-span-2">
              <h2 className="mb-3 font-semibold">Actividad por juego</h2>
              <div className="h-72">
                <Bar options={{ ...opciones, scales: { y: { beginAtZero: true, position: 'left' }, y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } } } }} data={{
                  labels: datos.porJuego.map((j) => j.nombre),
                  datasets: [
                    { label: 'Apuestas', data: datos.porJuego.map((j) => j.apuestas), backgroundColor: '#8b5cf6', yAxisID: 'y' },
                    { label: 'Ganancia casa', data: datos.porJuego.map((j) => j.ganancia), backgroundColor: '#10b981', yAxisID: 'y1' },
                  ],
                }} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
