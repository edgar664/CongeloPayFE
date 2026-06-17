import React, { useState, useEffect } from 'react';
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar'; 
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas
import FormCli from './formCli'; // Componente de formulario modal para clientes
import './personal.css'; // Reutilizamos los mismos estilos estilizados
import './dashboard.css';

const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        search: <circle cx="11" cy="11" r="8"></circle>,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>,
        trash: <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
        close: <path d="M18 6L6 18M6 6l12 12" />
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function Clientes() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [clientesData, setClientesData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Endpoint del API centralizado para clientes
    const API_URL = ENDPOINTS.clientes;

    const fetchClientes = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            
            // Valida el formato de Django DRF (Array directo o envuelto en results)
            const finalData = Array.isArray(data) ? data : (data.results || data.data || []);
            setClientesData(finalData);
            console.log("Clientes recibidos:", finalData);
        } catch (error) { 
            console.error("Error al obtener clientes:", error); 
        } finally { 
            setLoading(false); 
        }
    };

    // Genera un QR único con la información fiscal del Cliente
    const getQrCodeUrl = (cli) => {
        const payload = `cliente:${cli.id}:${cli.nombre || ''}:RFC-${cli.rfc || ''}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(payload)}`;
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchClientes();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este cliente?')) return;
        try {
            await fetch(`${API_URL}${id}/`, { method: 'DELETE' });
            fetchClientes(); // Actualiza la lista automáticamente
        } catch (e) { 
            alert("Error al eliminar el cliente"); 
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
                        <h1>Control de Clientes - Congeladora SNZ</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">
                        <div className="section-header">
                            <h2>Listado de Clientes</h2>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Agregar Cliente</span>
                            </button>
                        </div>

                        <div className="data-card">
                            <div className="table-wrapper">
                                <table className="personal-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '80px' }}>ID</th>
                                            <th>Razón Social / Nombre</th>
                                            <th>RFC</th>
                                            <th>Dirección Fiscal</th>
                                            <th>Teléfono</th>
                                            <th>Correo Electrónico</th>
                                            <th style={{ textAlign: 'center' }}>Identificador QR</th>
                                            <th style={{ textAlign: 'center', width: '100px' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    Cargando clientes registrados...
                                                </td>
                                            </tr>
                                        ) : clientesData.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    No se encontraron clientes registrados.
                                                </td>
                                            </tr>
                                        ) : (
                                            clientesData.map(cli => (
                                                <tr key={cli.id}>
                                                    <td><strong>{cli.id}</strong></td>
                                                    <td>
                                                        <span className="user-name">{cli.nombre}</span>
                                                    </td>
                                                    <td>
                                                        <span className="dept-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                                            {cli.rfc}
                                                        </span>
                                                    </td>
                                                    <td style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '0.85rem' }}>
                                                        {cli.direccion || <span style={{ color: '#94a3b8' }}>No registrada</span>}
                                                    </td>
                                                    <td>{cli.telefono || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                                                    <td>
                                                        {cli.email ? (
                                                            <span className="user-email">{cli.email}</span>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8' }}>Sin correo</span>
                                                        )}
                                                    </td>
                                                    <td className="qr-cell" style={{ textAlign: 'center' }}>
                                                        <img 
                                                            src={getQrCodeUrl(cli)} 
                                                            alt={`QR ${cli.nombre}`} 
                                                            width="55" 
                                                            height="55" 
                                                            style={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                                        />
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button 
                                                            className="btn-icon delete" 
                                                            onClick={() => handleDelete(cli.id)}
                                                            title="Eliminar Cliente"
                                                        >
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

            {/* Render condicional de tu modal de agregar cliente */}
            {showModal && (
                <FormCli 
                    onClose={() => setShowModal(false)} 
                    onRefresh={fetchClientes} 
                />
            )}
        </div>
    );
}