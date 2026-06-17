import React, { useEffect, useMemo, useState } from "react";
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import FormFacturaCliente from './formFacturaCli'; // Modal para crear/vincular facturas de clientes
import { ENDPOINTS } from '../api';
import './personal.css'; 
import './dashboard.css';

const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        search: <circle cx="11" cy="11" r="8"></circle>,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>,
        trash: <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
        fileText: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function FacturasClientes() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [facturas, setFacturas] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Apunta al endpoint de facturas de clientes (tu modelo factura_cliente)
    const API_URL = ENDPOINTS.facturasCli;

    const normalizeFacturasData = (rawData) => {
        if (!rawData) return [];

        const payload = Array.isArray(rawData)
            ? rawData
            : (rawData.results || rawData.data || rawData.facturas || rawData.factura_cliente_set || rawData.clientes || []);

        if (!Array.isArray(payload)) return [];

        // Si el payload contiene directamente campos de la factura, lo retornamos
        const hasFacturaFields = payload.some(item => item && (item.numero_factura || item.monto_total || item.fecha_emision));
        if (hasFacturaFields) {
            return payload;
        }

        // Desglose de llaves anidadas comunes en respuestas relacionales
        const nestedKeys = ['facturas', 'factura_cliente_set', 'facturas_cliente', 'factura'];
        for (const key of nestedKeys) {
            if (payload.some(item => Array.isArray(item?.[key]) && item[key].length > 0)) {
                return payload.flatMap(item => item[key] || []);
            }
        }

        return payload;
    };

    const loadFacturas = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const response = await fetch(API_URL, { headers });
            if (!response.ok) {
                throw new Error(`Error al cargar facturas: ${response.status}`);
            }
            const data = await response.json();

            setFacturas(normalizeFacturasData(data));
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar con el servidor de facturación de clientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        loadFacturas();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta factura de cliente de forma permanente? Esto liberará las salidas asociadas.')) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { method: 'DELETE' };
            if (token) headers['Authorization'] = `Token ${token}`;

            await fetch(`${API_URL}${id}/`, headers);
            loadFacturas();
        } catch (e) {
            alert("Error al eliminar la factura");
        }
    };

    const getNombreCliente = (cliente) => {
        if (!cliente) return 'Cliente no asignado';
        return cliente.nombre || String(cliente);
    };

    const getCantidadMovimientos = (movimientoArray) => {
        if (!movimientoArray) return 0;
        return movimientoArray.length;
    };

    const formatMonto = (monto) => {
        if (monto == null || monto === '') return '$0.00';
        const value = typeof monto === 'number' ? monto : parseFloat(monto);
        return isNaN(value) ? '$0.00' : `$${value.toFixed(2)}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return dateStr.split('-').reverse().join('/');
    };

    const filteredFacturas = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return facturas;
        return facturas.filter(item => {
            const numFactura = String(item.numero_factura || '').toLowerCase();
            const nomCliente = String(item.nombre_cliente || item.cliente?.nombre || item.cliente || '').toLowerCase();
            return numFactura.includes(query) || nomCliente.includes(query);
        });
    }, [facturas, search]);

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
                        <h1>Control de Cuentas - Clientes SNZ</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">

                        <div className="section-header">
                            <div>
                                <h2>Facturas de Clientes</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                    Control de saldos de cobranza e historial de salidas liquidadas
                                </p>
                            </div>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Registrar Factura</span>
                            </button>
                        </div>

                        {/* Filtro de búsqueda */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', gap: '10px' }}>
                                <Icon name="search" />
                                <input
                                    id="facturas-search"
                                    type="text"
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Buscar por número de factura o cliente..."
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        outline: "none",
                                        background: "transparent",
                                        color: "#111827",
                                        fontSize: "0.95rem"
                                    }}
                                />
                            </div>
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
                                            <th>No. Factura</th>
                                            <th>Cliente</th>
                                            <th style={{ textAlign: "center" }}>Salidas Vinculadas</th>
                                            <th style={{ textAlign: "center" }}>Fecha Emisión</th>
                                            <th style={{ textAlign: "center" }}>Fecha Vencimiento</th>
                                            <th style={{ textAlign: "right" }}>Monto Total</th>
                                            <th style={{ textAlign: "center", width: '100px' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    Cargando registro de facturas...
                                                </td>
                                            </tr>
                                        ) : filteredFacturas.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    No se encontraron facturas registradas.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredFacturas.map(item => (
                                                <tr key={item.id}>
                                                    <td><strong>#{item.id}</strong></td>
                                                    <td>
                                                        <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ color: '#64748b' }}><Icon name="fileText" /></span>
                                                            {item.numero_factura}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="user-name" style={{ fontWeight: '500' }}>
                                                            {item.nombre_cliente || item.cliente?.nombre || getNombreCliente(item.cliente) || 'Sin Cliente asignado'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <span className="dept-tag" style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: '600' }}>
                                                            {getCantidadMovimientos(item.movimiento)} salidas
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center", fontSize: '0.9rem' }}>
                                                        {formatDate(item.fecha_emision)}
                                                    </td>
                                                    <td style={{ textAlign: "center", fontSize: '0.9rem' }}>
                                                        <span style={{
                                                            color: new Date(item.fecha_vencimiento) < new Date() ? '#b91c1c' : '#334155',
                                                            fontWeight: new Date(item.fecha_vencimiento) < new Date() ? '600' : '400'
                                                        }}>
                                                            {formatDate(item.fecha_vencimiento)}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", color: '#1d4ed8', fontWeight: '700', fontSize: '1rem' }}>
                                                        {formatMonto(item.monto_total)}
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button
                                                            className="btn-icon delete"
                                                            onClick={() => handleDelete(item.id)}
                                                            title="Eliminar factura"
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

            {showModal && (
                <FormFacturaCliente
                    onClose={() => setShowModal(false)}
                    onRefresh={loadFacturas}
                />
            )}
        </div>
    );
}