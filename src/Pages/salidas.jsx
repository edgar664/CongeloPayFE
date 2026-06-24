import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import { ENDPOINTS } from '../api'; 
import FormMovTraspaso from './FormMovTraspaso'; // Cambiado al formulario molecular de traspasos
import './personal.css'; 
import './dashboard.css';

// Componente para renderizar iconos SVG idénticos a tu módulo corporativo
const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        view: <circle cx="12" cy="12" r="10"></circle>,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>,
        trash: <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
        exchange: <path d="M17 1l4 4-4 4M21 5H9M7 23l-4-4 4-4M3 19h12" />
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function Traspasos() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [movimientos, setMovimientos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const API_URL = ENDPOINTS.movimientos;

    const fetchTraspasos = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };

            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const cleanUrl = API_URL.replace(/([^:]\/)\/+/g, "$1");
            const response = await fetch(cleanUrl, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) throw new Error(`Error en el servidor: ${response.status}`);
            const data = await response.json();

            const items = Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : data.data || [];

            setMovimientos(items);
        } catch (err) {
            console.error("Error al obtener movimientos de traspaso:", err);
            setError("No tienes autorización o el token ha expirado.");
            setMovimientos([]);
        } finally {
            setLoading(false);
        }
    };

    const getNombreProducto = (item) => {
        return item.nombre_producto || 'No disponible';
    };

    const getNombreEnvase = (item) => {
        return item.nombre_embace || '—';
    };

    const formatDateTime = (fecha, hora) => {
        return [fecha, hora].filter(Boolean).join(' | ');
    };

    const formatKilos = (kilos) => {
        if (kilos == null || kilos === '') return '0.00';
        const value = typeof kilos === 'number' ? kilos : parseFloat(kilos);
        return isNaN(value) ? '0.00' : value.toFixed(2);
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchTraspasos();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    // 🎯 FILTRADO EXACTO: Buscamos palabras clave asociadas a Traspasos o Transferencias entre cámaras
    const filteredTraspasos = movimientos.filter((entry) => {
        const concepto = String(entry.nombre_concepto || '').trim().toLowerCase();
        const origenTipo = String(entry.origen_modelo || '').trim().toLowerCase();
        const destinoTipo = String(entry.destino_modelo || '').trim().toLowerCase();
        
        return concepto.includes('traspaso') || (origenTipo === 'almacen' && destinoTipo === 'almacen');
    });

    return (
        <div className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''} ${menuOpen ? 'menu-open' : ''}`}>
            {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

            <Sidebar collapsed={isCollapsed} handleLogout={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} />

            <main className="pro-main">
                <header className="pro-top-nav">
                    <div className="header-left">
                        <button className="menu-hamburger" onClick={() => setIsCollapsed(!isCollapsed)}>
                            <SidebarIcon name="menu" />
                        </button>
                        <h1>Control de Cámaras Frigoríficas - Congeladora SNZ</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">

                        <div className="section-header">
                            <h2>Movimientos entre Almacenes (Traspasos)</h2>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Registrar Traspaso</span>
                            </button>
                        </div>

                        {error && (
                            <div style={{ padding: '12px', marginBottom: "16px", color: "#b91c1c", backgroundColor: '#fef2f2', borderRadius: '8px', fontWeight: "500", fontSize: '0.9rem' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="data-card">
                            <div className="table-wrapper">
                                <table className="personal-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '80px' }}>ID</th>
                                            <th>Producto</th>
                                            <th>Cámara Origen</th>
                                            <th style={{ width: '40px', textAlign: 'center' }}><Icon name="exchange" /></th>
                                            <th>Cámara Destino</th>
                                            <th style={{ textAlign: 'right' }}>Bultos/Pzs</th>
                                            <th style={{ textAlign: 'right' }}>Kilos Netos</th>
                                            <th style={{ textAlign: 'center' }}>Fecha / Hora</th>
                                            <th>Lote Juliano</th>
                                            <th>Envase</th>
                                            <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    Cargando bitácora de traspasos...
                                                </td>
                                            </tr>
                                        ) : filteredTraspasos.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    No se registran movimientos de traspaso entre cámaras frigoríficas.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTraspasos.map((e) => (
                                                <tr key={e.id}>
                                                    <td><strong>#{e.id}</strong></td>
                                                    <td>
                                                        <span className="user-name" style={{ fontWeight: '600' }}>{getNombreProducto(e)}</span>
                                                    </td>
                                                    <td>
                                                        <span className="user-cargo" style={{ color: '#ef4444', fontWeight: '500' }}>
                                                            {e.nombre_origen || 'Desconocido'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center', color: '#64748b' }}>➔</td>
                                                    <td>
                                                        <span className="user-cargo" style={{ color: '#10b981', fontWeight: '500' }}>
                                                            {e.nombre_destino || 'Desconocido'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                                        {e.unidades ?? 0} pzs
                                                    </td>
                                                    <td style={{ textAlign: 'right', color: '#047857', fontWeight: '600' }}>
                                                        {formatKilos(e.kilos_netos || e.kilos)} kg
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                                        {formatDateTime(e.fecha, e.hora)}
                                                    </td>
                                                    <td>
                                                        <span className="dept-tag" style={{ background: '#f1f5f9', color: '#334155', letterSpacing: '0.5px' }}>
                                                            {e.lote || 'Sin Lote'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="user-cargo">{getNombreEnvase(e)}</span>
                                                    </td>
                                                    <td className="actions-cell" style={{ textAlign: 'center' }}>
                                                        <button
                                                            className="btn-icon edit"
                                                            onClick={() => navigate(`/traspasos/${e.id}`)}
                                                            title="Ver auditoría de movimiento"
                                                        >
                                                            <Icon name="view" />
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
                <FormMovTraspaso
                    onClose={() => setShowModal(false)}
                    onRefresh={fetchTraspasos}
                />
            )}
        </div>
    );
}