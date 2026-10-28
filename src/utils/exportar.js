import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// columnas: [{ clave, titulo, formato? }]
export function exportarCSV(nombreArchivo, columnas, filas) {
  const escapar = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [
    columnas.map((c) => escapar(c.titulo)).join(','),
    ...filas.map((f) => columnas.map((c) => escapar(f[c.clave])).join(',')),
  ];
  // BOM para que Excel respete los acentos
  descargar(new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' }), `${nombreArchivo}.csv`);
}

export function exportarPDF(nombreArchivo, titulo, subtitulo, columnas, filas, totales) {
  const doc = new jsPDF({ orientation: columnas.length > 6 ? 'landscape' : 'portrait' });
  doc.setFontSize(16);
  doc.text(titulo, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitulo, 14, 23);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 29);
  autoTable(doc, {
    startY: 34,
    head: [columnas.map((c) => c.titulo)],
    body: filas.map((f) => columnas.map((c) => (c.formato ? c.formato(f[c.clave]) : f[c.clave] ?? ''))),
    foot: totales ? [columnas.map((c) => (c.formato && totales[c.clave] !== undefined ? c.formato(totales[c.clave]) : totales[c.clave] ?? ''))] : undefined,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [18, 27, 46] },
    footStyles: { fillColor: [245, 184, 61], textColor: 20 },
  });
  doc.save(`${nombreArchivo}.pdf`);
}

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
