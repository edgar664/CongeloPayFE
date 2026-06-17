import React, { useState, useEffect } from 'react';
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar'; 
import FormEnvase from './FormEnvase'; // Formulario modular en Modal
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas
import './catalogos.css';
import './dashboard.css';

const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>,
        trash: <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function Catalogos() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [envasesData, setEnvasesData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Ajusta esta URL según tu backend en Django
    const API_URL = ENDPOINTS.embaces;

    const fetchEnvases = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            
            const finalData = Array.isArray(data) ? data : (data.results || []);
            setEnvasesData(finalData);
        } catch (error) { 
            console.error("Error al obtener envases:", error); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchEnvases();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este envase?')) return;
        try {
            await fetch(`${API_URL}${id}/`, { method: 'DELETE' });
            fetchEnvases();
        } catch (e) { 
            alert("Error al eliminar el envase"); 
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
                        <h1>Catálogos de Producción</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="catalogos-screen">
                        <div className="section-header">
                            <div className="header-text">
                                <h2>Listado de Envases</h2>
                                <p>Control de recipientes, empaques y pesos registrados</p>
                            </div>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Agregar Envase</span>
                            </button>
                        </div>

                        <div className="data-card">
                            <div className="table-wrapper">
                                <table className="catalogos-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre del Producto / Envase</th>
                                            <th>Peso Tara</th>
                                            <th style={{ textAlign: 'center' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                                    Cargando envases...
                                                </td>
                                            </tr>
                                        ) : envasesData.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                    No hay envases registrados.
                                                </td>
                                            </tr>
                                        ) : (
                                            envasesData.map(envase => (
                                                <tr key={envase.id}>
                                                    <td>{envase.id}</td>
                                                    <td>
                                                        <span className="envase-name">{envase.nombre}</span>
                                                    </td>
                                                    <td>
                                                        <span className="weight-tag">{envase.peso}</span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button className="btn-icon delete" onClick={() => handleDelete(envase.id)}>
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
                <FormEnvase 
                    onClose={() => setShowModal(false)} 
                    onRefresh={fetchEnvases} 
                />
            )}
        </div>
    );
}