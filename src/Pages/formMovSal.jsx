import React, { useState, useEffect } from 'react';
import './formEmp.css'; // Estilos del modal
import { ENDPOINTS } from '../api';

export default function FormMov({ onClose, onRefresh }) {
    // 1. LISTAS DE ESTADO (Aseguramos que 'conceptos' esté definido)
    const [productos, setProductos] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [envases, setEnvases] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [conceptos, setConceptos] = useState([]); // <-- Aquí estaba el faltante

    const [formData, setFormData] = useState({
        producto: '',
        cliente: '',
        tipo_movimiento: 'SALIDA', // Forzado para egresos de fruta
        unidades: 0,
        kilos: '',
        lote: '',
        almacen: '',
        embace: '',
        concepto: '' 
    });

    // 2. EFECTO PARA CARGAR LOS CATÁLOGOS DESDE EL BACKEND
    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                // Productos
                const resProd = await fetch(ENDPOINTS.productos);
                const dataProd = await resProd.json();
                setProductos(Array.isArray(dataProd) ? dataProd : (dataProd.results || []));

                // Almacenes 
                if (ENDPOINTS.almacenes) {
                    const resAlm = await fetch(ENDPOINTS.almacenes);
                    const dataAlm = await resAlm.json();
                    setAlmacenes(Array.isArray(dataAlm) ? dataAlm : (dataAlm.results || []));
                }

                // Envases
                if (ENDPOINTS.embaces) {
                    const resEnv = await fetch(ENDPOINTS.embaces);
                    const dataEnv = await resEnv.json();
                    setEnvases(Array.isArray(dataEnv) ? dataEnv : (dataEnv.results || []));
                }

                // Clientes
                if (ENDPOINTS.clientes) {
                    const resCli = await fetch(ENDPOINTS.clientes);
                    const dataCli = await resCli.json();
                    setClientes(Array.isArray(dataCli) ? dataCli : (dataCli.results || []));
                }

                // Conceptos (Carga la lista real de Django)
                if (ENDPOINTS.conceptos) {
                    const resConcepto = await fetch(ENDPOINTS.conceptos);
                    const dataConcepto = await resConcepto.json();
                    setConceptos(Array.isArray(dataConcepto) ? dataConcepto : (dataConcepto.results || []));
                }
            } catch (error) {
                console.error("Error al cargar los catálogos para el formulario:", error);
            }
        };

        cargarCatalogos();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones directas libres de errores con datos vacíos
        if (!formData.producto || !formData.cliente || !formData.almacen || !formData.kilos || !formData.concepto) {
            alert("Por favor completa todos los campos requeridos (Producto, Concepto, Cliente, Almacén, Kilos).");
            return;
        }

        const dataToSend = {
            producto: parseInt(formData.producto, 10),
            cliente: parseInt(formData.cliente, 10), 
            concepto: parseInt(formData.concepto, 10),
            tipo_movimiento: formData.tipo_movimiento,
            unidades: parseInt(formData.unidades, 10) || 0,
            kilos: parseFloat(formData.kilos) || 0.00,
            lote: formData.lote ? formData.lote.toString().trim() : null,
            almacen: parseInt(formData.almacen, 10),
            embace: formData.embace ? parseInt(formData.embace, 10) : null
        };

        if (isNaN(dataToSend.producto) || isNaN(dataToSend.almacen) || isNaN(dataToSend.cliente) || isNaN(dataToSend.concepto)) {
            alert("Por favor selecciona opciones válidas en los menús desplegables.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const response = await fetch(ENDPOINTS.movimientos, {
                method: 'POST',
                headers,
                body: JSON.stringify(dataToSend)
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                alert(`Error del servidor (${response.status}).`);
                return;
            }

            if (response.ok) {
                alert('¡ÉXITO! Movimiento de salida registrado correctamente.');
                onRefresh();
                onClose();
            } else {
                alert('Error al validar campos: ' + JSON.stringify(data));
            }
        } catch (error) {
            alert('No se pudo conectar con el servidor: ' + error.message);
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Registrar Salida de Inventario</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="form-emp-grid">

                    {/* Producto */}
                    <div className="f-group">
                        <label>Producto *</label>
                        <select name="producto" value={formData.producto} onChange={handleChange} required>
                            <option value="">-- Selecciona un producto --</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Concepto (Ya no dará error porque 'conceptos' existe arriba) */}
                    <div className="f-group">
                        <label>Concepto de Movimiento *</label>
                        <select name="concepto" value={formData.concepto} onChange={handleChange} required>
                            <option value="">-- Selecciona un concepto --</option>
                            {conceptos.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Cliente */}
                    <div className="f-group">
                        <label>Cliente *</label>
                        <select name="cliente" value={formData.cliente} onChange={handleChange} required>
                            <option value="">-- Selecciona un cliente --</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre || c.razon_social || `Cliente #${c.id}`}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tipo de Movimiento */}
                    <div className="f-group">
                        <label>Tipo de Movimiento *</label>
                        <select name="tipo_movimiento" value={formData.tipo_movimiento} onChange={handleChange} required>
                            <option value="SALIDA">Salida (Egreso)</option>
                            <option value="ENTRADA">Entrada (Ingreso)</option>
                        </select>
                    </div>

                    {/* Unidades */}
                    <div className="f-group">
                        <label>Unidades</label>
                        <input type="number" name="unidades" min="0" value={formData.unidades} onChange={handleChange} required />
                    </div>

                    {/* Kilos */}
                    <div className="f-group">
                        <label>Kilos *</label>
                        <input type="number" name="kilos" step="0.01" min="0" placeholder="0.00" value={formData.kilos} onChange={handleChange} required />
                    </div>

                    {/* Lote */}
                    <div className="f-group">
                        <label>Lote / Identificador</label>
                        <input type="text" name="lote" placeholder="Ej: L-2026-A" value={formData.lote} onChange={handleChange} />
                    </div>

                    {/* Almacén */}
                    <div className="f-group">
                        <label>Almacén / Cámara *</label>
                        <select name="almacen" value={formData.almacen} onChange={handleChange} required>
                            <option value="">-- Selecciona un almacén --</option>
                            {almacenes.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre || `Cámara #${a.id}`}</option>
                            ))}
                        </select>
                    </div>

                    {/* Envase */}
                    <div className="f-group">
                        <label>Envase / Empaque</label>
                        <select name="embace" value={formData.embace} onChange={handleChange}>
                            <option value="">-- Ninguno / Sin envase --</option>
                            {envases.map(e => (
                                <option key={e.id} value={e.id}>{e.nombre || `Envase ${e.id}`}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-actions-footer">
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar">Registrar Salida</button>
                    </div>

                </form>
            </div>
        </div>
    );
}