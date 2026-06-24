import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import { ENDPOINTS } from '../api';
import FormMov from './FormMov'; // <-- Apuntando al nuevo formulario unificado
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
    const [movimientos, setMovimientos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const almacenIdFiltro = queryParams.get('almacen_id');

    const API_URL = ENDPOINTS.movimientos;

    const fetchMovimientos = async () => {
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

            // 👇 AGREGA ESTA LÍNEA PARA INSPECCIONAR EL ERROR EN TU NAVEGADOR
            console.log("👉 DATOS QUE LLEGAN DEL BACKEND:", data);

            const items = Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : data.data || [];

            setMovimientos(items);
        } catch (err) {
            console.error("Error al obtener movimientos:", err);
            setError("No tienes autorización o el token ha expirado.");
            setMovimientos([]);
        } finally {
            setLoading(false);
        }
    };
    const formatDateTime = (fechaHoraString) => {
        if (!fechaHoraString) return '---';
        const date = new Date(fechaHoraString);

        if (isNaN(date.getTime())) return fechaHoraString;

        // Obtener la fecha en formato local (dd/mm/aaaa)
        const fechaFormateada = date.toLocaleDateString();

        // Configurar la hora para que ignore segundos y milésimas
        const horaFormateada = date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // 👈 Déjalo en true para AM/PM o cámbialo a false para formato 24 horas
        });

        return `${fechaFormateada} | ${horaFormateada}`;
    };

    const formatKilos = (kilos) => {
        if (kilos == null || kilos === '') return '0.00';
        const value = typeof kilos === 'number' ? kilos : parseFloat(kilos);
        return isNaN(value) ? '0.00' : value.toFixed(2);
    };

    // FILTRADO ADAPTADO: Identifica entradas si el destino es un Almacén y el origen es un Proveedor
    // ✅ FILTRADO ULTRA-SEGURO POR ID O TEXTO
    const entradasFiltradas = movimientos.filter((item) => {
        // 1. Intentar por texto si el backend está expandido
        const conceptoTexto = item.nombre_concepto?.toUpperCase() || '';
        const destinoMod = item.destino_modelo?.toLowerCase() || '';
        const origenMod = item.origen_modelo?.toLowerCase() || '';

        // 2. Comprobar si es entrada por sus IDs o por sus nombres de modelo
        // Consideramos Entrada si el concepto es 1 o 2 (Compra / Prod. Terminado)
        // O si los textos correspondientes incluyen palabras clave de entrada
        const esEntrada =
            item.concepto === 1 ||
            item.concepto === 2 ||
            conceptoTexto.includes('COMPRA') ||
            conceptoTexto.includes('ENTRADA') ||
            (destinoMod.includes('almacen') && origenMod.includes('proveedor'));

        if (!esEntrada) return false;

        // 3. Filtro por almacén de la barra de direcciones si existe
        if (almacenIdFiltro) {
            // Compara tanto contra destino_id como contra el destino directo por si viene plano
            const destinoId = item.destino_id || item.destino;
            return String(destinoId) === String(almacenIdFiltro);
        }
        return true;
    });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchMovimientos();
        return () => { document.body.style.overflow = 'auto'; };
    }, [almacenIdFiltro]);

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
                                {almacenIdFiltro && (
                                    <span style={{
                                        display: 'inline-block', background: '#eff6ff', color: '#1d4ed8',
                                        padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem',
                                        fontWeight: '500', marginTop: '4px'
                                    }}>
                                        Filtrado por Almacén #{almacenIdFiltro}{' '}
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
                                            <th>Origen (Proveedor)</th>
                                            <th>Producto</th>
                                            <th>Concepto</th>
                                            <th style={{ textAlign: 'right' }}>Unidades</th>
                                            <th style={{ textAlign: 'right' }}>Kilos Netos</th>
                                            <th style={{ textAlign: 'center' }}>Fecha / Hora</th>
                                            <th>Lote</th>
                                            <th>Destino (Almacén)</th>
                                            <th>Envase</th>
                                            <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    Cargando flujos de inventario...
                                                </td>
                                            </tr>
                                        ) : entradasFiltradas.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    No se encontraron registros de Entradas para este criterio.
                                                </td>
                                            </tr>
                                        ) : (
                                            entradasFiltradas.map((e) => (
                                                <tr key={e.id}>
                                                    <td><strong>#{e.id}</strong></td>
                                                    <td><span className="user-name">{e.nombre_origen || `Proveedor #${e.origen_id}`}</span></td>
                                                    <td><span className="user-name">{e.nombre_producto}</span></td>
                                                    <td>
                                                        <span className="status-pill activo" style={{ fontSize: '0.75rem' }}>
                                                            {e.nombre_concepto || 'ENTRADA'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{e.unidades ?? 0}</td>
                                                    <td style={{ textAlign: 'right', color: '#047857', fontWeight: '600' }}>
                                                        {formatKilos(e.kilos_netos)} kg
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                                        {(e.fecha)}|{(e.hora)}
                                                    </td>
                                                    <td>
                                                        <span className="dept-tag" style={{ background: '#f1f5f9', color: '#334155' }}>
                                                            {e.lote || 'Sin Lote'}
                                                        </span>
                                                    </td>
                                                    <td><span className="user-cargo">{e.nombre_destino || `Almacén #${e.destino_id}`}</span></td>
                                                    <td><span className="user-cargo">{e.nombre_embace || 'Ninguno'}</span></td>
                                                    <td className="actions-cell">
                                                        <button className="btn-icon edit" onClick={() => navigate(`/entradas/${e.id}`)} title="Ver detalle">
                                                            <Icon name="view" />
                                                        </button>
                                                        <button className="btn-icon" style={{ color: '#eab308' }} onClick={() => navigate(`/entradas/editar/${e.id}`)} title="Modificar">
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
                <FormMov
                    onClose={() => setShowModal(false)}
                    onRefresh={fetchMovimientos}
                />
            )}
        </div>
    );
}