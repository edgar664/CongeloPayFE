import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import FormProveedor from '../Components/FormProveedor'; // Modal para crear/editar proveedores
import { ENDPOINTS } from '../api';
import './almacen.css';

export default function CatalogoProveedores() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFormProveedor, setShowFormProveedor] = useState(false);
    const [proveedorToEdit, setProveedorToEdit] = useState(null);
    
    // Estados para la carga de datos desde el endpoint
    const [catalogItems, setCatalogItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    // Función para obtener los proveedores desde el backend
    const fetchProveedores = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(ENDPOINTS.proveedores, {
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
                setError(errData.detail || 'Error al obtener el catálogo de proveedores.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Búsqueda multi-campo según la entidad Proveedor
    const filteredItems = catalogItems.filter(item => {
        const nombre = item.nombre || '';
        const rfc = item.rfc || '';
        const email = item.email || '';
        const telefono = item.telefono || '';
        const direccion = item.direccion || '';

        const term = searchTerm.toLowerCase();
        return (
            nombre.toLowerCase().includes(term) ||
            rfc.toLowerCase().includes(term) ||
            email.toLowerCase().includes(term) ||
            telefono.toLowerCase().includes(term) ||
            direccion.toLowerCase().includes(term)
        );
    });

    // Métricas del catálogo
    const totalProveedores = catalogItems.length;
    const proveedoresConRFC = catalogItems.filter(item => item.rfc && item.rfc.trim() !== '').length;

    const handleOpenCreate = () => {
        setProveedorToEdit(null);
        setShowFormProveedor(true);
    };

    const handleOpenEdit = (item) => {
        setProveedorToEdit(item);
        setShowFormProveedor(true);
    };

    const handleFormSuccess = () => {
        fetchProveedores();
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
                            <h1>Catálogo Maestro de Proveedores</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Gestión de Entidades y Proveedores
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={handleOpenCreate}>
                            + Nuevo Proveedor
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    {/* RESUMEN DEL CATÁLOGO */}
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL PROVEEDORES</span>
                                <Icon name="users" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalProveedores} <small>registrados</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">RFC VALIDADOS</span>
                                <Icon name="check-circle" />
                            </div>
                            <div className="p-card-body">
                                <h2>{proveedoresConRFC} <small>activos</small></h2>
                            </div>
                        </div>
                    </section>

                    {/* BÚSQUEDA */}
                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box" style={{ width: '100%' }}>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, RFC, email, teléfono o dirección..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* ESTADOS DE CARGA Y ERROR */}
                        {error && (
                            <div className="error-container" style={{ margin: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* TABLA DE PROVEEDORES */}
                        <div className="table-res">
                            <table className="pro-table">
                                <thead>
                                    <tr>
                                        <th>RFC</th>
                                        <th>Nombre / Razón Social</th>
                                        <th>Teléfono</th>
                                        <th>Correo Electrónico</th>
                                        <th>Dirección</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando proveedores...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron proveedores.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="code-cell">{item.rfc}</td>
                                                <td className="font-semibold">{item.nombre}</td>
                                                <td>{item.telefono}</td>
                                                <td>{item.email}</td>
                                                <td>{item.direccion}</td>
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* MODAL PARA NUEVO / EDITAR PROVEEDOR */}
                {showFormProveedor && (
                    <FormProveedor
                        open={showFormProveedor}
                        proveedorToEdit={proveedorToEdit}
                        onClose={() => setShowFormProveedor(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </main>
        </div>
    );
}