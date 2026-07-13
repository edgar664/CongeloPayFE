import React, { useState, useEffect } from 'react';
import './formEmp.css'; 
import { ENDPOINTS } from '../api'; 

export default function FormFactura({ onClose, onRefresh }) {
    const [proveedores, setProveedores] = useState([]);
    const [movimientosPendientes, setMovimientosPendientes] = useState([]);
    const [loadingLists, setLoadingLists] = useState(true);
    const [loadingEntradas, setLoadingEntradas] = useState(false);

    const [formData, setFormData] = useState({
        proveedor: '',
        numero: '',
        fecha: '',
        fecha_vencimiento: '',
        precio_por_kilo: '',
        movimientos_ids: [],
        concepto: '',
        observaciones: ''
    });

    // 1. Obtener los proveedores autorizados al abrir el formulario
    useEffect(() => {
        const cargarProveedores = async () => {
            try {
                setLoadingLists(true);
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Token ${token}`;

                const resProv = await fetch(ENDPOINTS.proveedores, { headers });
                const dataProv = await resProv.json();
                const listaProv = Array.isArray(dataProv) ? dataProv : (dataProv.results || []);
                setProveedores(listaProv);
            } catch (error) {
                console.error("Error al cargar proveedores:", error);
            } finally {
                setLoadingLists(false);
            }
        };
        cargarProveedores();
    }, []);

    // 2. Traer las entradas pendientes exclusivamente cuando se elija un proveedor
    useEffect(() => {
        if (!formData.proveedor) {
            setMovimientosPendientes([]);
            return;
        }

        const cargarEntradasPendientes = async () => {
            try {
                setLoadingEntradas(true);
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Token ${token}`;

                // Petición al endpoint dinámico estructurado en Django
                const resMov = await fetch(`${ENDPOINTS.facturas}entradas-pendientes/${formData.proveedor}/`, { headers });
                if (!resMov.ok) throw new Error("No se pudieron obtener las remisiones");
                
                const dataMov = await resMov.json();
                setMovimientosPendientes(Array.isArray(dataMov) ? dataMov : []);
            } catch (error) {
                console.error("Error al obtener entradas sin facturar:", error);
                setMovimientosPendientes([]);
            } finally {
                setLoadingEntradas(false);
            }
        };

        cargarEntradasPendientes();
    }, [formData.proveedor]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'proveedor') {
                updated.movimientos_ids = []; // Resetear selección previa de entradas
            }
            return updated;
        });
    };

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
            movimientos_ids: selectedIds
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = {
            proveedor: Number(formData.proveedor),
            numero: formData.numero.trim(),
            fecha: formData.fecha,
            fecha_vencimiento: formData.fecha_vencimiento,
            precio_por_kilo: parseFloat(formData.precio_por_kilo) || 0.00,
            movimientos_ids: formData.movimientos_ids,
            concepto: formData.concepto.trim(),
            observaciones: formData.observaciones.trim()
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
                alert('¡ÉXITO! Factura procesada. El saldo se ha cargado a la cuenta del proveedor.');
                onRefresh();
                onClose();
            } else {
                alert('Campos no válidos: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('Fallo de comunicación con el servidor.');
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Vincular Entradas a Nueva Factura</h2>
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
                            <option value="">-- Selecciona el Proveedor para ver sus Remisiones --</option>
                            {proveedores.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Número de Factura</label>
                        <input 
                            type="text" 
                            name="numero" 
                            value={formData.numero} 
                            onChange={handleChange} 
                            placeholder="Ej. FAC-9982"
                            required 
                        />
                    </div>

                    <div className="f-group">
                        <label>Precio por Kilo / Unidad ($)</label>
                        <input 
                            type="number" 
                            name="precio_por_kilo" 
                            step="0.01" 
                            value={formData.precio_por_kilo} 
                            onChange={handleChange} 
                            placeholder="Monto base para valuar"
                            required 
                        />
                    </div>

                    <div className="f-group">
                        <label>Fecha de Emisión</label>
                        <input 
                            type="date" 
                            name="fecha" 
                            value={formData.fecha} 
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

                    <div className="f-group" style={{ gridColumn: "span 2" }}>
                        <label>Concepto corto</label>
                        <input 
                            type="text" 
                            name="concepto" 
                            value={formData.concepto} 
                            onChange={handleChange} 
                            placeholder="Ej. Compra de materia prima de la semana"
                        />
                    </div>

                    <div className="f-group" style={{ gridColumn: "span 2" }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Seleccionar Entradas a Facturar</span>
                            <small style={{ color: '#475569', fontWeight: '500' }}>
                                {loadingEntradas ? "Buscando remisiones..." : `Disponibles: ${movimientosPendientes.length}`}
                            </small>
                        </label>
                        <select 
                            multiple 
                            name="movimientos_ids" 
                            value={formData.movimientos_ids.map(String)} 
                            onChange={handleMultiSelectChange}
                            style={{ height: '150px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            disabled={loadingEntradas || !formData.proveedor}
                            required
                        >
                            {movimientosPendientes.length > 0 ? (
                                movimientosPendientes.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {`ID #${m.id} — Fecha: ${m.fecha} — Peso Neto: ${m.kilos_netos || m.kilos || 0} kg — Lote: ${m.lote || 'N/A'}`}
                                    </option>
                                ))
                            ) : (
                                <option disabled value="">
                                    {formData.proveedor 
                                        ? "No quedan entradas pendientes para liquidar de este proveedor" 
                                        : "-- Elige un proveedor del listado superior --"
                                    }
                                </option>
                            )}
                        </select>
                        <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px', fontStyle: 'italic' }}>
                            💡 Ctrl + Click para marcar múltiples entradas a la vez. Seleccionadas: {formData.movimientos_ids.length}
                        </p>
                    </div>

                    <div className="f-actions-footer" style={{ gridColumn: "span 2" }}>
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar" disabled={formData.movimientos_ids.length === 0}>
                            Calcular y Registrar Deuda
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}