import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- PASO 1: Importar useNavigate
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar'; 
import FormAlmacen from './fromAlm'; 
import { ENDPOINTS } from '../api'; 
import './catalogos.css';
import './dashboard.css';

const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>,
        trash: <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
        view: <circle cx="12" cy="12" r="10"></circle> // <-- Añadido icono para ver detalle
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function Almacenes() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [almacenesData, setAlmacenesData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // <-- PASO 2: Instanciar el router

    const API_URL = ENDPOINTS.almacenes;

    const fetchAlmacenes = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            const rawData = Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : Array.isArray(data.almacenes)
                        ? data.almacenes
                        : [];

            const finalData = rawData.filter(item =>
                item && typeof item.nombre === 'string' && 'descripcion' in item
            );

            setAlmacenesData(finalData);
        } catch (error) {
            console.error("Error al obtener almacenes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchAlmacenes();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este almacén?')) return;
        try {
            await fetch(`${API_URL}${id}/`, { method: 'DELETE' });
            fetchAlmacenes();
        } catch (e) { 
            alert("Error al eliminar el almacén"); 
        }
    };

    return (
        <div className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''} ${menuOpen ? 'menu-open' : ''}`}>
            {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}
            
            <Sidebar collapsed={isCollapsed} handleLogout={() => { localStorage.removeItem('token'); window.location.href='/login'; }} />

            <main className="pro-main">
                <header className="pro-top-nav">
                    <div className="header-left">
                        <button className="menu-hamburger" onClick={() => setIsCollapsed(!isCollapsed)}>
                            <SidebarIcon name="menu" />
                        </button>
                        <h1>Catálogos de Almacenes</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="catalogos-screen">
                        <div className="section-header">
                            <div className="header-text">
                                <h2>Listado de Almacenes</h2>
                                <p>Control de almacenes registrados</p>
                            </div>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Agregar Almacén</span>
                            </button>
                        </div>

                        <div className="data-card">
                            <div className="table-wrapper">
                                <table className="catalogos-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre del Almacén</th>
                                            <th>Descripción</th>
                                            <th style={{ textAlign: 'center' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                                    Cargando almacenes...
                                                </td>
                                            </tr>
                                        ) : almacenesData.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                    No hay almacenes registrados.
                                                </td>
                                            </tr>
                                        ) : (
                                            almacenesData.map(almacen => (
                                                <tr key={almacen.id}>
                                                    <td>{almacen.id}</td>
                                                    <td>
                                                        <span className="almacen-name">{almacen.nombre}</span>
                                                    </td>
                                                    <td>
                                                        <span className="descripcion-tag">{almacen.descripcion}</span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        {/* PASO 3: Botón para redirigir a las entradas de esta cámara */}
                                                        <button 
                                                            className="btn-icon edit" 
                                                            style={{ color: '#2563eb', marginRight: '8px' }}
                                                            onClick={() => navigate(`/entradas?almacen_id=${almacen.id}`)}
                                                            title="Ver entradas de esta cámara"
                                                        >
                                                            <Icon name="view" />
                                                        </button>
                                                        <button className="btn-icon delete" onClick={() => handleDelete(almacen.id)}>
                                                            <Icon name="trash" />
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
                </div>
            </main>

            {showModal && (
                <FormAlmacen 
                    onClose={() => setShowModal(false)} 
                    onRefresh={fetchAlmacenes} 
                />
            )}
        </div>
    );
}