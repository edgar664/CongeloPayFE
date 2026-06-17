import React, { useState, useEffect } from 'react';
import './formEmp.css'; 
import { ENDPOINTS } from '../api'; 

export default function FormFacturaCliente({ onClose, onRefresh }) {
    const [clientes, setClientes] = useState([]);
    const [todosLosMovimientos, setTodosLosMovimientos] = useState([]);
    // Ahora este estado mostrará la lista global de salidas disponibles
    const [movimientosFiltrados, setMovimientosFiltrados] = useState([]);
    const [loadingLists, setLoadingLists] = useState(true);

    const [formData, setFormData] = useState({
        cliente: '',
        numero_factura: '',
        fecha_emision: '',
        fecha_vencimiento: '',
        monto_total: '',
        movimiento: [] 
    });

    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                setLoadingLists(true);
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Token ${token}`;

                // Obtener Clientes
                const resCli = await fetch(ENDPOINTS.clientes, { headers });
                const dataCli = await resCli.json();
                setClientes(Array.isArray(dataCli) ? dataCli : (dataCli.results || []));

                // Obtener Movimientos generales de salida sin facturar
                const resMov = await fetch(ENDPOINTS.movimientos, { headers });
                const dataMov = await resMov.json();
                const listaMov = Array.isArray(dataMov) ? dataMov : (dataMov.results || []);
                
                // Filtramos únicamente por tipo de movimiento "SALIDA" y que no esté en otra factura
                const salidasPendientes = listaMov.filter(m => 
                    String(m.tipo_movimiento || m.tipo || '').trim().toLowerCase() === 'salida' &&
                    !m.enFactura
                );
                
                setTodosLosMovimientos(salidasPendientes);

            } catch (error) {
                console.error("Error al cargar dependencias del formulario:", error);
            } finally {
                setLoadingLists(false);
            }
        };

        cargarCatalogos();
    }, []);

    // ─── MODIFICACIÓN: Mostrar todas las salidas globalmente ───
    useEffect(() => {
        // Asignamos directamente todas las salidas de la base de datos sin condicionar el ID del cliente
        setMovimientosFiltrados(todosLosMovimientos);
    }, [todosLosMovimientos]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMultiSelectChange = (e) => {
        const options = e.target.options;
        const selectedIds = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedIds.push(Number(options[i].value));
            }
        }
        setFormData((prev) => ({ ...prev, movimiento: selectedIds }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = {
            cliente: Number(formData.cliente),
            numero_factura: formData.numero_factura.trim(),
            fecha_emision: formData.fecha_emision,
            fecha_vencimiento: formData.fecha_vencimiento,
            monto_total: parseFloat(formData.monto_total) || 0.00,
            movimiento: formData.movimiento 
        };

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Token ${token}`;

            const response = await fetch(ENDPOINTS.facturasClientes || ENDPOINTS.factura_cliente, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡ÉXITO! Factura de cliente registrada correctamente.');
                onRefresh();
                onClose();
            } else {
                alert('Error al validar campos: ' + JSON.stringify(data));
            }
        } catch (error) {
            alert('No se pudo conectar con el servidor.');
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Registrar Nueva Factura de Cliente</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="form-emp-grid">
                    
                    <div className="f-group" style={{ gridColumn: "span 2" }}>
                        <label>Cliente Receptor de la Factura *</label>
                        <select name="cliente" value={formData.cliente} onChange={handleChange} required disabled={loadingLists}>
                            <option value="">-- Selecciona el cliente que paga --</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Número de Factura</label>
                        <input type="text" name="numero_factura" value={formData.numero_factura} onChange={handleChange} placeholder="Ej. FAC-CLI-998" required />
                    </div>

                    <div className="f-group">
                        <label>Monto Total ($)</label>
                        <input type="number" name="monto_total" step="0.01" value={formData.monto_total} onChange={handleChange} placeholder="0.00" required />
                    </div>

                    <div className="f-group">
                        <label>Fecha de Emisión</label>
                        <input type="date" name="fecha_emision" value={formData.fecha_emision} onChange={handleChange} required />
                    </div>

                    <div className="f-group">
                        <label>Fecha de Vencimiento</label>
                        <input type="date" name="fecha_vencimiento" value={formData.fecha_vencimiento} onChange={handleChange} required />
                    </div>

                    <div className="f-group" style={{ gridColumn: "span 2" }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Vincular Salidas Globales Pendientes</span>
                            <small style={{ color: '#64748b', fontWeight: '400', marginLeft: 'auto' }}>
                                *Mantén Ctrl/Cmd presionado para seleccionar varias
                            </small>
                        </label>
                        <select 
                            multiple 
                            name="movimiento" 
                            value={formData.movimiento.map(String)} 
                            onChange={handleMultiSelectChange}
                            style={{ height: '160px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            disabled={loadingLists}
                        >
                            {movimientosFiltrados.length > 0 ? (
                                movimientosFiltrados.map(m => {
                                    // Buscamos el nombre del cliente dueño de este movimiento para dar claridad en la lista global
                                    const duenoMovimiento = clientes.find(c => c.id === m.cliente)?.nombre || `Cliente #${m.cliente}`;
                                    return (
                                        <option key={m.id} value={m.id}>
                                            #{m.id} - [{duenoMovimiento}] - {m.producto?.nombre || m.nombre_producto || `Prod #${m.producto}`} ({m.kilos}kg)
                                        </option>
                                    );
                                })
                            ) : (
                                <option disabled value="">
                                    No hay salidas pendientes en el sistema.
                                </option>
                            )}
                        </select>
                    </div>

                    <div className="f-actions-footer" style={{ gridColumn: "span 2" }}>
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar" disabled={loadingLists || formData.movimiento.length === 0}>Crear Factura</button>
                    </div>

                </form>
            </div>
        </div>
    );
}