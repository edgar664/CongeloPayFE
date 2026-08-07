import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import FormLote from '../Components/FormLote'; // Modal para crear/editar Lote
import ModalTarimasLote from '../Components/ModalTarimasLote'; // Modal para ver Tarimas
import { ENDPOINTS } from '../api';
import './almacen.css';

export default function CatalogoLotes() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCalidad, setFilterCalidad] = useState('TODOS');
    const [showFormLote, setShowFormLote] = useState(false);
    const [loteToEdit, setLoteToEdit] = useState(null);
    
    // Nuevo Estado para la visualización de Tarimas del Lote
    const [selectedLoteForTarimas, setSelectedLoteForTarimas] = useState(null);

    // Estados para la carga de datos desde el backend
    const [catalogItems, setCatalogItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Función para obtener los lotes desde el backend
    const fetchLotes = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(ENDPOINTS.lotes || '/api/lotes/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data.results || []);
                setCatalogItems(items);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.detail || 'Error al obtener el catálogo de lotes.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchLotes();
    }, [fetchLotes]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const getProductoNombre = (item) => {
        if (typeof item.producto === 'object' && item.producto !== null) {
            return item.producto.nombre || item.producto_nombre || 'N/A';
        }
        return item.producto_nombre || item.producto_display || 'N/A';
    };

    const getProveedorNombre = (item) => {
        if (typeof item.proveedor === 'object' && item.proveedor !== null) {
            return item.proveedor.nombre || item.proveedor.razon_social || 'N/A';
        }
        return item.proveedor_nombre || item.proveedor_display || 'Sin Proveedor';
    };

    const filteredItems = catalogItems.filter(item => {
        const codigo = item.codigo_lote || '';
        const productoNombre = getProductoNombre(item);
        const variedad = item.variedad || '';
        const proveedorNombre = getProveedorNombre(item);
        const estadoCalidad = item.estado_calidad || 'CUARENTENA';

        const matchesSearch = codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            variedad.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesCalidad = filterCalidad === 'TODOS' || estadoCalidad === filterCalidad;
        return matchesSearch && matchesCalidad;
    });

    const totalLotes = catalogItems.length;
    const lotesAprobados = catalogItems.filter(item => item.estado_calidad === 'APROBADO' || item.estado_calidad === 'LIBERADO').length;
    const lotesCuarentena = catalogItems.filter(item => item.estado_calidad === 'CUARENTENA' || !item.estado_calidad).length;

    const handleOpenCreate = () => {
        setLoteToEdit(null);
        setShowFormLote(true);
    };

    const handleOpenEdit = (e, item) => {
        e.stopPropagation(); // Evita que al hacer clic en 'Editar' se abra el modal de tarimas
        setLoteToEdit(item);
        setShowFormLote(true);
    };

    const handleFormSuccess = () => {
        fetchLotes();
    };

    const getBadgeClass = (estado) => {
        switch (estado) {
            case 'APROBADO':
            case 'LIBERADO':
                return 'active';
            case 'CUARENTENA':
                return 'warning';
            case 'RECHAZADO':
                return 'critical';
            default:
                return 'neutral';
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

            <Sidebar
                collapsed={isCollapsed}
                setCollapsed={setIsCollapsed}
                handleLogout={handleLogout}
            />

            <main className="pro-main">
                <header className="pro-top-nav">
                    <div className="header-left">
                        <div className="page-title">
                            <h1>Control Maestro de Lotes</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Trazabilidad de Fruta e Inocuidad
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={handleOpenCreate}>
                            + Registrar Lote
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL LOTES</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalLotes} <small>registros</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">LOTES LIBERADOS / APROBADOS</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>{lotesAprobados} <small>conforme</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">EN CUARENTENA</span>
                                <Icon name="thermometer" />
                            </div>
                            <div className="p-card-body">
                                <h2>{lotesCuarentena} <small>retenidos</small></h2>
                            </div>
                        </div>
                    </section>

                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por código, producto, variedad o proveedor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-box">
                                <label>Estado Calidad:</label>
                                <select value={filterCalidad} onChange={(e) => setFilterCalidad(e.target.value)}>
                                    <option value="TODOS">Todos los Estados</option>
                                    <option value="CUARENTENA">Cuarentena</option>
                                    <option value="APROBADO">Aprobado / Liberado</option>
                                    <option value="RECHAZADO">Rechazado</option>
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
                                        <th>Código Lote</th>
                                        <th>Producto</th>
                                        <th>Variedad</th>
                                        <th>Proveedor</th>
                                        <th>Fecha Proceso / Cosecha</th>
                                        <th>Fecha Caducidad</th>
                                        <th>Estado Calidad</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando catálogo de lotes...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron lotes registrados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const codigo = item.codigo_lote;
                                            const productoNombre = getProductoNombre(item);
                                            const proveedorNombre = getProveedorNombre(item);
                                            const variedad = item.variedad || 'N/A';
                                            const fechaProceso = item.fecha_proceso || 'N/R';
                                            const fechaCaducidad = item.fecha_caducidad || 'N/A';
                                            const estadoCalidad = item.estado_calidad || 'CUARENTENA';

                                            return (
                                                <tr 
                                                    key={item.id} 
                                                    onClick={() => setSelectedLoteForTarimas(item)}
                                                    style={{ cursor: 'pointer' }}
                                                    title="Haz clic para ver las tarimas de este lote"
                                                >
                                                    <td className="code-cell" style={{ color: '#1B2A52', fontWeight: 'bold', textDecoration: 'underline' }}>
                                                        {codigo}
                                                    </td>
                                                    <td className="font-semibold">{productoNombre}</td>
                                                    <td>{variedad}</td>
                                                    <td>{proveedorNombre}</td>
                                                    <td>{fechaProceso}</td>
                                                    <td>{fechaCaducidad}</td>
                                                    <td>
                                                        <span className={`st-badge ${getBadgeClass(estadoCalidad)}`}>
                                                            {item.estado_calidad_display || estadoCalidad}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            type="button" 
                                                            className="btn-action-table"
                                                            onClick={(e) => handleOpenEdit(e, item)}
                                                        >
                                                            Editar
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

                {/* MODAL PARA CREAR / EDITAR LOTE */}
                {showFormLote && (
                    <FormLote
                        open={showFormLote}
                        loteToEdit={loteToEdit}
                        onClose={() => setShowFormLote(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}

                {/* MODAL PARA VER TARIMAS ASOCIADAS AL LOTE */}
                {selectedLoteForTarimas && (
                    <ModalTarimasLote
                        lote={selectedLoteForTarimas}
                        onClose={() => setSelectedLoteForTarimas(null)}
                    />
                )}
            </main>
        </div>
    );
}