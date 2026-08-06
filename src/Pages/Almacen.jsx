import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import FormAlmacen from '../Components/FormAlmacen'; // Modal para crear/editar almacenes
import { ENDPOINTS } from '../api';
import './almacen.css';

export default function CatalogoAlmacenes() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstatus, setFilterEstatus] = useState('TODOS');
    const [showFormAlmacen, setShowFormAlmacen] = useState(false);
    const [almacenToEdit, setAlmacenToEdit] = useState(null);
    
    // Estados para la carga de datos desde el endpoint
    const [catalogItems, setCatalogItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Función para obtener los almacenes desde el backend
    const fetchAlmacenes = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(ENDPOINTS.almacenes, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Manejar tanto respuestas paginadas (data.results) como listas directas (data)
                const items = Array.isArray(data) ? data : (data.results || []);
                setCatalogItems(items);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.detail || 'Error al obtener el catálogo de almacenes.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchAlmacenes();
    }, [fetchAlmacenes]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Filtrado de ítems
    const filteredItems = catalogItems.filter(item => {
        const nombre = item.nombre || '';
        const codigo = item.codigo || '';
        const direccion = item.direccion || '';
        const esActivo = item.activo ?? item.is_active ?? true;
        const estatus = esActivo ? 'Activo' : 'Inactivo';

        const matchesSearch = nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            direccion.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesEstatus = filterEstatus === 'TODOS' || estatus === filterEstatus;
        return matchesSearch && matchesEstatus;
    });

    // Métricas calculadas con datos dinámicos
    const totalAlmacenes = catalogItems.length;
    const almacenesActivos = catalogItems.filter(item => {
        return (item.activo ?? item.is_active ?? true) === true;
    }).length;
    const almacenesInactivos = totalAlmacenes - almacenesActivos;

    const handleOpenCreate = () => {
        setAlmacenToEdit(null);
        setShowFormAlmacen(true);
    };

    const handleOpenEdit = (item) => {
        setAlmacenToEdit(item);
        setShowFormAlmacen(true);
    };

    // Callback para refrescar los datos al guardar en el modal
    const handleFormSuccess = () => {
        fetchAlmacenes();
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
                            <h1>Catálogo Maestro de Almacenes</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Ubicaciones y Centros de Acopio
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={handleOpenCreate}>
                            + Nuevo Almacén
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    {/* RESUMEN DEL CATÁLOGO */}
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL ALMACENES</span>
                                <Icon name="warehouse" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalAlmacenes} <small>instalaciones</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">ALMACENES ACTIVOS</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>{almacenesActivos} <small>operativos</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">ALMACENES INACTIVOS</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>{almacenesInactivos} <small>deshabilitados</small></h2>
                            </div>
                        </div>
                    </section>

                    {/* BÚSQUEDA Y FILTRADO */}
                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por código, nombre o dirección..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
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

                        {/* ESTADOS DE ERROR */}
                        {error && (
                            <div className="error-container" style={{ margin: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* TABLA DE ALMACENES */}
                        <div className="table-res">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre del Almacén</th>
                                        <th>Dirección Física</th>
                                        <th>Estatus</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando almacenes...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron almacenes registrados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const esActivo = item.activo ?? item.is_active ?? true;
                                            const estatusText = esActivo ? 'Activo' : 'Inactivo';

                                            return (
                                                <tr key={item.id}>
                                                    <td className="code-cell">{item.codigo}</td>
                                                    <td className="font-semibold">{item.nombre}</td>
                                                    <td>{item.direccion || 'Sin dirección registrada'}</td>
                                                    <td>
                                                        <span className={`st-badge ${esActivo ? 'active' : 'critical'}`}>
                                                            {estatusText}
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

                {/* MODAL PARA NUEVO / EDITAR ALMACÉN */}
                {showFormAlmacen && (
                    <FormAlmacen
                        open={showFormAlmacen}
                        almacenToEdit={almacenToEdit}
                        onClose={() => setShowFormAlmacen(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </main>
        </div>
    );
}