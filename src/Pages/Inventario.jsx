import React, { useEffect, useMemo, useState } from "react";
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import { ENDPOINTS } from '../api';
import './personal.css'; // Reutiliza el CSS estructurado y estilizado del dashboard
import './dashboard.css';

const Icon = ({ name }) => {
    const icons = {
        search: <circle cx="11" cy="11" r="8"></circle>,
        refresh: <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
        box: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function StockInventario() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [stockList, setStockList] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔗 Apuntamos al endpoint que consulta el Stock de la Base de Datos
    // Si no lo tienes en ENDPOINTS, puedes mapearlo directamente como: `${API_BASE_URL}/apiInv/stock/` o el que corresponda
    const API_URL = ENDPOINTS.stock;

    const loadStock = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Token ${token}`;

            const response = await fetch(API_URL, { headers });
            if (!response.ok) {
                throw new Error(`Error al cargar existencias: ${response.status}`);
            }
            const data = await response.json();

            const finalData = Array.isArray(data)
                ? data
                : (data.results || data.data || []);

            setStockList(finalData);
            console.log("📈 Stock cargado exitosamente:", finalData);
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar con el servidor para obtener las existencias actuales.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        loadStock();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    // 🔍 Filtro inteligente para buscar por Producto, Lote o Almacén
    const filteredStock = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return stockList;
        return stockList.filter(
            item =>
                item.nombre_producto?.toLowerCase().includes(query) ||
                item.lote?.toLowerCase().includes(query) ||
                item.nombre_almacen?.toLowerCase().includes(query)
        );
    }, [stockList, search]);

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
                        <h1>Existencias de Inventario - Congeladora SNZ</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">

                        <div className="section-header">
                            <h2>Existencias Reales en Cámaras</h2>
                            <button className="btn-add" style={{ backgroundColor: '#0f172a' }} onClick={loadStock}>
                                <Icon name="refresh" /> <span>Actualizar Stock</span>
                            </button>
                        </div>

                        {/* Filtro de búsqueda */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', gap: '10px' }}>
                                <Icon name="search" />
                                <input
                                    id="stock-search"
                                    type="text"
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Buscar por producto, número de lote juliano o cámara/almacén..."
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
                                            <th>Producto</th>
                                            <th>No. de Lote</th>
                                            <th>Ubicación / Cámara</th>
                                            <th style={{ textAlign: "right" }}>Unidades Disponibles</th>
                                            <th style={{ textAlign: "right" }}>Kilos Netos Totales</th>
                                            <th style={{ textAlign: "center" }}>Estatus</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    Calculando existencias en tiempo real...
                                                </td>
                                            </tr>
                                        ) : filteredStock.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    No se encontraron registros de stock que coincidan.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStock.map(item => (
                                                <tr key={item.id}>
                                                    <td><strong>#{item.id}</strong></td>
                                                    {/* Cambia la celda del producto por esta estructura más segura: */}
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ color: '#64748b' }}><Icon name="box" /></div>
                                                            <span className="user-name" style={{ fontWeight: '500' }}>
                                                                {item.nombre_producto || item.producto_nombre || (item.producto ? `Producto #${item.producto}` : 'Sin Nombre')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontFamily: 'monospace', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#334155' }}>
                                                            {item.lote}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="dept-tag" style={{ background: '#eff6ff', color: '#1e40af', fontWeight: '500' }}>
                                                            {item.nombre_almacen || `Cámara #${item.almacen || item.almacen_id}`}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", fontWeight: '700', fontSize: '1.05rem' }}>
                                                        {Number(item.unidades).toLocaleString()} 
                                                    </td>
                                                    <td style={{ textAlign: "right", color: '#047857', fontWeight: '700', fontSize: '1.05rem' }}>
                                                        {Number(item.kilos_netos).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        {item.unidades <= 0 ? (
                                                            <span style={{ background: '#fef2f2', color: '#991b1b', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>Agotado</span>
                                                        ) : item.unidades <= 10 ? (
                                                            <span style={{ background: '#fff7ed', color: '#9a3412', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>Stock Bajo</span>
                                                        ) : (
                                                            <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>Disponible</span>
                                                        )}
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
        </div>
    );
}