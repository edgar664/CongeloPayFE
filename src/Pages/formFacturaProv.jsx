import React, { useState, useEffect } from 'react';
import './formEmp.css'; // Reutiliza los estilos estructurales del modal grid
import { ENDPOINTS } from '../api'; 

export default function FormFactura({ onClose, onRefresh }) {
    const [proveedores, setProveedores] = useState([]);
    // Guardaremos TODOS los movimientos de entrada en este estado
    const [todosLosMovimientos, setTodosLosMovimientos] = useState([]);
    // Este estado contendrá los movimientos ya filtrados por el proveedor activo
    const [movimientosFiltrados, setMovimientosFiltrados] = useState([]);
    const [loadingLists, setLoadingLists] = useState(true);

    const [formData, setFormData] = useState({
        proveedor: '',
        numero_factura: '',
        fecha_emision: '',
        fecha_vencimiento: '',
        monto_total: '',
        movimiento: [] // Array para almacenar los IDs seleccionados
    });

    // 1. Cargar catálogos iniciales al montar el modal
    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                setLoadingLists(true);
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Token ${token}`;

                // Obtener Proveedores
                const resProv = await fetch(ENDPOINTS.proveedores, { headers });
                const dataProv = await resProv.json();
                const listaProv = Array.isArray(dataProv) ? dataProv : (dataProv.results || []);
                setProveedores(listaProv);

                // Obtener Movimientos generales
                const resMov = await fetch(ENDPOINTS.movimientos, { headers });
                const dataMov = await resMov.json();
                const listaMov = Array.isArray(dataMov) ? dataMov : (dataMov.results || []);
                
                // Guardar en memoria únicamente las entradas que NO estén facturadas aún (enFactura === false)
                const entradasPendientes = listaMov.filter(m => 
                    String(m.tipo_movimiento || m.tipo || '').trim().toLowerCase() === 'entrada' &&
                    !m.enFactura // Filtro crucial para no duplicar facturas
                );
                
                setTodosLosMovimientos(entradasPendientes);

            } catch (error) {
                console.error("Error al cargar dependencias del formulario:", error);
            } finally {
                setLoadingLists(false);
            }
        };

        cargarCatalogos();
    }, []);

    // 2. EFECTO: Cada vez que el id del proveedor cambie, filtramos los movimientos correspondientes
    useEffect(() => {
        if (!formData.proveedor) {
            setMovimientosFiltrados([]);
            return;
        }

        // Filtramos para dejar solo los movimientos que coincidan con el ID del proveedor seleccionado
        const filtrados = todosLosMovimientos.filter(m => 
            Number(m.proveedor) === Number(formData.proveedor)
        );

        setMovimientosFiltrados(filtrados);
    }, [formData.proveedor, todosLosMovimientos]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            
            // Si el usuario cambia el proveedor, vaciamos la selección de movimientos anterior
            if (name === 'proveedor') {
                updated.movimiento = [];
            }
            return updated;
        });
    };

    // Manejador especial para el select múltiple
    const handleMultiSelectChange = (e) => {
        const options = e.target.options;
        const selectedIds = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedIds.push(Number(options[i].value));
            }
        }
        setFormData((prev) => ({
            ...prev,
            movimiento: selectedIds
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = {
            proveedor: Number(formData.proveedor),
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

            const response = await fetch(ENDPOINTS.facturas, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡ÉXITO! Factura de proveedor guardada correctamente.');
                onRefresh();
                onClose();
            } else {
                console.error('Django Rest Framework retornó:', data);
                alert('Error al validar campos: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor.');
        }
    };

    const renderMovimientoLabel = (m) => {
        const prodNombre = m.producto?.nombre || m.nombre_producto || `Prod #${m.producto}`;
        const kilos = m.kilos ? `${m.kilos}kg` : '0kg';
        const lote = m.lote ? `Lote: ${m.lote}` : 'Sin Lote';
        return `#${m.id} - ${prodNombre} (${kilos}) - ${lote}`;
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Registrar Nueva Factura de Proveedor</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="form-emp-grid">
                    
                    <div className="f-group" style={{ gridColumn: "span 2" }}>
                        <label>Proveedor</label>
                        <select 
                            name="proveedor" 
                            value={formData.proveedor} 
                            onChange={handleChange} 
                            required
                            disabled={loadingLists}
                        >
                            <option value="">-- Selecciona un Proveedor --</option>
                            {proveedores.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Número de Factura</label>
                        <input 
                            type="text" 
                            name="numero_factura" 
                            value={formData.numero_factura} 
                            onChange={handleChange} 
                            placeholder="Ej. FAC-12345"
                            required 
                        />
                    </div>

                    <div className="f-group">
                        <label>Monto Total ($)</label>
                        <input 
                            type="number" 
                            name="monto_total" 
                            step="0.01" 
                            value={formData.monto_total} 
                            onChange={handleChange} 
                            placeholder="0.00"
                            required 
                        />
                    </div>

                    <div className="f-group">
                        <label>Fecha de Emisión</label>
                        <input 
                            type="date" 
                            name="fecha_emision" 
                            value={formData.fecha_emision} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="f-group">
                        <label>Fecha de Vencimiento</label>
                        <input 
                            type="date" 
                            name="fecha_vencimiento" 
                            value={formData.fecha_vencimiento} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    {/* Caja de selección múltiple dinámica */}
                    <div className="f-group" style={{ gridColumn: "span 2" }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Vincular Entradas del Proveedor</span>
                            <small style={{ color: '#64748b', fontWeight: '400', marginLeft: 'auto' }}>
                                *Mantén presionado Ctrl (o Cmd) para seleccionar varias
                            </small>
                        </label>
                        <select 
                            multiple 
                            name="movimiento" 
                            value={formData.movimiento.map(String)} 
                            onChange={handleMultiSelectChange}
                            style={{ height: '140px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            disabled={loadingLists || !formData.proveedor}
                        >
                            {movimientosFiltrados.length > 0 ? (
                                movimientosFiltrados.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {renderMovimientoLabel(m)}
                                    </option>
                                ))
                            ) : (
                                <option disabled value="">
                                    {formData.proveedor 
                                        ? "No hay entradas pendientes para este proveedor" 
                                        : "-- Selecciona un proveedor primero --"
                                    }
                                </option>
                            )}
                        </select>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                            Seleccionados: {formData.movimiento.length} entradas de almacén.
                        </p>
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