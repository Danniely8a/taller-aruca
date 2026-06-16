import { useState, useEffect } from 'react';
import { equipments, clients } from '../api';
import toast from 'react-hot-toast';

export default function Equipos() {
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ cliente_id: '', tipo_equipo: 'Compresores', marca: '', modelo: '', numero_serie: '' });

  const TIPOS = ['Compresores', 'Pistolas para clavar', 'Engrapadoras', 'Máquinas pequeñas', 'Máquinas grandes'];

  useEffect(() => { load(); loadClientes(); }, []);

  const load = async () => {
    try { const res = await equipments.getAll(); setLista(res.data); }
    catch (err) { toast.error('Error al cargar equipos'); }
  };

  const loadClientes = async () => { try { const res = await clients.getAll(); setClientes(res.data); } catch {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await equipments.update(editing.id, form); toast.success('Equipo actualizado'); }
      else { await equipments.create(form); toast.success('Equipo registrado'); }
      setShowModal(false); setForm({ cliente_id: '', tipo_equipo: 'Compresores', marca: '', modelo: '', numero_serie: '' }); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
  };

  const handleEdit = (e) => { setEditing(e); setForm({ cliente_id: e.cliente_id, tipo_equipo: e.tipo_equipo, marca: e.marca, modelo: e.modelo, numero_serie: e.numero_serie || '' }); setShowModal(true); };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este equipo?')) return;
    try { await equipments.delete(id); toast.success('Equipo eliminado'); load(); }
    catch (err) { toast.error('Error al eliminar'); }
  };

  const getClienteNombre = (id) => { const c = clientes.find((cl) => cl.id === id); return c ? c.nombre : '-'; };

  return (
    <div>
      <div className="top-bar with-actions">
        <h1>Equipos</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ cliente_id: '', tipo_equipo: 'Compresores', marca: '', modelo: '', numero_serie: '' }); setShowModal(true); }}>
          + Nuevo Equipo
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Marca</th><th>Modelo</th><th>N° Serie</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td><td>{getClienteNombre(e.cliente_id)}</td>
                <td><span className="badge badge-primary">{e.tipo_equipo}</span></td><td>{e.marca}</td><td>{e.modelo}</td><td>{e.numero_serie || '-'}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(e)}>Editar</button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label-required">Cliente</label>
                <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} required>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label-required">Tipo de Equipo</label>
                <select value={form.tipo_equipo} onChange={(e) => setForm({ ...form, tipo_equipo: e.target.value })}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label-required">Marca</label>
                  <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label-required">Modelo</label>
                  <input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Número de Serie</label>
                <input value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
