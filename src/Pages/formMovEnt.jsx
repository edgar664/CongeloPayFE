import React, { useState, useEffect } from 'react';
import './formEmp.css'; // Reutilizamos tus estilos de modal existentes
import { ENDPOINTS } from '../api'; 

export default function FormMov({ onClose, onRefresh }) {
    // Listas para cargar las relaciones de Django en los <select>
    const [productos, setProductos] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [envases, setEnvases] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [conceptos, setConceptos] = useState([]);

    const [formData, setFormData] = useState({
        producto: '',
        proveedor: '',
        tipo_movimiento: 'ENTRADA', // Valor por defecto del tupla choices
        unidades: 0,
        kilos: '',
        lote: '',
        almacen: '',
        embace: '' ,// Guardado tal cual tu modelo de Django "embace" con 'c'
        concepto: '' 
    });

    // Cargar catálogos relacionales al montar el modal
    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const resProd = await fetch(ENDPOINTS.productos);
                const dataProd = await resProd.json();
                setProductos(Array.isArray(dataProd) ? dataProd : (dataProd.results || []));

                if (ENDPOINTS.almacenes) {
                    const resAlm = await fetch(ENDPOINTS.almacenes);
                    const dataAlm = await resAlm.json();
                    setAlmacenes(Array.isArray(dataAlm) ? dataAlm : (dataAlm.results || []));
                }

                if (ENDPOINTS.embaces) {
                    const resEnv = await fetch(ENDPOINTS.embaces);
                    const dataEnv = await resEnv.json();
                    setEnvases(Array.isArray(dataEnv) ? dataEnv : (dataEnv.results || []));
                }

                if (ENDPOINTS.proveedores) {
                    const resProv = await fetch(ENDPOINTS.proveedores);
                    const dataProv = await resProv.json();
                    setProveedores(Array.isArray(dataProv) ? dataProv : (dataProv.results || []));
                }

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

    // ─── EFECTO NUEVO: CALCULAR LOTE AUTOMÁTICO (Proveedor-DíaJulianoAño) ───
    useEffect(() => {
        if (!formData.proveedor) {
            setFormData(prev => ({ ...prev, lote: '' }));
            return;
        }

        // 1. Asegurar formato de ID proveedor con ceros a la izquierda (Ej: 1 -> "01")
        const idProveedor = String(formData.proveedor).padStart(2, '0');

        // 2. Obtener fecha de hoy
        const hoy = new Date();
        
        // 3. Calcular Día Juliano (Día del año actual)
        const inicioAnio = new Date(hoy.getFullYear(), 0, 0);
        const diferenciaMs = hoy - inicioAnio;
        const unDiaMs = 1000 * 60 * 60 * 24;
        const diaJuliano = Math.floor(diferenciaMs / unDiaMs);
        
        // Formatear Día Juliano a 3 dígitos (Ej: día 5 -> "005", día 167 -> "167")
        const diaJulianoFormateado = String(diaJuliano).padStart(3, '0');

        // 4. Obtener últimos 2 dígitos del año (Ej: 2026 -> "26")
        const anioDosDigitos = String(hoy.getFullYear()).slice(-2);

        // 5. Construir el lote: "01-16726"
        const loteAutogenerado = `${idProveedor}-${diaJulianoFormateado}${anioDosDigitos}`;

        setFormData(prev => ({
            ...prev,
            lote: loteAutogenerado
        }));

    }, [formData.proveedor]); // Se dispara inmediatamente al cambiar el proveedor

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.producto.trim() || !formData.proveedor.trim() || !formData.almacen.trim() || !formData.kilos.trim() || !formData.concepto.trim()) {
            alert("Por favor completa todos los campos requeridos (Producto, Proveedor, Almacén, Kilos, Concepto).");
            return;
        }

        const dataToSend = {
            producto: parseInt(formData.producto, 10),
            proveedor: parseInt(formData.proveedor, 10),
            concepto: parseInt(formData.concepto, 10),
            tipo_movimiento: formData.tipo_movimiento,
            unidades: parseInt(formData.unidades, 10) || 0,
            kilos: parseFloat(formData.kilos) || 0.00,
            lote: formData.lote.trim() || null,
            almacen: parseInt(formData.almacen, 10),
            embace: formData.embace ? parseInt(formData.embace, 10) : null 
        };

        if (isNaN(dataToSend.producto) || isNaN(dataToSend.almacen) || isNaN(dataToSend.proveedor) || isNaN(dataToSend.concepto)) {
            alert("Por favor selecciona un producto, proveedor y un almacén válidos.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Token ${token}`;

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
                alert('¡ÉXITO! Movimiento registrado correctamente.');
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
                    <h2>Registrar Movimiento de Inventario</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="form-emp-grid">
                    
                    <div className="f-group">
                        <label>Producto *</label>
                        <select name="producto" value={formData.producto} onChange={handleChange} required>
                            <option value="">-- Selecciona un producto --</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label> Concepto de Movimiento *</label>
                        <select name="concepto" value={formData.concepto} onChange={handleChange} required>
                            <option value="">-- Selecciona un concepto --</option>
                            {conceptos.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Proveedor *</label>
                        <select name="proveedor" value={formData.proveedor} onChange={handleChange} required>
                            <option value="">-- Selecciona un proveedor --</option>
                            {proveedores.map(pr => (
                                <option key={pr.id} value={pr.id}>{pr.nombre || pr.razon_social || `Proveedor #${pr.id}`}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Tipo de Movimiento *</label>
                        <select name="tipo_movimiento" value={formData.tipo_movimiento} onChange={handleChange} required>
                            <option value="ENTRADA">Entrada (Ingreso)</option>
                            <option value="SALIDA">Salida (Egreso)</option>
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Unidades</label>
                        <input type="number" name="unidades" min="0" value={formData.unidades} onChange={handleChange} required />
                    </div>

                    <div className="f-group">
                        <label>Kilos *</label>
                        <input type="number" name="kilos" step="0.01" min="0" placeholder="0.00" value={formData.kilos} onChange={handleChange} required />
                    </div>

                    {/* El Lote se rellena solo, pero lo dejamos editable por si necesitan corregir manualmente */}
                    <div className="f-group">
                        <label>Lote / Identificador Autogenerado</label>
                        <input 
                            type="text" 
                            name="lote" 
                            placeholder="Se generará al seleccionar proveedor" 
                            value={formData.lote} 
                            onChange={handleChange} 
                            style={{ backgroundColor: '#f8fafc', fontWeight: '600', color: '#0f172a' }}
                        />
                    </div>

                    <div className="f-group">
                        <label>Almacén / Cámara *</label>
                        <select name="almacen" value={formData.almacen} onChange={handleChange} required>
                            <option value="">-- Selecciona un almacén --</option>
                            {almacenes.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre || `Cámara #${a.id}`}</option>
                            ))}
                        </select>
                    </div>

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
                        <button type="submit" className="btn-guardar">Registrar</button>
                    </div>

                </form>
            </div>
        </div>
    );
}