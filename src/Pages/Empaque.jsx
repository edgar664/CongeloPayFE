import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import FormEmpaque from '../Components/FormEmpaque'; // Modal para crear/editar empaques
import { ENDPOINTS } from '../api';
import './almacen.css';

// Mapeo de labels para los choices de TipoEmpaque
const TIPO_EMPAQUE_LABELS = {
    TARIMA: 'Tarima / Pallet',
    CAJA: 'Caja de Cartón / Plástico',
    BOLSA: 'Bolsa / Liner Poly',
    TOTE: 'Tote / Macroplástico',
    CLAMSHELL: 'Clamshell',
    OTRO: 'Otros Insumos'
};

export default function CatalogoEmpaques() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('TODOS');
    const [filterEstatus, setFilterEstatus] = useState('TODOS');
    const [showFormEmpaque, setShowFormEmpaque] = useState(false);
    const [empaqueToEdit, setEmpaqueToEdit] = useState(null);
    
    // Estados para la carga de datos desde el endpoint
    const [catalogItems, setCatalogItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Función para obtener los empaques desde el backend
    const fetchEmpaques = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Asegúrate de definir ENDPOINTS.empaques en tu archivo api.js
            const response = await fetch(ENDPOINTS.empaques, {
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
                setError(errData.detail || 'Error al obtener el catálogo de empaques.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchEmpaques();
    }, [fetchEmpaques]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Filtrado de ítems por búsqueda, tipo y estatus
    const filteredItems = catalogItems.filter(item => {
        const nombre = item.nombre || '';
        const tipoKey = item.tipo || '';
        const tipoLabel = TIPO_EMPAQUE_LABELS[tipoKey] || tipoKey;
        const insumoNombre = item.producto_insumo_nombre || item.producto_insumo?.nombre || '';
        const isActivo = item.activo !== false;

        const matchesSearch = nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tipoLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
            insumoNombre.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesTipo = filterTipo === 'TODOS' || tipoKey === filterTipo;
        const matchesEstatus = filterEstatus === 'TODOS' || 
            (filterEstatus === 'Activo' && isActivo) || 
            (filterEstatus === 'Inactivo' && !isActivo);

        return matchesSearch && matchesTipo && matchesEstatus;
    });

    // Métricas calculadas
    const totalEmpaques = catalogItems.length;
    const empaquesActivos = catalogItems.filter(item => item.activo !== false).length;
    
    // Promedio de Peso Tara de los registros activos
    const promedioTara = empaquesActivos > 0
        ? (catalogItems.reduce((acc, curr) => acc + (parseFloat(curr.peso_tara_kg) || 0), 0) / empaquesActivos).toFixed(3)
        : '0.000';

    const handleOpenCreate = () => {
        setEmpaqueToEdit(null);
        setShowFormEmpaque(true);
    };

    const handleOpenEdit = (item) => {
        setEmpaqueToEdit(item);
        setShowFormEmpaque(true);
    };

    const handleFormSuccess = () => {
        fetchEmpaques();
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
                            <h1>Catálogo Maestro de Empaques y Envases</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Control de Contenedores y Pesos Tara
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={handleOpenCreate}>
                            + Nuevo Empaque
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    {/* RESUMEN DEL CATÁLOGO */}
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL EMPAQUES</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalEmpaques} <small>tipos</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">EMPAQUES ACTIVOS</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>{empaquesActivos} <small>disponibles</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">PROMEDIO PESO TARA</span>
                                <Icon name="thermometer" />
                            </div>
                            <div className="p-card-body">
                                <h2>{promedioTara} <small>kg/unidad</small></h2>
                            </div>
                        </div>
                    </section>

                    {/* BÚSQUEDA Y FILTRADO */}
                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, tipo o insumo enlazado..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="filter-box">
                                <label>Tipo de Empaque:</label>
                                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                                    <option value="TODOS">Todos los Tipos</option>
                                    {Object.entries(TIPO_EMPAQUE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-box">
                                <label>Estatus:</label>
                                <select value={filterEstatus} onChange={(e) => setFilterEstatus(e.target.value)}>
                                    <option value="TODOS">Todos los Estatus</option>
                                    <option value="Activo">Activos</option>
                                    <option value="Inactivo">Inactivos</option>
                                </select>
                            </div>
                        </div>

                        {/* ESTADOS DE CARGA Y ERROR */}
                        {error && (
                            <div className="error-container" style={{ margin: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* TABLA DE EMPAQUES */}
                        <div className="table-res">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>Nombre del Envase / Empaque</th>
                                        <th>Tipo de Empaque</th>
                                        <th>Peso Tara (Kg)</th>
                                        <th>Insumo Asociado (SKU)</th>
                                        <th>Estatus</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando empaques y envases...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron empaques registrados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const isActivo = item.activo !== false;
                                            const estatusTexto = isActivo ? 'Activo' : 'Inactivo';
                                            const tipoLabel = TIPO_EMPAQUE_LABELS[item.tipo] || item.tipo;
                                            const pesoTara = parseFloat(item.peso_tara_kg || 0).toFixed(3);
                                            
                                            // Extrae el insumo según como retorne tu API (objeto anidado o ID/Nombre plano)
                                            const insumoNombre = typeof item.producto_insumo === 'object' && item.producto_insumo !== null
                                                ? item.producto_insumo.nombre
                                                : (item.producto_insumo_nombre || item.producto_insumo || null);

                                            return (
                                                <tr key={item.id}>
                                                    <td className="font-semibold">{item.nombre}</td>
                                                    <td>
                                                        <span className="location-tag">
                                                            {tipoLabel}
                                                        </span>
                                                    </td>
                                                    <td className="code-cell" style={{ fontWeight: '600' }}>
                                                        {pesoTara} kg
                                                    </td>
                                                    <td>
                                                        {insumoNombre ? (
                                                            <span style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: '500' }}>
                                                                📦 {insumoNombre}
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: '0.85rem', color: '#9e9e9e', italic: 'true' }}>
                                                                Sin vínculo
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`st-badge ${isActivo ? 'active' : 'critical'}`}>
                                                            {estatusTexto}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            type="button" 
                                                            className="btn-action-table"
                                                            onClick={() => handleOpenEdit(item)}
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

                {/* MODAL PARA NUEVO / EDITAR EMPAQUE */}
                {showFormEmpaque && (
                    <FormEmpaque
                        open={showFormEmpaque}
                        empaqueToEdit={empaqueToEdit}
                        onClose={() => setShowFormEmpaque(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </main>
        </div>
    );
}