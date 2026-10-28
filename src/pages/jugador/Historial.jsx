import { Encabezado } from '../../components/ui.jsx';
import TablaApuestas from '../../components/TablaApuestas.jsx';

export default function Historial() {
  return (
    <>
      <Encabezado titulo="Historial de apuestas" descripcion="Todas tus partidas, con su resultado y pago." />
      <TablaApuestas />
    </>
  );
}
