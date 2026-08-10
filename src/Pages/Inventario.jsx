import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import RecepcionBascula from '../Components/FormMov';
import { ENDPOINTS } from '../api';
import './almacen.css';

export default function AlmacenProductos() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipoMov, setFilterTipoMov] = useState('TODOS');
    const [tarimaId, setTarimaId] = useState(''); // ID de tarima activa para la API

    // Modal de registro
    const [showFormMov, setShowFormMov] = useState(false);

    // Estados de API
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Función para obtener movimientos (Generales o por Tarima)
    const fetchMovimientos = useCallback(async () => {
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

            // Si hay un tarimaId ingresado, usa la URL del Kardex por tarima
            let url = ENDPOINTS.movimientosInventario || '/api/movimientos-inventario/';
            if (tarimaId.trim() !== '') {
                url = `/api/kardex/tarima/${tarimaId.trim()}/`;
            }

            const response = await fetch(url, { method: 'GET', headers });

            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data.results || []);

                // Ordenar por ID o fecha_registro descendente
                const ordenados = items.sort((a, b) => {
                    const dateA = new Date(a.fecha_registro || a.fecha_movimiento || a.created_at || 0);
                    const dateB = new Date(b.fecha_registro || b.fecha_movimiento || b.created_at || 0);
                    return dateB - dateA || (b.id - a.id);
                });
                setMovimientos(ordenados);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            } else if (response.status === 404) {
                setMovimientos([]);
                setError(`No se encontró el Kardex para la tarima ID: ${tarimaId}`);
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.error || errData.detail || 'Error al obtener el historial de movimientos.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    }, [navigate, tarimaId]);

    useEffect(() => {
        fetchMovimientos();
    }, [fetchMovimientos]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const handleFormSuccess = (nuevoMovimiento) => {
        setShowFormMov(false);
        if (nuevoMovimiento && nuevoMovimiento.id) {
            setMovimientos(prev => [nuevoMovimiento, ...prev]);
        }
        fetchMovimientos();
    };

    // Lógica de filtrado en cliente sobre los datos recibidos
    const filteredItems = movimientos.filter(item => {
        const loteCodigo = typeof item.lote === 'object'
            ? (item.lote?.codigo_lote || item.lote?.codigo || '')
            : String(item.lote_codigo || item.lote || '');

        const productoNombre = typeof item.lote === 'object'
            ? (item.lote?.producto?.nombre || item.lote?.producto_nombre || '')
            : String(item.producto_nombre || '');

        const usuarioNombre = typeof item.usuario === 'object'
            ? (item.usuario?.first_name || item.usuario?.username || '')
            : String(item.usuario_nombre || '');

        const tarimaCodigo = typeof item.tarima === 'object'
            ? (item.tarima?.codigo || item.tarima?.folio || '')
            : String(item.tarima_codigo || item.tarima || '');

        const term = searchTerm.toLowerCase();
        const matchesSearch =
            loteCodigo.toLowerCase().includes(term) ||
            productoNombre.toLowerCase().includes(term) ||
            usuarioNombre.toLowerCase().includes(term) ||
            tarimaCodigo.toLowerCase().includes(term);

        const matchesTipo = filterTipoMov === 'TODOS' || item.tipo_movimiento === filterTipoMov;

        return matchesSearch && matchesTipo;
    });

    // Métricas dinámicas alineadas al esquema backend
    const totalKilosEntradas = movimientos
        .filter(m => m.tipo_movimiento?.startsWith('ENTRADA'))
        .reduce((acc, curr) => acc + parseFloat(curr.peso_neto_kg || 0), 0);

    const totalCajas = movimientos.reduce((acc, curr) => acc + parseInt(curr.unidades || curr.cantidad_cajas || 0, 10), 0);
    const totalMovimientos = movimientos.length;

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
                            <h1>Kardex - Movimientos de Inventario</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; {tarimaId ? `Historial de Tarima #${tarimaId}` : 'Registro Inmutable de Entradas y Salidas'}
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={() => setShowFormMov(true)}>
                            + Registrar Movimiento
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL MOVIMIENTOS</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalMovimientos} <small>registros</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">ENTRADAS NETAS</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalKilosEntradas.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small>kg</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">CAJAS MOVILIZADAS</span>
                                <Icon name="thermometer" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalCajas.toLocaleString('es-MX')} <small>cajas</small></h2>
                            </div>
                        </div>
                    </section>

                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            {/* Input para consulta de Tarima específica (KardexTarimaAPIView) */}
                            <div className="search-box" style={{ maxWidth: '200px' }}>
                                <input
                                    type="number"
                                    placeholder="ID Tarima (Kardex)..."
                                    value={tarimaId}
                                    onChange={(e) => setTarimaId(e.target.value)}
                                />
                            </div>

                            {/* Búsqueda general */}
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por lote, producto o usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Selector de Tipo de Movimiento */}
                            <div className="filter-box">
                                <label>Tipo de Movimiento:</label>
                                <select value={filterTipoMov} onChange={(e) => setFilterTipoMov(e.target.value)}>
                                    <option value="TODOS">Todos los Tipos</option>
                                    <option value="ENTRADA_RECEPCION">Entrada por Recepción</option>
                                    <option value="ENTRADA_PRODUCCION">Entrada Producto IQF</option>
                                    <option value="SALIDA_PRODUCCION">Salida a Proceso</option>
                                    <option value="SALIDA_EMBARQUE">Salida por Embarque</option>
                                    <option value="TRASPASO">Traspaso / Reubicación</option>
                                    <option value="AJUSTE_MERMA">Ajuste por Merma</option>
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
                                        <th>Fecha / Hora</th>
                                        <th>Tipo Movimiento</th>
                                        <th>Tarima / Lote</th>
                                        <th>Origen &rarr; Destino</th>
                                        <th>Cajas</th>
                                        <th>PESO BRUTO / TARA</th>
                                        <th>PESO NETO (KG / LBS)</th>
                                        <th>Registrado por</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && movimientos.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando Kardex de inventario...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron movimientos registrados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            // Extracción segura de Tarima y Lote
                                            const tarimaCodigo = typeof item.tarima === 'object' && item.tarima
                                                ? (item.tarima.codigo || item.tarima.folio || `#${item.tarima.id}`)
                                                : (item.tarima_codigo || (item.tarima ? `#${item.tarima}` : '-'));

                                            const loteCodigo = typeof item.lote === 'object' && item.lote
                                                ? (item.lote.codigo_lote || item.lote.codigo)
                                                : (item.lote_codigo || item.lote || '-');

                                            // Extracción segura de Ubicaciones
                                            const origenNombre = typeof item.ubicacion_origen === 'object' && item.ubicacion_origen
                                                ? (item.ubicacion_origen.almacen_nombre
                                                    ? `${item.ubicacion_origen.almacen_nombre} - ${item.ubicacion_origen.nombre || item.ubicacion_origen.codigo_ubicacion}`
                                                    : item.ubicacion_origen.nombre || item.ubicacion_origen.codigo_ubicacion)
                                                : (item.ubicacion_origen_nombre || 'N/A');

                                            const destinoNombre = typeof item.ubicacion_destino === 'object' && item.ubicacion_destino
                                                ? (item.ubicacion_destino.almacen_nombre
                                                    ? `${item.ubicacion_destino.almacen_nombre} - ${item.ubicacion_destino.nombre || item.ubicacion_destino.codigo_ubicacion}`
                                                    : item.ubicacion_destino.nombre || item.ubicacion_destino.codigo_ubicacion)
                                                : (item.ubicacion_destino_nombre || 'N/A');

                                            // Usuario
                                            const usuarioNombre = typeof item.usuario === 'object' && item.usuario
                                                ? (item.usuario.first_name ? `${item.usuario.first_name} ${item.usuario.last_name || ''}`.trim() : item.usuario.username)
                                                : (item.usuario_nombre || 'Sistema');

                                            const fechaRaw = item.fecha_registro || item.fecha_movimiento || item.created_at;
                                            const fecha = fechaRaw ? new Date(fechaRaw).toLocaleString('es-MX') : '-';

                                            // Formateo de pesos
                                            const pesoBruto = parseFloat(item.peso_bruto_kg || item.peso_bruto || 0).toFixed(3);
                                            const tara = parseFloat(item.tara_total_kg || item.tara || 0).toFixed(3);
                                            const pesoKg = parseFloat(item.peso_neto_kg || 0).toFixed(3);
                                            const pesoLbs = parseFloat(item.peso_neto_lbs || (item.peso_neto_kg ? item.peso_neto_kg * 2.20462 : 0)).toFixed(3);
                                            const unidades = item.unidades ?? item.cantidad_cajas ?? 0;

                                            return (
                                                <tr key={item.id}>
                                                    <td>{fecha}</td>
                                                    <td>
                                                        <span className={`st-badge ${item.tipo_movimiento?.startsWith('ENTRADA') ? 'active' :
                                                                item.tipo_movimiento?.startsWith('SALIDA') ? 'critical' : 'warning'
                                                            }`}>
                                                            {item.tipo_movimiento}
                                                        </span>
                                                    </td>
                                                    <td className="code-cell">
                                                        <strong>{tarimaCodigo}</strong>
                                                        <br />
                                                        <small style={{ color: '#666' }}>Lote: {loteCodigo}</small>
                                                    </td>
                                                    <td>
                                                        <small>{origenNombre}</small> &rarr; <span className="location-tag">{destinoNombre}</span>
                                                    </td>
                                                    <td><strong>{unidades}</strong></td>

                                                    {/* Columna PESO BRUTO / TARA */}
                                                    <td style={{ lineHeight: '1.4' }}>
                                                        <div><small style={{ color: '#555' }}>B:</small> {pesoBruto} kg</div>
                                                        <div><small style={{ color: '#555' }}>T:</small> {tara} kg</div>
                                                    </td>

                                                    {/* Columna PESO NETO (KG / LBS) */}
                                                    <td style={{ lineHeight: '1.4' }}>
                                                        <div><strong style={{ fontSize: '1rem' }}>{pesoKg} kg</strong></div>
                                                        <div style={{ color: '#888', fontSize: '0.85rem' }}>{pesoLbs} lbs</div>
                                                    </td>

                                                    <td>{usuarioNombre}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {showFormMov && (
                    <RecepcionBascula
                        open={showFormMov}
                        onClose={() => setShowFormMov(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </main>
        </div>
    );
}