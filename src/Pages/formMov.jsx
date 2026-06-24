import React, { useState, useEffect } from 'react';
import './formEmp.css';
import { ENDPOINTS } from '../api';

export default function FormMov({ onClose, onRefresh }) {
    // Catálogos desde Django
    const [lotesDisponibles, setLotesDisponibles] = useState([]);
    const [productos, setProductos] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [envases, setEnvases] = useState([]);
    const [tarimas, setTarimas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [conceptos, setConceptos] = useState([]);

    // Estados de interfaz
    const [tipoFlujo, setTipoFlujo] = useState('ENTRADA'); // ENTRADA, SALIDA, TRASPASO
    const [esProductoTerminado, setEsProductoTerminado] = useState(false); // 🌟 Declarado correctamente

    const [formData, setFormData] = useState({
        producto: '',
        concepto: '',
        lote: '',
        lote_origen: '', // 🌟 Campo clave para la trazabilidad de lotes
        unidades: 0,
        kilos_brutos: '',
        embace: '',
        tarima: '',
        observaciones: '',
        // Polimórficos
        entidad_id: '', // Captura temporal del Proveedor, Cliente o Almacén Origen
        almacen_id: '', // Captura el Almacén Destino o de Origen según aplique
    });

    // Cargar catálogos principales al montar el componente
    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const fetchRes = async (url) => {
                    if (!url) return [];
                    const res = await fetch(url);
                    const data = await res.json();
                    return Array.isArray(data) ? data : (data.results || []);
                };

                setProductos(await fetchRes(ENDPOINTS.productos));
                setAlmacenes(await fetchRes(ENDPOINTS.almacenes));
                setEnvases(await fetchRes(ENDPOINTS.embaces));
                setConceptos(await fetchRes(ENDPOINTS.conceptos));

                if (ENDPOINTS.proveedores) setProveedores(await fetchRes(ENDPOINTS.proveedores));
                if (ENDPOINTS.clientes) setClientes(await fetchRes(ENDPOINTS.clientes));
                if (ENDPOINTS.tarimas) setTarimas(await fetchRes(ENDPOINTS.tarimas));

            } catch (error) {
                console.error("Error al cargar los catálogos:", error);
            }
        };
        cargarCatalogos();
    }, []);

    // Cargar lotes disponibles con existencias únicamente cuando es Producto Terminado
    useEffect(() => {
        if (!esProductoTerminado) {
            setLotesDisponibles([]);
            return;
        }

        const cargarLotesConStock = async () => {
            try {
                const res = await fetch(ENDPOINTS.stock);
                const data = await res.json();
                const items = Array.isArray(data) ? data : (data.results || []);

                // Filtramos solo los lotes de materia prima que tengan stock real en cámaras
                const conExistencia = items.filter(stock => parseFloat(stock.kilos_netos) > 0);
                setLotesDisponibles(conExistencia);
            } catch (error) {
                console.error("Error al obtener los lotes con stock:", error);
            }
        };

        cargarLotesConStock();
    }, [esProductoTerminado]);

    // Monitorear el Concepto seleccionado para deducir las pantallas e identificar Producto Terminado
    useEffect(() => {
        if (!formData.concepto) return;
        const conceptoSeleccionado = conceptos.find(c => String(c.id) === String(formData.concepto));

        if (conceptoSeleccionado) {
            const nombre = conceptoSeleccionado.nombre.toUpperCase();

            // 🌟 Evaluamos si el concepto refiere a transformación interna
            const esProdTerminado = nombre.includes('TERMINADO') || nombre.includes('PROD');
            setEsProductoTerminado(esProdTerminado);

            if (nombre.includes('COMPRA') || nombre.includes('ENTRADA') || esProdTerminado) {
                setTipoFlujo('ENTRADA');
            } else if (nombre.includes('TRASPASO')) {
                setTipoFlujo('TRASPASO');
            } else {
                setTipoFlujo('SALIDA');
            }
        }
    }, [formData.concepto, conceptos]);

    // LOTE AUTOMÁTICO INTELIGENTE (Discrimina entre Compra Externa y Producto Terminado)
    useEffect(() => {
        if (tipoFlujo !== 'ENTRADA') return;

        // Cálculo estandarizado del Día Juliano y Año
        const hoy = new Date();
        const inicioAnio = new Date(hoy.getFullYear(), 0, 0);
        const diferenciaMs = hoy - inicioAnio;
        const unDiaMs = 1000 * 60 * 60 * 24;
        const diaJuliano = Math.floor(diferenciaMs / unDiaMs);
        const diaJulianoFormateado = String(diaJuliano).padStart(3, '0');
        const anioDosDigitos = String(hoy.getFullYear()).slice(-2);

        // Caso 1: Es Producto Terminado (Formato puro sin proveedor: ej. 17526)
        if (esProductoTerminado) {
            setFormData(prev => ({
                ...prev,
                entidad_id: '', // Limpiar ID de proveedor para el backend polimórfico
                lote: `${diaJulianoFormateado}${anioDosDigitos}`
            }));
        }
        // Caso 2: Es Entrada por Compra Tradicional (Requiere proveedor: ej. 04-17526)
        else if (formData.entidad_id) {
            const idProveedor = String(formData.entidad_id).padStart(2, '0');
            setFormData(prev => ({
                ...prev,
                lote: `${idProveedor}-${diaJulianoFormateado}${anioDosDigitos}`
            }));
        } else {
            setFormData(prev => ({ ...prev, lote: '' }));
        }
    }, [formData.entidad_id, tipoFlujo, esProductoTerminado]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const cargarLotesConStock = async () => {
        try {
            const res = await fetch(ENDPOINTS.stock);
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.results || []);

            // 🌟 ESTO TE DIRÁ QUÉ TRAE TU BACKEND EN LA CONSOLA F12:
            console.log("TODOS LOS LOTES DESDE EL BACKEND:", items);

            const conExistencia = items.filter(stock => parseFloat(stock.kilos_netos) > 0);

            console.log("LOTES QUE PASARON EL FILTRO (> 0 kg):", conExistencia);

            setLotesDisponibles(conExistencia);
        } catch (error) {
            console.error("Error al obtener los lotes con stock:", error);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.producto || !formData.concepto || !formData.kilos_brutos) {
            alert("Por favor completa los campos obligatorios del producto y pesaje.");
            return;
        }

        if (esProductoTerminado && !formData.lote_origen) {
            alert("Por favor selecciona el lote de fruta de origen para garantizar la trazabilidad.");
            return;
        }

        let dataToSend = {
            producto: parseInt(formData.producto, 10),
            concepto: parseInt(formData.concepto, 10),
            lote: formData.lote.trim() || null,
            lote_origen: esProductoTerminado ? formData.lote_origen : null, // 🌟 Viaja al backend
            unidades: parseInt(formData.unidades, 10) || 0,
            kilos_brutos: parseFloat(formData.kilos_brutos) || 0.00,
            embace: formData.embace ? parseInt(formData.embace, 10) : null,
            tarima: formData.tarima ? parseInt(formData.tarima, 10) : null,
            observaciones: formData.observaciones,
        };

        if (tipoFlujo === 'ENTRADA') {
            // Si es Producto Terminado, el origen es un proceso interno (null en proveedor)
            dataToSend.origen_modelo = esProductoTerminado ? null : "Proveedor";
            dataToSend.origen_id = esProductoTerminado ? null : parseInt(formData.entidad_id, 10);
            dataToSend.destino_modelo = "almacen";
            dataToSend.destino_id = parseInt(formData.almacen_id, 10);
        } else if (tipoFlujo === 'SALIDA') {
            dataToSend.origen_modelo = "almacen";
            dataToSend.origen_id = parseInt(formData.almacen_id, 10);
            dataToSend.destino_modelo = "Cliente";
            dataToSend.destino_id = parseInt(formData.entidad_id, 10);
        } else if (tipoFlujo === 'TRASPASO') {
            dataToSend.origen_modelo = "almacen";
            dataToSend.origen_id = parseInt(formData.entidad_id, 10);
            dataToSend.destino_modelo = "almacen";
            dataToSend.destino_id = parseInt(formData.almacen_id, 10);
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

            const data = await response.json();

            if (response.ok) {
                alert('¡ÉXITO! Movimiento guardado, trazabilidad enlazada y stock actualizado.');
                onRefresh();
                onClose();
            } else {
                alert('Error en validación backend:\n' + JSON.stringify(data));
            }
        } catch (error) {
            alert('No se pudo conectar al servidor: ' + error.message);
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Registrar Flujo de Inventario (Polimórfico)</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="form-emp-grid">

                    <div className="f-group">
                        <label>Concepto de Operación *</label>
                        <select name="concepto" value={formData.concepto} onChange={handleChange} required>
                            <option value="">-- Selecciona el Concepto --</option>
                            {conceptos.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Producto Nuevo / Resultante *</label>
                        <select name="producto" value={formData.producto} onChange={handleChange} required>
                            <option value="">-- Selecciona un producto --</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* SECTOR FRUTA DE ORIGEN (Se despliega únicamente si es Producto Terminado) */}
                    {esProductoTerminado && (
                        <div className="f-group" style={{ gridColumn: 'span 2', background: '#fff7ed', padding: '12px', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                            <label style={{ color: '#c2410c', fontWeight: '700' }}>🍓 Lote de Materia Prima a Consumir *</label>
                            <select name="lote_origen" value={formData.lote_origen} onChange={handleChange} required={esProductoTerminado}>
                                <option value="">-- Selecciona el Lote de Fruta a transformar --</option>
                                {lotesDisponibles.map(st => (
                                    <option key={st.id} value={st.lote}>
                                        {/* 🌟 Usamos directamente los nuevos campos que agregaste al serializer */}
                                        Lote: {st.lote} | {st.nombre_producto || '-'} | Disp: {st.kilos_netos} kg ({st.nombre_almacen || '-'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* MUESTRA PROVEEDOR SÓLO SI ES ENTRADA COMÚN (NO PRODUCCIÓN INTERNA) */}
                    {tipoFlujo === 'ENTRADA' && !esProductoTerminado && (
                        <div className="f-group">
                            <label>Proveedor Origen *</label>
                            <select name="entidad_id" value={formData.entidad_id} onChange={handleChange} required>
                                <option value="">-- Selecciona un Proveedor --</option>
                                {proveedores.map(pr => (
                                    <option key={pr.id} value={pr.id}>{pr.nombre || pr.razon_social}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {tipoFlujo === 'SALIDA' && (
                        <div className="f-group">
                            <label>Cliente Destino *</label>
                            <select name="entidad_id" value={formData.entidad_id} onChange={handleChange} required>
                                <option value="">-- Selecciona un Cliente --</option>
                                {clientes.map(cl => (
                                    <option key={cl.id} value={cl.id}>{cl.nombre || cl.razon_social}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {tipoFlujo === 'TRASPASO' && (
                        <div className="f-group">
                            <label>Almacén Cámara de Origen *</label>
                            <select name="entidad_id" value={formData.entidad_id} onChange={handleChange} required>
                                <option value="">-- Almacén de Salida --</option>
                                {almacenes.map(a => (
                                    <option key={a.id} value={a.id}>{a.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="f-group">
                        <label>{tipoFlujo === 'SALIDA' ? 'Almacén de Origen *' : 'Almacén Cámara Destino *'}</label>
                        <select name="almacen_id" value={formData.almacen_id} onChange={handleChange} required>
                            <option value="">-- Selecciona un almacén --</option>
                            {almacenes.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Unidades (Bultos/Cajas)</label>
                        <input type="number" name="unidades" min="0" value={formData.unidades} onChange={handleChange} required />
                    </div>

                    <div className="f-group">
                        <label>Kilos Brutos *</label>
                        <input type="number" name="kilos_brutos" step="0.01" min="0" placeholder="0.00" value={formData.kilos_brutos} onChange={handleChange} required />
                    </div>

                    <div className="f-group">
                        <label>Lote Asignado</label>
                        <input
                            type="text"
                            name="lote"
                            placeholder={esProductoTerminado ? "Lote Juliano Puro" : "Autogenerado al elegir proveedor"}
                            value={formData.lote}
                            onChange={handleChange}
                            required
                            disabled={true} // 🌟 Bloqueado para evitar alteraciones accidentales del usuario
                            style={{ backgroundColor: '#e2e8f0', fontWeight: '700', color: '#0f172a' }}
                        />
                    </div>

                    <div className="f-group">
                        <label>Envase (Para calcular tara)</label>
                        <select name="embace" value={formData.embace} onChange={handleChange}>
                            <option value="">-- Ninguno / Sin envase --</option>
                            {envases.map(e => (
                                <option key={e.id} value={e.id}>{e.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Tarima (Para calcular tara)</label>
                        <select name="tarima" value={formData.tarima} onChange={handleChange}>
                            <option value="">-- Ninguna / Sin tarima --</option>
                            {tarimas.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="f-group" style={{ gridColumn: 'span 2' }}>
                        <label>Observaciones</label>
                        <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} placeholder="Detalles extra de la operación (ej. rendimiento, mermas)..." rows="2" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="f-actions-footer" style={{ gridColumn: 'span 2' }}>
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar">Registrar</button>
                    </div>

                </form>
            </div>
        </div>
    );
}