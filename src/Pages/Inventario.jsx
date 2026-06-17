import React, { useEffect, useMemo, useState } from "react";
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar'; 
import FormProd from './FormProd'; 
import FormProdEd from './FormProdEd'; 
import { ENDPOINTS } from '../api'; 
import './personal.css'; // Reutiliza el CSS estructurado y estilizado del dashboard
import './dashboard.css';

const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        search: <circle cx="11" cy="11" r="8"></circle>,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2 2h14a2 2 0 0 2 2-2v-7"></path>,
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

export default function Inventario() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false); 
    // 1. Estado para almacenar el producto que se va a editar
    const [editingProduct, setEditingProduct] = useState(null); 

    const API_URL = ENDPOINTS.productos;

    const loadInventory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error al cargar inventario: ${response.status}`);
            }
            const data = await response.json();
            
            const finalData = Array.isArray(data) 
                ? data 
                : (data.results || data.data || []);
                
            setInventory(finalData);
            console.log("Productos cargados exitosamente:", finalData);
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar con el servidor de inventarios.");
        } finally {
            setLoading(false);
        }
    };

    const getQrCodeUrl = (item) => {
        const payload = `producto:${item.id}:${item.nombre || ''}:Cat-${item.categoria || 'Gral'}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(payload)}`;
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        loadInventory();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    // 2. Función para activar la edición de un producto
    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este producto del inventario de forma permanente?')) return;
        try {
            await fetch(`${API_URL}${id}/`, { method: 'DELETE' });
            loadInventory(); 
        } catch (e) { 
            alert("Error al eliminar el producto"); 
        }
    };

    const filteredInventory = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return inventory;
        return inventory.filter(
            item =>
                item.nombre?.toLowerCase().includes(query) ||
                item.categoria?.toLowerCase().includes(query)
        );
    }, [inventory, search]);

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
                        <h1>Control de Inventario - Congeladora SNZ</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">
                        
                        <div className="section-header">
                            <h2>Productos Registrados</h2>
                            <button className="btn-add" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
                                <Icon name="plus" /> <span>Agregar Producto</span>
                            </button>
                        </div>

                        {/* Filtro de búsqueda */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', gap: '10px' }}>
                                <Icon name="search" />
                                <input
                                    id="inventario-search"
                                    type="text"
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Buscar por nombre de producto o categoría..."
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
                                            <th>Nombre del Producto</th>
                                            <th>Categoría</th>
                                            <th style={{ textAlign: "right" }}>Unidades</th>
                                            <th style={{ textAlign: "right" }}>Kilos Totales</th>
                                            <th style={{ textAlign: "right" }}>Precio Unitario</th>
                                            <th style={{ textAlign: "center" }}>Código QR</th>
                                            <th style={{ textAlign: "center", width: '120px' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    Cargando inventarios...
                                                </td>
                                            </tr>
                                        ) : filteredInventory.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                                    No se encontraron productos en el inventario.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredInventory.map(item => (
                                                <tr key={item.id}>
                                                    <td><strong>#{item.id}</strong></td>
                                                    <td><span className="user-name">{item.nombre}</span></td>
                                                    <td>
                                                        <span className="dept-tag" style={{ background: '#f1f5f9', color: '#334155' }}>
                                                            {item.categoria || 'Sin categoría'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", fontWeight: '600' }}>{item.unidades} </td>
                                                    <td style={{ textAlign: "right", color: '#047857', fontWeight: '600' }}>{item.kilos} kg</td>
                                                    <td style={{ textAlign: "right" }}>${item.precio}</td>
                                                    <td className="qr-cell" style={{ textAlign: 'center' }}>
                                                        <img 
                                                            src={getQrCodeUrl(item)} 
                                                            alt={`QR ${item.nombre}`} 
                                                            width="55" 
                                                            height="55" 
                                                            style={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                                        />
                                                    </td>
                                                    <td className="actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        {/* 3. BOTÓN DE EDICIÓN AGREGADO */}
                                                        <button 
                                                            className="btn-icon edit" 
                                                            onClick={() => handleEdit(item)}
                                                            title="Editar producto"
                                                            style={{ color: '#3b82f6', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        >
                                                            <Icon name="edit" />
                                                        </button>

                                                        <button 
                                                            className="btn-icon delete" 
                                                            onClick={() => handleDelete(item.id)}
                                                            title="Eliminar de inventario"
                                                            style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
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

            {/* 4. Pasar el objeto seleccionado o null al FormProd */}
            {showModal && (
                <FormProdEd
                    productToEdit={editingProduct} 
                    onClose={() => { setShowModal(false); setEditingProduct(null); }} 
                    onRefresh={loadInventory} 
                />
            )}
        </div>
    );
}