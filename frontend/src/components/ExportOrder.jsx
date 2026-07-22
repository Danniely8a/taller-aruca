import toast from 'react-hot-toast';

export default function ExportOrderButton({ orden, historial = [] }) {
  const handleExport = async () => {
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; padding: 30px; color: #1F2937; max-width: 700px; margin: 0 auto; }
  h1 { color: #003A8C; font-size: 1.4rem; border-bottom: 3px solid #003A8C; padding-bottom: 8px; }
  .row { display: flex; gap: 20px; margin-bottom: 12px; }
  .col { flex: 1; }
  .label { font-size: 0.75rem; color: #6B7280; text-transform: uppercase; font-weight: 600; }
  .value { font-size: 0.95rem; font-weight: 600; margin-top: 2px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
  .badge-info { background: #DBEAFE; color: #1E40AF; }
  .badge-warning { background: #FEF3C7; color: #92400E; }
  .badge-success { background: #D1FAE5; color: #065F46; }
  .badge-danger { background: #FEE2E2; color: #991B1B; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { padding: 8px 12px; border-bottom: 1px solid #E5E7EB; text-align: left; font-size: 0.85rem; }
  th { background: #F3F4F6; font-weight: 700; }
  .footer { margin-top: 24px; text-align: center; font-size: 0.75rem; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 12px; }
</style>
</head>
<body>
  <h1>🔧 Orden de Trabajo ${orden.numero_ot}</h1>
  <div class="row">
    <div class="col"><div class="label">Código</div><div class="value">${orden.codigo_corto}</div></div>
    <div class="col"><div class="label">Estado</div><div class="value">${orden.estado}</div></div>
    <div class="col"><div class="label">Prioridad</div><div class="value">${orden.prioridad}</div></div>
    <div class="col"><div class="label">Fecha</div><div class="value">${new Date(orden.fecha_ingreso).toLocaleDateString()}</div></div>
  </div>
  <div class="row">
    <div class="col"><div class="label">Cliente</div><div class="value">${orden.cliente?.nombre || '-'}</div></div>
    <div class="col"><div class="label">Teléfono</div><div class="value">${orden.cliente?.telefono || '-'}</div></div>
    <div class="col"><div class="label">Empresa</div><div class="value">${orden.cliente?.empresa || '-'}</div></div>
  </div>
  ${orden.tipo_servicio === 'Afilado' ? `
  <div style="margin-top:12px"><div class="label">Servicio: Afilado</div>
  <table><thead><tr><th>Ítem</th><th style="text-align:center">Cant.</th></tr></thead><tbody>
  ${(orden.item_seleccionado || []).map(it => `<tr><td>${it.item || it}</td><td style="text-align:center;font-weight:700">${it.cantidad || 1}</td></tr>`).join('')}
  </tbody></table></div>
  ` : `
  <div class="row">
    <div class="col"><div class="label">Tipo Equipo</div><div class="value">${orden.equipo?.tipo_equipo || '-'}</div></div>
    <div class="col"><div class="label">Marca</div><div class="value">${orden.equipo?.marca || '-'}</div></div>
    <div class="col"><div class="label">Modelo</div><div class="value">${orden.equipo?.modelo || '-'}</div></div>
  </div>
  `}
  ${orden.falla_reportada ? `<div style="margin-top:12px"><div class="label">Requerimiento</div><div class="value">${orden.falla_reportada}</div></div>` : ''}
  ${orden.notas_tecnicas ? `<div style="margin-top:12px"><div class="label">Notas Técnicas</div><div class="value" style="white-space:pre-wrap">${orden.notas_tecnicas}</div></div>` : ''}
  ${historial.length > 0 ? `
  <div style="margin-top:16px"><div class="label">Historial</div>
  <table><thead><tr><th>Estado</th><th>Fecha</th><th>Usuario</th></tr></thead><tbody>
  ${historial.map(h => `<tr><td>${h.nuevo_estado}</td><td>${new Date(h.fecha_cambio).toLocaleString()}</td><td>${h.usuario_nombre}</td></tr>`).join('')}
  </tbody></table></div>
  ` : ''}
  <div class="footer">Taller Aruca Maquinarias — Generado ${new Date().toLocaleString()}</div>
</body></html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OT-${orden.numero_ot || orden.id}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Orden exportada correctamente');
    } catch {
      toast.error('Error al exportar');
    }
  };

  return (
    <button className="btn btn-outline btn-sm" onClick={handleExport} title="Exportar orden">
      📄 Exportar
    </button>
  );
}
