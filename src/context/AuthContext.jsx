import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, sesion, alExpirarSesion } from '../api/cliente.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(sesion.token()));

  const salir = useCallback(() => {
    sesion.borrar();
    setUsuario(null);
  }, []);

  const refrescar = useCallback(async () => {
    const perfil = await api.get('/auth/perfil');
    setUsuario(perfil);
    return perfil;
  }, []);

  useEffect(() => {
    alExpirarSesion(salir);
    if (!sesion.token()) return;
    refrescar().catch(salir).finally(() => setCargando(false));
  }, [refrescar, salir]);

  const entrar = useCallback(async (correo, password) => {
    const { token, usuario: u } = await api.post('/auth/login', { correo, password });
    sesion.guardar(token);
    setUsuario(u);
    return u;
  }, []);

  const registrar = useCallback(async (datos) => {
    const { token, usuario: u } = await api.post('/auth/registro', datos);
    sesion.guardar(token);
    setUsuario(u);
    return u;
  }, []);

  // Actualiza el saldo mostrado en la barra sin volver a pedir el perfil
  const actualizarSaldo = useCallback((saldo) => {
    if (saldo === null || saldo === undefined) return;
    setUsuario((u) => (u ? { ...u, saldo } : u));
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, registrar, salir, refrescar, actualizarSaldo }),
    [usuario, cargando, entrar, registrar, salir, refrescar, actualizarSaldo],
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
