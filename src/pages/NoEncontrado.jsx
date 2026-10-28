import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-bold text-oro">404</p>
      <p className="mt-2 text-tenue">La página que buscas no existe.</p>
      <Link to="/" className="btn-oro mt-6">Volver al inicio</Link>
    </div>
  );
}
