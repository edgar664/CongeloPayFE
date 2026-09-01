import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import FormLiberacionTarima from '../Components/FormLiberacionTarima'; // Modal para inspeccionar/liberar tarima
import { ENDPOINTS } from '../api';
import './almacen.css'; // O tu archivo CSS de calidad (e.g., liberacionTarimas.css)

export default function ControlLiberacionTarimas() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstatus, setFilterEstatus] = useState('TODOS');
    const [showForm, setShowForm] = useState(false);
    const [tarimaSelected, setTarimaSelected] = useState(null);
    
    // Estados para la carga de datos desde el endpoint
    const [tarimas, setTarimas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Función para obtener las tarimas/lotes desde el backend
    const fetchTarimas = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Reemplaza por tu endpoint de tarimas de calidad (p. ej. ENDPOINTS.tarimasCalidad)
            const response = await fetch(ENDPOINTS.tarimasCalidad || ENDPOINTS.almacenes, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data.results || []);
                setTarimas(items);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.detail || 'Error al obtener el registro de tarimas.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchTarimas();
    }, [fetchTarimas]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Filtrado de tarimas
    const filteredTarimas = tarimas.filter(item => {
        const codigo = item.codigo_tarima || item.folio || '';
        const producto = item.producto_nombre || item.producto || '';
        const lote = item.lote || '';
        const estatus = item.estatus_calidad || 'PENDIENTE'; // PENDIENTE, LIBERADO, RETENIDO, RECHAZADO

        const matchesSearch = codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lote.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesEstatus = filterEstatus === 'TODOS' || estatus === filterEstatus;
        return matchesSearch && matchesEstatus;
    });

    // Métricas calculadas para Calidad
    const totalTarimas = tarimas.length;
    const pendientes = tarimas.filter(t => (t.estatus_calidad || 'PENDIENTE') === 'PENDIENTE').length;
    const liberadas = tarimas.filter(t => t.estatus_calidad === 'LIBERADO').length;
    const retenidas = tarimas.filter(t => t.estatus_calidad === 'RETENIDO' || t.estatus_calidad === 'RECHAZADO').length;

    const handleOpenInspeccion = (item) => {
        setTarimaSelected(item);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        fetchTarimas();
    };

    // Función auxiliar para las clases CSS del badge de estatus
    const getBadgeClass = (estatus) => {
        switch (estatus) {
            case 'LIBERADO':
                return 'st-badge active'; // Verde
            case 'PENDIENTE':
                return 'st-badge warning'; // Amarillo / Naranja
            case 'RETENIDO':
            case 'RECHAZADO':
                return 'st-badge critical'; // Rojo
            default:
                return 'st-badge';
        }
    };

    return (
        <div
            className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''} ${menuOpen ? 'menu-open' : ''}`}
            style={{
                '--primary-theme': company.color_primario || '#1B2A52',
                '--secondary-theme': company.color_secundario || '#2E7D32'
            }}
        >
            {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

            {/* SIDEBAR */}
            <Sidebar
                collapsed={isCollapsed}
                setCollapsed={setIsCollapsed}
                handleLogout={handleLogout}
            />

            <main className="pro-main">
                {/* ENCABEZADO */}
                <header className="pro-top-nav">
                    <div className="header-left">
                        <div className="page-title">
                            <h1>Liberación de Tarimas por Calidad</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Control de Calidad e Inspección
                            </p>
                        </div>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    {/* RESUMEN DE CONTROL DE CALIDAD */}
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL TARIMAS</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalTarimas} <small>registradas</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">PENDIENTES DE REVISIÓN</span>
                                <Icon name="clock" />
                            </div>
                            <div className="p-card-body">
                                <h2>{pendientes} <small>por inspeccionar</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TARIMAS LIBERADAS</span>
                                <Icon name="check-circle" />
                            </div>
                            <div className="p-card-body">
                                <h2>{liberadas} <small>aprobadas</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">RETENIDAS / RECHAZADAS</span>
                                <Icon name="alert-triangle" />
                            </div>
                            <div className="p-card-body">
                                <h2>{retenidas} <small>bloqueadas</small></h2>
                            </div>
                        </div>
                    </section>

                    {/* BÚSQUEDA Y FILTRADO */}
                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por código de tarima, lote o producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-box">
                                <label>Estatus Calidad:</label>
                                <select value={filterEstatus} onChange={(e) => setFilterEstatus(e.target.value)}>
                                    <option value="TODOS">Todos los Estatus</option>
                                    <option value="PENDIENTE">Pendientes</option>
                                    <option value="LIBERADO">Liberadas</option>
                                    <option value="RETENIDO">Retenidas</option>
                                    <option value="RECHAZADO">Rechazadas</option>
                                </select>
                            </div>
                        </div>

                        {/* ESTADOS DE ERROR */}
                        {error && (
                            <div className="error-container" style={{ margin: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* TABLA DE TARIMAS */}
                        <div className="table-res">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>Código Tarima</th>
                                        <th>Producto</th>
                                        <th>Lote</th>
                                        <th>Cajas / Cantidad</th>
                                        <th>Fecha Registro</th>
                                        <th>Estatus Calidad</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando tarimas para inspección...
                                            </td>
                                        </tr>
                                    ) : filteredTarimas.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron tarimas registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTarimas.map((item) => {
                                            const estatus = item.estatus_calidad || 'PENDIENTE';

                                            return (
                                                <tr key={item.id}>
                                                    <td className="code-cell">{item.codigo_tarima || item.folio || `TAR-${item.id}`}</td>
                                                    <td className="font-semibold">{item.producto_nombre || item.producto}</td>
                                                    <td>{item.lote || 'N/A'}</td>
                                                    <td>{item.cantidad_cajas ? `${item.cantidad_cajas} cajas` : item.unidades || '-'}</td>
                                                    <td>{item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString() : '-'}</td>
                                                    <td>
                                                        <span className={getBadgeClass(estatus)}>
                                                            {estatus}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            type="button" 
                                                            className="btn-action-table"
                                                            onClick={() => handleOpenInspeccion(item)}
                                                        >
                                                            {estatus === 'PENDIENTE' ? 'Evaluar / Liberar' : 'Ver / Editar'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* MODAL PARA INSPECCIÓN / LIBERACIÓN DE TARIMA */}
                {showForm && (
                    <FormLiberacionTarima
                        open={showForm}
                        tarimaToEdit={tarimaSelected}
                        onClose={() => setShowForm(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </main>
        </div>
    );
}