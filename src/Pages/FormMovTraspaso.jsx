import React, { useState, useEffect } from 'react';
import './formEmp.css'; 
import { ENDPOINTS } from '../api';

export default function FormMovTraspaso({ onClose, onRefresh }) {
    // 1. LISTAS DE ESTADO PARA LOS CATÁLOGOS
    const [productos, setProductos] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [envases, setEnvases] = useState([]);
    const [conceptos, setConceptos] = useState([]);
    
    // 🎯 NUEVO ESTADO: Guarda los lotes disponibles según el producto y origen seleccionado
    const [lotesDisponibles, setLotesDisponibles] = useState([]);
    const [cargandoLotes, setCargandoLotes] = useState(false);

    const [formData, setFormData] = useState({
        producto: '',
        concepto: '', 
        origen_id: '',   // Almacén que entrega
        destino_id: '',  // Almacén que recibe
        lote: '',        // Seleccionado desde las existencias reales
        unidades: 0,
        kilos_brutos: '',
        embace: '',
    });

    // 2. CARGA DE CATÁLOGOS INICIALES
    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const resProd = await fetch(ENDPOINTS.productos);
                const dataProd = await resProd.json();
                setProductos(Array.isArray(dataProd) ? dataProd : (dataProd.results || []));

                const resAlm = await fetch(ENDPOINTS.almacenes);
                const dataAlm = await resAlm.json();
                setAlmacenes(Array.isArray(dataAlm) ? dataAlm : (dataAlm.results || []));

                const resEnv = await fetch(ENDPOINTS.embaces);
                const dataEnv = await resEnv.json();
                setEnvases(Array.isArray(dataEnv) ? dataEnv : (dataEnv.results || []));

                const resConcepto = await fetch(ENDPOINTS.conceptos);
                const dataConcepto = await resConcepto.json();
                const listaConceptos = Array.isArray(dataConcepto) ? dataConcepto : (dataConcepto.results || []);
                
                // Preseleccionar automáticamente el concepto de TRASPASO si existe
                setConceptos(listaConceptos);
                const traspasoId = listaConceptos.find(c => c.nombre.toUpperCase().includes('TRASPASO'))?.id || '';
                if (traspasoId) {
                    setFormData(prev => ({ ...prev, concepto: traspasoId }));
                }
            } catch (error) {
                console.error("Error al cargar los catálogos de traspaso:", error);
            }
        };

        cargarCatalogos();
    }, []);

    // 🎯 3. EFECTO REACTIVO: Consulta lotes reales cuando cambian el producto o la cámara de origen
    useEffect(() => {
        const consultarLotesDisponibles = async () => {
            if (!formData.producto || !formData.origen_id) {
                setLotesDisponibles([]);
                return;
            }
            
            setCargandoLotes(true);
            try {
                // Modificado para usar tu endpoint personalizado de StockActual con filtros URL
                const resStock = await fetch(`${ENDPOINTS.stock || '/api/inventarios/stock/'}?almacen_id=${formData.origen_id}&producto_id=${formData.producto}`);
                if (resStock.ok) {
                    const dataStock = await resStock.json();
                    setLotesDisponibles(dataStock);
                }
            } catch (error) {
                console.error("Error al consultar existencias por lote:", error);
            } finally {
                setCargandoLotes(false);
            }
        };

        consultarLotesDisponibles();
    }, [formData.producto, formData.origen_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Si cambian producto u origen, se resetea el lote seleccionado por seguridad
            ...( (name === 'producto' || name === 'origen_id') && { lote: '' } )
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.producto || !formData.concepto || !formData.origen_id || !formData.destino_id || !formData.lote || !formData.kilos_brutos) {
            alert("Por favor completa los campos obligatorios para el traspaso.");
            return;
        }

        if (formData.origen_id === formData.destino_id) {
            alert("El Almacén de Destino no puede ser el mismo que el de Origen.");
            return;
        }

        // Estructura adaptada para recibir relaciones genéricas ContentType del backend
        const dataToSend = {
            producto: parseInt(formData.producto, 10),
            concepto: parseInt(formData.concepto, 10),
            origen_modelo: 'almacen', // Forzado para la validación genérica
            origen_id: parseInt(formData.origen_id, 10),
            destino_modelo: 'almacen',
            destino_id: parseInt(formData.destino_id, 10),
            lote: formData.lote.toString().trim(),
            unidades: parseInt(formData.unidades, 10) || 0,
            kilos_brutos: parseFloat(formData.kilos_brutos) || 0.00,
            embace: formData.embace ? parseInt(formData.embace, 10) : null
        };

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

            const data = await response.json();

            if (response.ok) {
                alert('¡ÉXITO! Traspaso entre cámaras frigoríficas asentado correctamente.');
                onRefresh();
                onClose();
            } else {
                // Captura el ValidationError del backend (ej: "Inventario insuficiente...")
                alert('Error de Validación:\n' + JSON.stringify(data));
            }
        } catch (error) {
            alert('Fallo de conexión: ' + error.message);
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Registrar Traspaso Entre Cámaras</h2>
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

                    {/* Cámara Origen */}
                    <div className="f-group">
                        <label>Cámara Origen (Resta) *</label>
                        <select name="origen_id" value={formData.origen_id} onChange={handleChange} required>
                            <option value="">-- Selecciona cámara origen --</option>
                            {almacenes.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Lote (Selector Dinámico) */}
                    <div className="f-group">
                        <label>Lote Juliano Autorizado *</label>
                        <select 
                            name="lote" 
                            value={formData.lote} 
                            onChange={handleChange} 
                            disabled={!formData.producto || !formData.origen_id || cargandoLotes}
                            required
                        >
                            <option value="">
                                {!formData.producto || !formData.origen_id 
                                    ? " [Selecciona Producto y Origen primero] " 
                                    : cargandoLotes 
                                        ? "Buscando lotes en inventario..." 
                                        : lotesDisponibles.length === 0 
                                            ? "⚠️ Sin existencias de este producto en el origen" 
                                            : `-- Selecciona un lote (${lotesDisponibles.length} disponibles) --`
                                }
                            </option>
                            {lotesDisponibles.map(stock => (
                                <option key={stock.id} value={stock.lote}>
                                    Lote: {stock.lote} (Disp: {stock.unidades} pzs / {stock.kilos_netos} kg)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cámara Destino */}
                    <div className="f-group">
                        <label>Cámara Destino (Suma) *</label>
                        <select name="destino_id" value={formData.destino_id} onChange={handleChange} required>
                            <option value="">-- Selecciona cámara destino --</option>
                            {almacenes.map(a => (
                                <option key={a.id} value={a.id} disabled={parseInt(formData.origen_id, 10) === a.id}>
                                    {a.nombre} {parseInt(formData.origen_id, 10) === a.id ? '(Origen)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Unidades a traspasar */}
                    <div className="f-group">
                        <label>Bultos / Unidades *</label>
                        <input type="number" name="unidades" min="1" value={formData.unidades} onChange={handleChange} required />
                    </div>

                    {/* Kilos Brutos */}
                    <div className="f-group">
                        <label>Kilos Brutos *</label>
                        <input type="number" name="kilos_brutos" step="0.01" min="0.01" placeholder="0.00" value={formData.kilos_brutos} onChange={handleChange} required />
                    </div>

                    {/* Envase */}
                    <div className="f-group">
                        <label>Envase / Empaque</label>
                        <select name="embace" value={formData.embace} onChange={handleChange}>
                            <option value="">-- Sin empaque --</option>
                            {envases.map(e => (
                                <option key={e.id} value={e.id}>{e.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Concepto Oculto / Bloqueado */}
                    <div className="f-group">
                        <label>Concepto Operativo</label>
                        <select name="concepto" value={formData.concepto} onChange={handleChange} required>
                            {conceptos.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-actions-footer">
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar" style={{ backgroundColor: '#10b981' }}>Ejecutar Traspaso</button>
                    </div>

                </form>
            </div>
        </div>
    );
}