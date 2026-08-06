import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import FormProd from '../Components/FormProductos'; // Modal para crear/editar productos
import { ENDPOINTS } from '../api';
import './almacen.css';

export default function CatalogoProductos() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('TODAS');
    const [filterEstatus, setFilterEstatus] = useState('TODOS');
    
    // Modal y edición
    const [showFormProducto, setShowFormProducto] = useState(false);
    const [productoToEdit, setProductoToEdit] = useState(null);

    // Estados de carga e integración con API
    const [catalogItems, setCatalogItems] = useState([]);
    const [categoriasList, setCategoriasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Obtener catálogo de productos y lista de categorías desde el backend
    const fetchProductosData = useCallback(async () => {
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

            // Peticiones en paralelo: Productos y Categorías
            const [resProductos, resCategorias] = await Promise.all([
                fetch(ENDPOINTS.productos, { method: 'GET', headers }),
                fetch(ENDPOINTS.categoriasProducto, { method: 'GET', headers }).catch(() => null)
            ]);

            if (resProductos.ok) {
                const data = await resProductos.json();
                const items = Array.isArray(data) ? data : (data.results || []);
                setCatalogItems(items);
            } else if (resProductos.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
                return;
            } else {
                const errData = await resProductos.json().catch(() => ({}));
                setError(errData.detail || 'Error al obtener el catálogo de productos.');
            }

            // Cargar categorías para dinamizar el selector de filtro
            if (resCategorias && resCategorias.ok) {
                const dataCat = await resCategorias.json();
                const itemsCat = Array.isArray(dataCat) ? dataCat : (dataCat.results || []);
                setCategoriasList(itemsCat);
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchProductosData();
    }, [fetchProductosData]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Filtrado adaptado al modelo de Django (código_sku, nombre, categoria, activo)
    const filteredItems = catalogItems.filter(item => {
        const sku = item.codigo_sku || '';
        const nombre = item.nombre || '';
        const categoriaNombre = typeof item.categoria === 'object' 
            ? (item.categoria?.nombre || '') 
            : (item.categoria_nombre || '');

        const matchesSearch = sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nombre.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategoria = filterCategoria === 'TODAS' || 
            categoriaNombre === filterCategoria || 
            String(item.categoria) === String(filterCategoria);

        const isActivo = item.activo ?? true;
        const matchesEstatus = filterEstatus === 'TODOS' ||
            (filterEstatus === 'Activo' && isActivo) ||
            (filterEstatus === 'Inactivo' && !isActivo);

        return matchesSearch && matchesCategoria && matchesEstatus;
    });

    // Métricas dinámicas
    const totalProductos = catalogItems.length;
    const productosActivos = catalogItems.filter(item => item.activo ?? true).length;
    
    // Conteo de categorías únicas asociadas
    const categoriasUnicas = new Set(
        catalogItems.map(item => 
            typeof item.categoria === 'object' ? item.categoria?.id : item.categoria
        ).filter(Boolean)
    ).size;

    // Control del Modal
    const handleOpenCreate = () => {
        setProductoToEdit(null);
        setShowFormProducto(true);
    };

    const handleOpenEdit = (item) => {
        setProductoToEdit(item);
        setShowFormProducto(true);
    };

    const handleFormSuccess = () => {
        fetchProductosData();
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
                            <h1>Catálogo Maestro de Productos</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Fichas Técnicas y Especificaciones
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={handleOpenCreate}>
                            + Nuevo Producto
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    {/* RESUMEN DEL CATÁLOGO */}
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL REGISTRADOS</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalProductos} <small>SKUs</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">PRODUCTOS ACTIVOS</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>{productosActivos} <small>disponibles</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">CATEGORÍAS ACTIVAS</span>
                                <Icon name="thermometer" />
                            </div>
                            <div className="p-card-body">
                                <h2>{categoriasUnicas} <small>familias</small></h2>
                            </div>
                        </div>
                    </section>

                    {/* BÚSQUEDA Y FILTRADO */}
                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por SKU o nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-box">
                                <label>Categoría:</label>
                                <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
                                    <option value="TODAS">Todas las Categorías</option>
                                    {categoriasList.map(cat => (
                                        <option key={cat.id} value={cat.nombre || cat.id}>
                                            {cat.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-box">
                                <label>Estatus:</label>
                                <select value={filterEstatus} onChange={(e) => setFilterEstatus(e.target.value)}>
                                    <option value="TODOS">Todos</option>
                                    <option value="Activo">Activos</option>
                                    <option value="Inactivo">Inactivos</option>
                                </select>
                            </div>
                        </div>

                        {/* ESTADO DE ERROR */}
                        {error && (
                            <div className="error-container" style={{ margin: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* TABLA DE PRODUCTOS ADAPTADA AL MODELO DJANGO */}
                        <div className="table-res">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>Código (SKU)</th>
                                        <th>Nombre del Producto</th>
                                        <th>Categoría</th>
                                        <th>Unidad Base</th>
                                        <th>Stock Mínimo</th>
                                        <th>Fecha Creación</th>
                                        <th>Estatus</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando catálogo de productos...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron productos.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const categoriaNombre = typeof item.categoria === 'object'
                                                ? item.categoria?.nombre
                                                : (item.categoria_nombre || 'Sin categoría');

                                            const unidadNombre = typeof item.unidad_medida_base === 'object'
                                                ? item.unidad_medida_base?.nombre || item.unidad_medida_base?.codigo
                                                : (item.unidad_medida_base_nombre || item.unidad_medida_base || 'N/A');

                                            const stockMin = parseFloat(item.stock_minimo || 0).toFixed(3);
                                            const isActivo = item.activo ?? true;
                                            const fechaCreacion = item.fecha_creacion 
                                                ? new Date(item.fecha_creacion).toLocaleDateString('es-MX') 
                                                : '-';

                                            return (
                                                <tr key={item.id}>
                                                    <td className="code-cell">{item.codigo_sku}</td>
                                                    <td className="font-semibold">{item.nombre}</td>
                                                    <td>
                                                        <span className="location-tag">{categoriaNombre}</span>
                                                    </td>
                                                    <td>{unidadNombre}</td>
                                                    <td>{stockMin}</td>
                                                    <td>{fechaCreacion}</td>
                                                    <td>
                                                        <span className={`st-badge ${isActivo ? 'active' : 'critical'}`}>
                                                            {isActivo ? 'Activo' : 'Inactivo'}
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

                {/* MODAL PARA NUEVO / EDITAR PRODUCTO */}
                {showFormProducto && (
                    <FormProd
                        open={showFormProducto}
                        productoToEdit={productoToEdit}
                        onClose={() => setShowFormProducto(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </main>
        </div>
    );
}