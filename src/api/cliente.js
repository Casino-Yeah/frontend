// Cliente HTTP de la API. Agrega el token y convierte los errores en ErrorApi.
const CLAVE_TOKEN = 'casino_token';

export const sesion = {
  token: () => { try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; } },
  guardar: (t) => { try { localStorage.setItem(CLAVE_TOKEN, t); } catch { /* sin almacenamiento */ } },
  borrar: () => { try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* sin almacenamiento */ } },
};

export class ErrorApi extends Error {
  constructor(estado, cuerpo) {
    super(cuerpo?.mensaje ?? 'No se pudo completar la operación');
    this.estado = estado;
    this.errores = cuerpo?.errores ?? [];
    this.cuerpo = cuerpo;
  }
}

let alExpirar = () => {};
export const alExpirarSesion = (fn) => { alExpirar = fn; };

const aQuery = (params = {}) => {
  const limpio = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return limpio.length ? `?${new URLSearchParams(limpio)}` : '';
};

async function solicitar(metodo, ruta, { cuerpo, params } = {}) {
  const token = sesion.token();
  let res;
  try {
    res = await fetch(`/api${ruta}${aQuery(params)}`, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, { mensaje: 'No hay conexión con el servidor' });
  }
  const datos = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) alExpirar();
    throw new ErrorApi(res.status, datos);
  }
  return datos;
}

export const api = {
  get: (ruta, params) => solicitar('GET', ruta, { params }),
  post: (ruta, cuerpo) => solicitar('POST', ruta, { cuerpo: cuerpo ?? {} }),
  put: (ruta, cuerpo) => solicitar('PUT', ruta, { cuerpo }),
  delete: (ruta) => solicitar('DELETE', ruta),
};
