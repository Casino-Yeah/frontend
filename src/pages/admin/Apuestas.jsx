import { Encabezado } from '../../components/ui.jsx';
import TablaApuestas from '../../components/TablaApuestas.jsx';

export default function Apuestas() {
  return (
    <>
      <Encabezado titulo="Apuestas" descripcion="Todas las apuestas de los jugadores." />
      <TablaApuestas admin />
    </>
  );
}
