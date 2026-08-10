import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import { ENDPOINTS } from '../api';
import './almacen.css';

export default function StockProductos() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAlmacen, setFilterAlmacen] = useState('TODOS');
    const [filterEstatus, setFilterEstatus] = useState('TODOS');

    // Estados de API
    const [stockItems, setStockItems] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Obtener las existencias de inventario / tarimas activas
    const fetchStock = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const url = ENDPOINTS.existencias || ENDPOINTS.stockInventario || '/api/existencias/';
            const response = await fetch(url, { method: 'GET', headers });

            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data.results || []);
                setStockItems(items);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.error || errData.detail || 'Error al consultar las existencias de inventario.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Cargar opciones de almacenes para el filtro
    const fetchAlmacenes = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const url = ENDPOINTS.almacenes || '/api/almacenes/';
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAlmacenes(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) {
            console.error("Error al cargar almacenes:", err);
        }
    }, []);

    useEffect(() => {
        fetchStock();
        fetchAlmacenes();
    }, [fetchStock, fetchAlmacenes]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Función auxiliar para resolver la ubicación en texto
    const resolverUbicacion = (item) => {
        const ub = item.ubicacion_actual || item.ubicacion;
        if (!ub) return 'Sin asignación';

        if (typeof ub === 'object' && ub !== null) {
            const almacen = ub.almacen_nombre || ub.almacen?.nombre || '';
            const posicion = ub.nombre || ub.codigo_ubicacion || ub.codigo || '';
            return almacen && posicion ? `${almacen} - ${posicion}` : (almacen || posicion || 'Sin asignación');
        }

        // Si es ID numérico o código en texto
        const almacenDirecto = item.almacen_nombre;
        const codigoDirecto = item.ubicacion_codigo || item.ubicacion_nombre;

        if (almacenDirecto || codigoDirecto) {
            return [almacenDirecto, codigoDirecto].filter(Boolean).join(' - ');
        }

        // Buscar en la lista de almacenes traída por API
        const almacenEncontrado = almacenes.find(a => String(a.id) === String(ub));
        if (almacenEncontrado) {
            return almacenEncontrado.nombre;
        }

        return item.ubicacion_codigo ? `Ubicación: ${item.ubicacion_codigo}` : `Ubicación #${ub}`;
    };

    // Lógica de filtrado en cliente
    const filteredItems = stockItems.filter(item => {
        const tarimaCodigo = String(item.codigo || item.tarima_codigo || item.codigo_tarima || item.id || '');

        const loteCodigo = typeof item.lote === 'object' && item.lote
            ? (item.lote.codigo_lote || item.lote.codigo || '')
            : String(item.lote_codigo || item.lote || '');

        const productoNombre = typeof item.lote === 'object' && item.lote?.producto
            ? (item.lote.producto.nombre || '')
            : String(item.producto_nombre || item.producto || '');

        // Obtención de texto de ubicación resuelto
        const ubicacionTexto = resolverUbicacion(item);

        const term = searchTerm.toLowerCase();
        const matchesSearch =
            tarimaCodigo.toLowerCase().includes(term) ||
            loteCodigo.toLowerCase().includes(term) ||
            productoNombre.toLowerCase().includes(term) ||
            ubicacionTexto.toLowerCase().includes(term);

        const ub = item.ubicacion_actual || item.ubicacion;
        const itemAlmacenId = typeof ub === 'object' ? (ub?.almacen_id || ub?.almacen?.id || ub?.almacen) : ub;
        const matchesAlmacen = filterAlmacen === 'TODOS' || String(itemAlmacenId) === String(filterAlmacen);

        const matchesEstatus = filterEstatus === 'TODOS' ||
            (item.estatus || item.estado) === filterEstatus;

        return matchesSearch && matchesAlmacen && matchesEstatus;
    });

    // Métricas globales
    const totalTarimasStock = filteredItems.length;
    const totalKilosStock = filteredItems.reduce((acc, curr) => acc + parseFloat(curr.peso_neto_kg || curr.peso_neto || 0), 0);
    const totalCajasStock = filteredItems.reduce((acc, curr) => acc + parseInt(curr.cantidad_cajas || curr.unidades || curr.cajas || 0, 10), 0);

    return (
        <div
            className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''} ${menuOpen ? 'menu-open' : ''}`}
            style={{
                '--primary-theme': company.color_primario || '#1B2A52',
                '--secondary-theme': company.color_secundario || '#2E7D32'
            }}
        >
            {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

            <Sidebar
                collapsed={isCollapsed}
                setCollapsed={setIsCollapsed}
                handleLogout={handleLogout}
            />

            <main className="pro-main">
                <header className="pro-top-nav">
                    <div className="header-left">
                        <div className="page-title">
                            <h1>Existencias - Control de Stock</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Consulta en tiempo real de Tarimas e Inventario Actual
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={fetchStock}>
                            🔄 Actualizar Stock
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TARIMAS EN STOCK</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalTarimasStock} <small>tarimas</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">PESO NETO DISPONIBLE</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalKilosStock.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small>kg</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL CAJAS / BULTOS</span>
                                <Icon name="thermometer" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalCajasStock.toLocaleString('es-MX')} <small>cajas</small></h2>
                            </div>
                        </div>
                    </section>

                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por tarima, lote, producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="filter-box">
                                <label>Almacén / Cámara:</label>
                                <select value={filterAlmacen} onChange={(e) => setFilterAlmacen(e.target.value)}>
                                    <option value="TODOS">Todos los Almacenes</option>
                                    {almacenes.map(alm => (
                                        <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-box">
                                <label>Estatus:</label>
                                <select value={filterEstatus} onChange={(e) => setFilterEstatus(e.target.value)}>
                                    <option value="TODOS">Todos los Estatus</option>
                                    <option value="DISPONIBLE">Disponible</option>
                                    <option value="CUARENTENA">En Cuarentena</option>
                                    <option value="RESERVADO">Reservado</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="error-container" style={{ margin: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="table-res">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>Tarima / Lote</th>
                                        <th>Producto</th>
                                        <th>Ubicación Actual</th>
                                        <th>Estatus</th>
                                        <th>Cajas</th>
                                        <th>PESO BRUTO / TARA</th>
                                        <th>PESO NETO (KG / LBS)</th>
                                        <th>Fecha Entrada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && stockItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando existencias de inventario...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                No hay existencias disponibles con los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            // 1. Código de Tarima y Lote
                                            const tarimaCodigo = item.folio || item.codigo || item.tarima_codigo || `#${item.id}`;
                                            const loteCodigo = typeof item.lote === 'object' && item.lote
                                                ? (item.lote.codigo_lote || item.lote.codigo)
                                                : (item.lote_codigo || item.lote || '-');

                                            // 2. Nombre del Producto
                                            const productoNombre = typeof item.lote === 'object' && item.lote?.producto
                                                ? item.lote.producto.nombre
                                                : (item.producto_nombre || item.producto || 'Sin Producto');

                                            // 3. Ubicación Actual
                                            const ubicacionNombre = resolverUbicacion(item);

                                            // 4. Estatus
                                            const estatus = item.estatus || item.estado || 'DISPONIBLE';

                                            // 5. Fecha
                                            const fechaRaw = item.fecha_creacion || item.fecha_ingreso || item.created_at || item.fecha_registro;
                                            const fecha = fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-MX') : '-';

                                            // 6. Pesos y Cajas
                                            const pesoBruto = parseFloat(item.peso_bruto_kg || item.peso_bruto || 0).toFixed(3);
                                            const tara = parseFloat(item.tara_total_kg || item.tara || 0).toFixed(3);
                                            const pesoKg = parseFloat(item.peso_neto_kg || item.peso_neto || 0).toFixed(3);
                                            const pesoLbs = parseFloat(item.peso_neto_lbs || (item.peso_neto_kg ? item.peso_neto_kg * 2.20462 : 0)).toFixed(3);
                                            const unidades = item.cantidad_cajas ?? item.unidades ?? item.cajas ?? 0;

                                            return (
                                                <tr key={item.id || tarimaCodigo}>
                                                    <td className="code-cell">
                                                        <strong>{tarimaCodigo}</strong>
                                                        <br />
                                                        <small style={{ color: '#666' }}>Lote: {loteCodigo}</small>
                                                    </td>
                                                    <td>
                                                        <strong>{productoNombre}</strong>
                                                    </td>
                                                    <td>
                                                        <span className="location-tag">{ubicacionNombre}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`st-badge ${
                                                            estatus === 'DISPONIBLE' ? 'active' :
                                                            estatus === 'RESERVADO' ? 'warning' : 'critical'
                                                        }`}>
                                                            {estatus}
                                                        </span>
                                                    </td>
                                                    <td><strong>{unidades}</strong></td>

                                                    <td style={{ lineHeight: '1.4' }}>
                                                        <div><small style={{ color: '#555' }}>B:</small> {pesoBruto} kg</div>
                                                        <div><small style={{ color: '#555' }}>T:</small> {tara} kg</div>
                                                    </td>

                                                    <td style={{ lineHeight: '1.4' }}>
                                                        <div><strong style={{ fontSize: '1rem' }}>{pesoKg} kg</strong></div>
                                                        <div style={{ color: '#888', fontSize: '0.85rem' }}>{pesoLbs} lbs</div>
                                                    </td>

                                                    <td><small>{fecha}</small></td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}