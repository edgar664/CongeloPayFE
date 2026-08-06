import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext';
import { Icon } from '../Components/Icon';
import FormUbicacion from '../Components/FormUbicacion';
import { ENDPOINTS } from '../api';

const TIPO_LABELS = {
    PATIO: 'Patio / Recepción',
    TUNEL: 'Túnel de Congelado (IQF)',
    CAMARA: 'Cámara de Conservación',
    EMBARQUE: 'Muelle de Embarque',
    GENERAL: 'Almacén General / Secos'
};

export default function CatalogoUbicaciones() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('TODOS');
    const [filterEstado, setFilterEstado] = useState('TODOS');
    const [showFormUbicacion, setShowFormUbicacion] = useState(false);
    const [ubicacionToEdit, setUbicacionToEdit] = useState(null);

    const [catalogItems, setCatalogItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { company } = useCompany();

    const fetchUbicaciones = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(ENDPOINTS.ubicaciones, {
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
                setError(errData.detail || 'Error al obtener el catálogo de ubicaciones.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUbicaciones();
    }, [fetchUbicaciones]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const filteredItems = catalogItems.filter(item => {
        const codigo = item.codigo_ubicacion || '';
        const nombre = item.nombre || '';
        const almacenNombre = item.almacen_nombre || item.almacen?.nombre || item.almacen?.codigo || '';
        const tipo = item.tipo || '';
        const estaBloqueada = item.bloqueada ?? false;

        const matchesSearch = codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            almacenNombre.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTipo = filterTipo === 'TODOS' || tipo === filterTipo;
        
        let matchesEstado = true;
        if (filterEstado === 'DISPONIBLE') matchesEstado = !estaBloqueada;
        if (filterEstado === 'BLOQUEADA') matchesEstado = estaBloqueada;

        return matchesSearch && matchesTipo && matchesEstado;
    });

    const totalUbicaciones = catalogItems.length;
    const disponibles = catalogItems.filter(item => !item.bloqueada).length;
    const bloqueadas = totalUbicaciones - disponibles;

    const handleOpenCreate = () => {
        setUbicacionToEdit(null);
        setShowFormUbicacion(true);
    };

    const handleOpenEdit = (item) => {
        setUbicacionToEdit(item);
        setShowFormUbicacion(true);
    };

    const handleFormSuccess = () => {
        fetchUbicaciones();
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
                            <h1>Catálogo Maestro de Ubicaciones</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; Racks, Cámaras y Áreas Operativas
                            </p>
                        </div>
                    </div>
                    <div className="header-right">
                        <button type="button" className="btn-primary-sap" onClick={handleOpenCreate}>
                            + Nueva Ubicación
                        </button>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TOTAL UBICACIONES</span>
                                <Icon name="map-pin" />
                            </div>
                            <div className="p-card-body">
                                <h2>{totalUbicaciones} <small>registradas</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">DISPONIBLES</span>
                                <Icon name="check-circle" />
                            </div>
                            <div className="p-card-body">
                                <h2>{disponibles} <small>operativas</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">BLOQUEADAS</span>
                                <Icon name="lock" />
                            </div>
                            <div className="p-card-body">
                                <h2>{bloqueadas} <small>restringidas</small></h2>
                            </div>
                        </div>
                    </section>

                    <div className="pro-card storage-card">
                        <div className="storage-filter-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Buscar por código, nombre o almacén..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-box">
                                <label>Tipo:</label>
                                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                                    <option value="TODOS">Todos los Tipos</option>
                                    <option value="PATIO">Patio / Recepción</option>
                                    <option value="TUNEL">Túnel de Congelado (IQF)</option>
                                    <option value="CAMARA">Cámara de Conservación</option>
                                    <option value="EMBARQUE">Muelle de Embarque</option>
                                    <option value="GENERAL">Almacén General / Secos</option>
                                </select>
                            </div>
                            <div className="filter-box">
                                <label>Estado:</label>
                                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                                    <option value="TODOS">Todos</option>
                                    <option value="DISPONIBLE">Disponibles</option>
                                    <option value="BLOQUEADA">Bloqueadas</option>
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
                                        <th>Almacén</th>
                                        <th>Código Ubicación</th>
                                        <th>Nombre / Descripción</th>
                                        <th>Tipo</th>
                                        <th>Temp. Objetivo</th>
                                        <th>Estatus</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                Cargando ubicaciones...
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                No se encontraron ubicaciones registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const almacenLabel = item.almacen_codigo || item.almacen?.codigo || item.almacen_nombre || item.almacen?.nombre || `Almacén #${item.almacen}`;
                                            const estaBloqueada = item.bloqueada ?? false;

                                            return (
                                                <tr key={item.id}>
                                                    <td className="font-semibold">{almacenLabel}</td>
                                                    <td className="code-cell">{item.codigo_ubicacion}</td>
                                                    <td>{item.nombre}</td>
                                                    <td>{TIPO_LABELS[item.tipo] || item.tipo}</td>
                                                    <td>
                                                        {item.temperatura_objetivo !== null && item.temperatura_objetivo !== undefined
                                                            ? `${item.temperatura_objetivo} °C`
                                                            : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <span className={`st-badge ${!estaBloqueada ? 'active' : 'critical'}`}>
                                                            {!estaBloqueada ? 'Disponible' : 'Bloqueada'}
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

                {showFormUbicacion && (
                    <FormUbicacion
                        open={showFormUbicacion}
                        ubicacionToEdit={ubicacionToEdit}
                        onClose={() => setShowFormUbicacion(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </main>
        </div>
    );
}