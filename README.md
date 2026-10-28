# Frontend · Casino Online (Equipo 08)

Interfaz en React + Vite + Tailwind CSS para el jugador (lobby, 4 juegos, billetera, historial) y el
administrador (dashboard con Chart.js, usuarios, juegos, apuestas, reportes PDF/CSV y bitácora).

> Se ejecuta con Docker desde el repositorio **casino_containers** (ver su README): http://localhost:5173
> El Billar usa el motor de física de `../backend/shared/billar.js` (alias `@shared`), por eso el repositorio
> `backend` debe estar clonado en la misma carpeta.

| Carpeta | Contenido |
|---|---|
| `src/pages/jugador` | Lobby, billetera e historial |
| `src/pages/juegos` | Blackjack, Póker, Ruleta (SVG) y Billar (Canvas) |
| `src/pages/admin` | Dashboard, usuarios, juegos, apuestas, reportes y bitácora |
| `src/components` | Layout responsivo y componentes comunes |
| `src/api/cliente.js` | Cliente HTTP de la API (agrega el token JWT) |

Las peticiones a `/api` se envían al backend mediante el proxy de Vite (`vite.config.js`).
