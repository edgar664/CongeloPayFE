import React, { useEffect, useMemo, useState } from "react";
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import FormFactura from './formFacturaProv'; 
import { ENDPOINTS } from '../api';
import './personal.css'; 
import './dashboard.css';

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Soporte de empaquetado seguro para jspdf-autotable
if (typeof autoTable !== 'function') {
    var safeAutoTable = autoTable.default || window.jspdfAutoTable;
} else {
    var safeAutoTable = autoTable;
}

const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        search: <circle cx="11" cy="11" r="8"></circle>,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>,
        trash: <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
        fileText: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>,
        download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4M7 10l5 5 5-5M12 15V3" />
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function Facturas() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [facturas, setFacturas] = useState([]);
    const [empresaDatos, setEmpresaDatos] = useState(null); // <--- Estado para guardar los datos de la API Empresa
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const API_URL = ENDPOINTS.facturas || ENDPOINTS.facturasProv || ENDPOINTS.facturasProveedor || ENDPOINTS.facturas_proveedor;
    
    // Ruta dinámica basada en tu archivo central de endpoints, o la por defecto de la app
    const EMPRESA_API_URL = ENDPOINTS.empresas;

    const normalizeFacturasData = (rawData) => {
        if (!rawData) return [];
        const payload = Array.isArray(rawData) ? rawData : (rawData.results || rawData.data || rawData.facturas || []);
        return Array.isArray(payload) ? payload : [];
    };

    // Carga síncrona paralela de Facturas y Datos de la Empresa Matriz
    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Token ${token}`;

            // 1. Cargar Facturas
            const resFacturas = await fetch(API_URL, { headers });
            if (resFacturas.ok) {
                const dataFacturas = await resFacturas.json();
                setFacturas(normalizeFacturasData(dataFacturas));
            } else {
                throw new Error("Error al consultar el catálogo de facturas.");
            }

            // 2. Cargar datos fiscales de la Empresa
            try {
                const resEmpresa = await fetch(EMPRESA_API_URL, { headers });
                if (resEmpresa.ok) {
                    const dataEmpresa = await resEmpresa.json();
                    setEmpresaDatos(dataEmpresa);
                }
            } catch (empErr) {
                console.error("No se pudo obtener datos fiscales de la API Empresa, usando plantilla por defecto:", empErr);
            }

        } catch (err) {
            console.error(err);
            setError("No se pudo sincronizar la información del servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        loadInitialData();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta factura de forma permanente?')) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { method: 'DELETE', headers: {} };
            if (token) headers.headers['Authorization'] = `Token ${token}`;
            await fetch(`${API_URL}${id}/`, headers);
            loadInitialData();
        } catch (e) {
            alert("Error al eliminar la factura");
        }
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

    const generarPDF = (factura) => {
        try {
            const doc = new jsPDF();

            // Mapeo dinámico: Si la API falló u omitió campos, activa el respaldo automático (fallback)
            const infoEmpresa = {
                nombre: (empresaDatos?.nombre || "PRODUCTOS SNZ S.A. DE C.V.").toUpperCase(),
                rfc: (empresaDatos?.rfc || "PSNZ900101ABC").toUpperCase(),
                direccion: empresaDatos?.direccion || "Av. de la Industria #450, Parque Industrial",
                telefono: empresaDatos?.telefono || "+52 (351) 123-4567",
                correo: empresaDatos?.correo || "finanzas@snz.com"
            };

            // Estructura visual del PDF
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, 210, 40, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text(infoEmpresa.nombre, 15, 18);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`RFC: ${infoEmpresa.rfc} | Tel: ${infoEmpresa.telefono} | Correo: ${infoEmpresa.correo}`, 15, 26);
            doc.text(infoEmpresa.direccion, 15, 32);

            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("COMPROBANTE DE FACTURA DE PROVEEDOR", 15, 55);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`ID Control Interno: #${factura?.id || 'N/A'}`, 15, 63);
            doc.text(`Número de Factura: ${factura?.numero || 'S/N'}`, 15, 69);
            
            doc.text(`Fecha Emisión: ${formatDate(factura?.fecha)}`, 130, 63);
            doc.text(`Fecha Vencimiento: ${formatDate(factura?.fecha_vencimiento)}`, 130, 69);

            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.rect(15, 78, 180, 28, "FD");

            doc.setFont("helvetica", "bold");
            doc.text("INFORMACIÓN DEL PROVEEDOR", 20, 84);
            doc.setFont("helvetica", "normal");
            doc.text(`Razón Social: ${factura?.nombre_proveedor || 'Sin Proveedor Vinculado'}`, 20, 91);
            doc.text(`ID Cuenta en Sistema: #${factura?.proveedor || 'N/A'}`, 20, 97);

            const cuerpoTabla = [
                [
                    `Cargos operativos generales correspondientes al documento de facturación externa número ${factura?.numero || 'S/N'}.`,
                    `1`, 
                    formatMonto(factura?.total), 
                    formatMonto(factura?.total)
                ]
            ];

            safeAutoTable(doc, {
                startY: 115,
                head: [['Descripción del Concepto', 'Cant.', 'Precio Unitario', 'Importe Neto']],
                body: cuerpoTabla,
                headStyles: { fillColor: [47, 85, 151], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 100 },
                    1: { cellWidth: 15, halign: 'center' },
                    2: { cellWidth: 32, halign: 'right' },
                    3: { cellWidth: 33, halign: 'right' }
                },
                theme: 'striped'
            });

            let finalY = (doc.lastAutoTable?.finalY || 120) + 12;

            doc.setFont("helvetica", "normal");
            doc.text("Subtotal:", 135, finalY);
            doc.text(formatMonto(factura?.total), 195, finalY, { align: "right" });

            doc.setFont("helvetica", "bold");
            doc.text("TOTAL:", 135, finalY + 7);
            doc.text(formatMonto(factura?.total), 195, finalY + 7, { align: "right" });

            doc.setTextColor(185, 28, 28);
            doc.text("SALDO PENDIENTE:", 135, finalY + 14);
            doc.text(formatMonto(factura?.saldo_pendiente), 195, finalY + 14, { align: "right" });

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text("Este documento es una representación impresa digital para el control interno de proveedores de la empresa.", 15, 280);

            doc.save(`Factura_${factura?.numero || factura?.id || 'Generica'}.pdf`);
            
        } catch (pdfError) {
            console.error("Error al procesar el PDF:", pdfError);
            alert(`No se pudo procesar la descarga: ${pdfError.message}`);
        }
    };

    const filteredFacturas = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return facturas;
        return facturas.filter(item => {
            const numFactura = String(item.numero || '').toLowerCase();
            const nomProveedor = String(item.nombre_proveedor || '').toLowerCase();
            return numFactura.includes(query) || nomProveedor.includes(query);
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
                        <h1>Control de Cuentas - {empresaDatos?.nombre || 'Proveedores SNZ'}</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">
                        <div className="section-header">
                            <div>
                                <h2>Facturas de Proveedores</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                    Control de saldos e historial de entradas vinculadas a <strong>{empresaDatos?.nombre || 'la Empresa'}</strong>
                                </p>
                            </div>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Registrar Factura</span>
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', gap: '10px' }}>
                                <Icon name="search" />
                                <input
                                    id="facturas-search"
                                    type="text"
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Buscar por número de factura o proveedor..."
                                    style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: "#111827", fontSize: "0.95rem" }}
                                />
                            </div>
                        </div>

                        {error && <div style={{ padding: '12px', marginBottom: "16px", color: "#b91c1c", backgroundColor: '#fef2f2', borderRadius: '8px', fontWeight: "500", fontSize: '0.9rem' }}>⚠️ {error}</div>}

                        <div className="data-card">
                            <div className="table-wrapper">
                                <table className="personal-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '80px' }}>ID</th>
                                            <th>No. Factura</th>
                                            <th>Proveedor</th>
                                            <th style={{ textAlign: "center" }}>Fecha Emisión</th>
                                            <th style={{ textAlign: "center" }}>Fecha Vencimiento</th>
                                            <th style={{ textAlign: "right" }}>Monto Total</th>
                                            <th style={{ textAlign: "right" }}>Saldo Pendiente</th>
                                            <th style={{ textAlign: "center", width: '120px' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Sincronizando registros con el servidor...</td></tr>
                                        ) : filteredFacturas.length === 0 ? (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No se encontraron facturas registradas.</td></tr>
                                        ) : (
                                            filteredFacturas.map(item => (
                                                <tr key={item.id}>
                                                    <td><strong>#{item.id}</strong></td>
                                                    <td>
                                                        <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ color: '#64748b' }}><Icon name="fileText" /></span>
                                                            {item.numero}
                                                        </span>
                                                    </td>
                                                    <td><span className="user-name" style={{ fontWeight: '500' }}>{item.nombre_proveedor || 'Sin Proveedor'}</span></td>
                                                    <td style={{ textAlign: "center", fontSize: '0.9rem' }}>{formatDate(item.fecha)}</td>
                                                    <td style={{ textAlign: "center", fontSize: '0.9rem' }}>
                                                        <span style={{
                                                            color: new Date(item.fecha_vencimiento) < new Date() && parseFloat(item.saldo_pendiente) > 0 ? '#b91c1c' : '#334155',
                                                            fontWeight: new Date(item.fecha_vencimiento) < new Date() && parseFloat(item.saldo_pendiente) > 0 ? '600' : '400'
                                                        }}>{formatDate(item.fecha_vencimiento)}</span>
                                                    </td>
                                                    <td style={{ textAlign: "right", color: '#475569', fontWeight: '600' }}>{formatMonto(item.total)}</td>
                                                    <td style={{ textAlign: "right", color: parseFloat(item.saldo_pendiente) > 0 ? '#b91c1c' : '#047857', fontWeight: '700', fontSize: '1rem' }}>{formatMonto(item.saldo_pendiente)}</td>
                                                    <td className="actions-cell" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                        <button className="btn-icon edit" style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }} onClick={() => generarPDF(item)} title="Descargar Comprobante PDF"><Icon name="download" /></button>
                                                        <button className="btn-icon delete" onClick={() => handleDelete(item.id)} title="Eliminar factura"><Icon name="trash" /></button>
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

            {showModal && <FormFactura onClose={() => setShowModal(false)} onRefresh={loadInitialData} />}
        </div>
    );
}