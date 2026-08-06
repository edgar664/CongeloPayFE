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
    
    // Modal de registro
    const [showFormMov, setShowFormMov] = useState(false);

    // Estados de API
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

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

            const response = await fetch(ENDPOINTS.movimientosInventario || '/api/movimientos-inventario/', { method: 'GET', headers });

            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data.results || []);
                setMovimientos(items);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.detail || 'Error al obtener el historial de movimientos.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchMovimientos();
    }, [fetchMovimientos]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const handleFormSuccess = () => {
        setShowFormMov(false);
        fetchMovimientos();
    };

    // Lógica de filtrado limpia
    const filteredItems = movimientos.filter(item => {
        const loteCodigo = typeof item.lote === 'object' ? item.lote?.codigo_lote : (item.lote_codigo || String(item.lote || ''));
        const productoNombre = typeof item.lote === 'object' ? (item.lote?.producto?.nombre || '') : (item.producto_nombre || '');
        const usuarioNombre = typeof item.usuario === 'object' ? (item.usuario?.first_name || item.usuario?.username) : (item.usuario_nombre || '');

        const matchesSearch = 
            loteCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTipo = filterTipoMov === 'TODOS' || item.tipo_movimiento === filterTipoMov;

        return matchesSearch && matchesTipo;
    });

    // Métricas dinámicas
    const totalKilosEntradas = movimientos
        .filter(m => m.tipo_movimiento?.startsWith('ENTRADA'))
        .reduce((acc, curr) => acc + parseFloat(curr.peso_neto_kg || 0), 0);

    const totalCajas = movimientos.reduce((acc, curr) => acc + parseInt(curr.cantidad_cajas || 0, 10), 0);
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
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Registro Inmutable de Entradas y Salidas
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
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por lote, producto o usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
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
                                        <th>Lote</th>
                                        <th>Origen → Destino</th>
                                        <th>Cajas</th>
                                        <th>Peso Bruto / Tara</th>
                                        <th>Peso Neto (Kg / Lbs)</th>
                                        <th>Registrado por</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
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
                                            const loteCodigo = typeof item.lote === 'object' ? item.lote?.codigo_lote : (item.lote_codigo || item.lote);
                                            const origenNombre = typeof item.ubicacion_origen === 'object' ? item.ubicacion_origen?.nombre : (item.ubicacion_origen_nombre || '-');
                                            const destinoNombre = typeof item.ubicacion_destino === 'object' ? item.ubicacion_destino?.nombre : (item.ubicacion_destino_nombre || '-');
                                            const usuarioNombre = typeof item.usuario === 'object' ? (item.usuario?.first_name || item.usuario?.username) : (item.usuario_nombre || 'N/D');

                                            const fecha = item.fecha_registro ? new Date(item.fecha_registro).toLocaleString('es-MX') : '-';
                                            const pesoKg = parseFloat(item.peso_neto_kg || 0).toFixed(3);
                                            const pesoLbs = parseFloat(item.peso_neto_lbs || 0).toFixed(3);
                                            const pesoBruto = parseFloat(item.peso_bruto_kg || 0).toFixed(3);
                                            const tara = parseFloat(item.tara_total_kg || 0).toFixed(3);

                                            return (
                                                <tr key={item.id}>
                                                    <td>{fecha}</td>
                                                    <td>
                                                        <span className={`st-badge ${
                                                            item.tipo_movimiento?.startsWith('ENTRADA') ? 'active' :
                                                            item.tipo_movimiento?.startsWith('SALIDA') ? 'critical' : 'warning'
                                                        }`}>
                                                            {item.tipo_movimiento}
                                                        </span>
                                                    </td>
                                                    <td className="code-cell">{loteCodigo}</td>
                                                    <td>
                                                        <small>{origenNombre}</small> &rarr; <span className="location-tag">{destinoNombre}</span>
                                                    </td>
                                                    <td><strong>{item.cantidad_cajas}</strong></td>
                                                    <td>
                                                        <small>B: {pesoBruto} kg<br />T: {tara} kg</small>
                                                    </td>
                                                    <td>
                                                        <strong>{pesoKg} kg</strong><br />
                                                        <small style={{ color: '#666' }}>{pesoLbs} lbs</small>
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