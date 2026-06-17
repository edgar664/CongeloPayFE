import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom"; // <-- PASO 1: Importar useLocation
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import { ENDPOINTS } from '../api'; 
import FormMovEnt from './FormMovEnt'; 
import './personal.css'; 
import './dashboard.css';

const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        view: <circle cx="12" cy="12" r="10"></circle>, 
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>,
        trash: <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function Entradas() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [entradas, setEntradas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // PASO 2: Obtener y leer los parámetros de la URL (?almacen_id=X)
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const almacenIdFiltro = queryParams.get('almacen_id');

    const API_URL = ENDPOINTS.movimientos; 

    const fetchEntradas = async () => {
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
                    : Array.isArray(data.data)
                        ? data.data
                        : [];

            setEntradas(items);
        } catch (err) {
            console.error("Error al obtener movimientos de almacén:", err);
            setError("No tienes autorización o el token ha expirado.");
            setEntradas([]); 
        } finally {
            setLoading(false);
        }
    };


    const formatDateTime = (fecha, hora) => {
        const dateLabel = fecha ? String(fecha) : '';
        const timeLabel = hora ? String(hora) : '';
        return [dateLabel, timeLabel].filter(Boolean).join(' | ');
    };

    const formatKilos = (kilos) => {
        if (kilos == null || kilos === '') return '0.00';
        const value = typeof kilos === 'number' ? kilos : parseFloat(kilos);
        return isNaN(value) ? '0.00' : value.toFixed(2);
    };

    // PASO 3: Filtrado inteligente tolerando si 'almacen' viene como Objeto o ID directo desde Django
    const entradasFiltradas = entradas.filter((item) => {
        const tipo = String(item.tipo_movimiento || item.tipo || '').trim().toLowerCase();
        if (tipo !== 'entrada') return false;

        if (almacenIdFiltro) {
            // Extrae el ID del almacén ya sea que venga como { id: 1, nombre: 'Cámara 1' } o como el entero 1
            const itemAlmacenId = item.almacen && typeof item.almacen === 'object' 
                ? String(item.almacen.id) 
                : String(item.almacen);
            
            return itemAlmacenId === String(almacenIdFiltro);
        }

        return true;
    });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchEntradas();
        return () => { document.body.style.overflow = 'auto'; };
    }, [almacenIdFiltro]); // Se vuelve a activar si el filtro cambia

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
                        <h1>Flujo de Almacén - Congeladora SNZ</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">

                        <div className="section-header">
                            <div>
                                <h2>Historial de Entradas</h2>
                                {/* PASO 4: Interfaz visual para avisar que está viendo los datos filtrados y permitir quitar el filtro */}
                                {almacenIdFiltro && (
                                    <span style={{ 
                                        display: 'inline-block', 
                                        background: '#eff6ff', 
                                        color: '#1d4ed8', 
                                        padding: '4px 10px', 
                                        borderRadius: '16px', 
                                        fontSize: '0.8rem', 
                                        fontWeight: '500',
                                        marginTop: '4px'
                                    }}>
                                        Filtrado por Cámara #{almacenIdFiltro}{' '}
                                        <button 
                                            onClick={() => navigate('/entradas')} 
                                            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', marginLeft: '6px', fontWeight: 'bold' }}
                                        >
                                            [Quitar Filtro]
                                        </button>
                                    </span>
                                )}
                            </div>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Registrar Entrada</span>
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
                                            <th>Proveedor</th>
                                            <th>Producto</th>
                                            <th>Tipo</th>
                                            <th style={{ textAlign: 'right' }}>Unidades</th>
                                            <th style={{ textAlign: 'right' }}>Kilos</th>
                                            <th style={{ textAlign: 'center' }}>Fecha / Hora</th>
                                            <th>Lote</th>
                                            <th>Almacén</th>
                                            <th>Envase</th>
                                            <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    Cargando flujos de inventario...
                                                </td>
                                            </tr>
                                        ) : entradasFiltradas.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    No se encontraron registros de Entradas para este criterio.
                                                </td>
                                            </tr>
                                        ) : (
                                            entradasFiltradas.map((e) => (
                                                <tr key={e.id}>
                                                    <td><strong>#{e.id}</strong></td>
                                                    <td>
                                                        <span className="user-name">{(e.nombre_proveedor)}</span>
                                                    </td>
                                                    <td>
                                                        <span className="user-name">{(e.nombre_producto)}</span>
                                                    </td>
                                                    
                                                    <td>
                                                        <span className={`status-pill ${String(e.tipo_movimiento || e.tipo || '').trim().toLowerCase() === 'entrada' ? 'activo' : 'inactivo'}`} style={{ fontSize: '0.75rem' }}>
                                                            {e.tipo_movimiento || e.tipo || 'Entrada'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                                        {e.unidades != null ? e.unidades : '0'} pzs
                                                    </td>
                                                    <td style={{ textAlign: 'right', color: '#047857', fontWeight: '600' }}>
                                                        {formatKilos(e.kilos)} kg
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                                        {formatDateTime(e.fecha, e.hora)}
                                                     </td>
                                                    <td>
                                                        <span className="dept-tag" style={{ background: '#f1f5f9', color: '#334155' }}>
                                                            {e.lote || 'Sin Lote'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="user-cargo">{(e.nombre_almacen)}</span>
                                                    </td>
                                                    <td>
                                                        <span className="user-cargo">{(e.nombre_embace)}</span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button
                                                            className="btn-icon edit"
                                                            onClick={() => navigate(`/entradas/${e.id}`)}
                                                            title="Ver detalle completo"
                                                        >
                                                            <Icon name="view" />
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            style={{ color: '#eab308' }}
                                                            onClick={() => navigate(`/entradas/editar/${e.id}`)}
                                                            title="Modificar registro"
                                                        >
                                                            <Icon name="edit" />
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
                <FormMovEnt
                    onClose={() => setShowModal(false)}
                    onRefresh={fetchEntradas}
                />
            )}
        </div>
    );
}