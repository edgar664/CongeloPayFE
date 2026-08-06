import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import FormCategoria from '../Components/FormCat'; // Modal para crear/editar categorías
import { ENDPOINTS } from '../api';
import './almacen.css';

export default function CatalogoCategorias() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstatus, setFilterEstatus] = useState('TODOS');
    const [showFormCategoria, setShowFormCategoria] = useState(false);
    const [categoriaToEdit, setCategoriaToEdit] = useState(null);
    
    // Estados para la carga de datos desde el endpoint
    const [catalogItems, setCatalogItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Función para obtener las categorías desde el backend
    const fetchCategorias = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(ENDPOINTS.categoriasProducto, {
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
                setError(errData.detail || 'Error al obtener el catálogo de categorías.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchCategorias();
    }, [fetchCategorias]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Filtrado de ítems
    const filteredItems = catalogItems.filter(item => {
        const nombre = item.nombre || '';
        const clave = item.clave || `CAT-${item.id}`;
        const descripcion = item.descripcion || '';
        const estatus = item.estatus || (item.is_active === false ? 'Inactivo' : 'Activo');

        const matchesSearch = nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
            descripcion.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesEstatus = filterEstatus === 'TODOS' || estatus === filterEstatus;
        return matchesSearch && matchesEstatus;
    });

    // Métricas calculadas con datos dinámicos
    const totalCategorias = catalogItems.length;
    const categoriasActivas = catalogItems.filter(item => {
        const estatus = item.estatus || (item.is_active === false ? 'Inactivo' : 'Activo');
        return estatus === 'Activo';
    }).length;
    const totalProductosEnlazados = catalogItems.reduce((acc, curr) => acc + (curr.productosAsociados || curr.total_productos || 0), 0);

    const handleOpenCreate = () => {
        setCategoriaToEdit(null);
        setShowFormCategoria(true);
    };

    const handleOpenEdit = (item) => {
        setCategoriaToEdit(item);
        setShowFormCategoria(true);
    };

    // Callback para refrescar los datos al guardar en el modal
    const handleFormSuccess = () => {
        fetchCategorias();
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
                            <h1>Catálogo Maestro de Categorías</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Familias y Clasificación de Productos
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={handleOpenCreate}>
                            + Nueva Categoría
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    {/* RESUMEN DEL CATÁLOGO */}
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL CATEGORÍAS</span>
                                <Icon name="thermometer" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalCategorias} <small>familias</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">CATEGORÍAS ACTIVAS</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>{categoriasActivas} <small>disponibles</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">PRODUCTOS ASOCIADOS</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalProductosEnlazados} <small>SKUs totales</small></h2>
                            </div>
                        </div>
                    </section>

                    {/* BÚSQUEDA Y FILTRADO */}
                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por clave, nombre o descripción..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-box">
                                <label>Estatus:</label>
                                <select value={filterEstatus} onChange={(e) => setFilterEstatus(e.target.value)}>
                                    <option value="TODOS">Todos los Estatus</option>
                                    <option value="Activo">Activas</option>
                                    <option value="Inactivo">Inactivas</option>
                                </select>
                            </div>
                        </div>

                        {/* ESTADOS DE CARGA Y ERROR */}
                        {error && (
                            <div className="error-container" style={{ margin: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* TABLA DE CATEGORÍAS */}
                        <div className="table-res">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>Clave</th>
                                        <th>Nombre de la Categoría</th>
                                        <th>Descripción</th>
                                        <th>Productos Enlazados</th>
                                        <th>Estatus</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando categorías...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron categorías.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const clave = item.clave || `CAT-${item.id}`;
                                            const estatus = item.estatus || (item.is_active === false ? 'Inactivo' : 'Activo');
                                            const productosCount = item.productosAsociados ?? item.total_productos ?? 0;

                                            return (
                                                <tr key={item.id}>
                                                    <td className="code-cell">{clave}</td>
                                                    <td className="font-semibold">{item.nombre}</td>
                                                    <td>{item.descripcion || 'Sin descripción'}</td>
                                                    <td>
                                                        <span className="location-tag">
                                                            {productosCount} SKUs
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`st-badge ${estatus === 'Activo' ? 'active' : 'critical'}`}>
                                                            {estatus}
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

                {/* MODAL PARA NUEVA / EDITAR CATEGORÍA */}
                {showFormCategoria && (
                    <FormCategoria
                        open={showFormCategoria}
                        categoriaToEdit={categoriaToEdit}
                        onClose={() => setShowFormCategoria(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </main>
        </div>
    );
}