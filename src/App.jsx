import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Cargando } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Perfil from './pages/Perfil.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';
import Lobby from './pages/jugador/Lobby.jsx';
import Billetera from './pages/jugador/Billetera.jsx';
import Historial from './pages/jugador/Historial.jsx';
import Jugar from './pages/juegos/Jugar.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Usuarios from './pages/admin/Usuarios.jsx';
import Juegos from './pages/admin/Juegos.jsx';
import Apuestas from './pages/admin/Apuestas.jsx';
import Reportes from './pages/admin/Reportes.jsx';
import Bitacora from './pages/admin/Bitacora.jsx';

function Protegida({ rol, children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && usuario.rol !== rol) return <Navigate to={usuario.rol === 'admin' ? '/admin' : '/'} replace />;
  return children;
}

function SoloInvitado({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (usuario) return <Navigate to={usuario.rol === 'admin' ? '/admin' : '/'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SoloInvitado><Login /></SoloInvitado>} />
      <Route path="/registro" element={<SoloInvitado><Registro /></SoloInvitado>} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/" element={<Protegida rol="jugador"><Lobby /></Protegida>} />
        <Route path="/billetera" element={<Protegida rol="jugador"><Billetera /></Protegida>} />
        <Route path="/historial" element={<Protegida rol="jugador"><Historial /></Protegida>} />
        <Route path="/jugar/:id" element={<Protegida rol="jugador"><Jugar /></Protegida>} />
        <Route path="/admin" element={<Protegida rol="admin"><Dashboard /></Protegida>} />
        <Route path="/admin/usuarios" element={<Protegida rol="admin"><Usuarios /></Protegida>} />
        <Route path="/admin/juegos" element={<Protegida rol="admin"><Juegos /></Protegida>} />
        <Route path="/admin/apuestas" element={<Protegida rol="admin"><Apuestas /></Protegida>} />
        <Route path="/admin/reportes" element={<Protegida rol="admin"><Reportes /></Protegida>} />
        <Route path="/admin/bitacora" element={<Protegida rol="admin"><Bitacora /></Protegida>} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
