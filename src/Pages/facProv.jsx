import React, { useEffect, useMemo, useState } from "react";
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import FormFactura from './formFacturaProv';
import { ENDPOINTS } from '../api';
import './personal.css';
import './dashboard.css';

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
        download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4M7 10l5 5 5-5M12 15V3" />,
        arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

const dibujarPlaceholderLogo = (doc, infoEmpresa, colorAcento, marginX) => {
    const iniciales = infoEmpresa.nombre.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('') || 'SNZ';
    doc.setFillColor(...colorAcento);
    doc.roundedRect(marginX, 9, 20, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(iniciales.substring(0, 3), marginX + 10, 21, { align: "center" });
};

export default function Facturas() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [facturas, setFacturas] = useState([]);
    const [empresaDatos, setEmpresaDatos] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // ESTADO CLAVE: Guarda el ID o Nombre del proveedor seleccionado para ver sus detalles
    const [selectedProveedor, setSelectedProveedor] = useState(null);

    const API_URL = ENDPOINTS.facturas || ENDPOINTS.facturasProv || ENDPOINTS.facturasProveedor || ENDPOINTS.facturas_proveedor;
    const EMPRESA_API_URL = ENDPOINTS.empresas;

    const normalizeFacturasData = (rawData) => {
        if (!rawData) return [];
        const payload = Array.isArray(rawData) ? rawData : (rawData.results || rawData.data || rawData.facturas || []);
        return Array.isArray(payload) ? payload : [];
    };

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Token ${token}`;

            const resFacturas = await fetch(API_URL, { headers });
            if (resFacturas.ok) {
                const dataFacturas = await resFacturas.json();
                setFacturas(normalizeFacturasData(dataFacturas));
            } else {
                throw new Error("Error al consultar el catálogo de facturas.");
            }

            try {
                const resEmpresa = await fetch(EMPRESA_API_URL, { headers });
                if (resEmpresa.ok) {
                    const dataEmpresa = await resEmpresa.json();
                    setEmpresaDatos(dataEmpresa);
                }
            } catch (empErr) {
                console.error("No se pudo obtener datos fiscales de la API Empresa:", empErr);
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
        return isNaN(value) ? '$0.00' : `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return dateStr.split('-').reverse().join('/');
    };

    const cargarLogoComoDataURL = async (logoSrc) => {
        if (!logoSrc) return null;
        try {
            if (logoSrc.startsWith('data:image')) return logoSrc;
            const response = await fetch(logoSrc, { mode: 'cors' });
            if (!response.ok) throw new Error('No se pudo descargar el logo');
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return null;
        }
    };

    const generarPDF = async (factura) => {
        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const marginX = 15;
            const contentWidth = pageWidth - marginX * 2;

            const colorPrimario = [30, 41, 59];
            const colorAcento = [37, 99, 235];
            const colorTextoSuave = [100, 116, 139];
            const colorBorde = [226, 232, 240];
            const colorFondoSuave = [248, 250, 252];
            const colorRojo = [185, 28, 28];
            const colorVerde = [4, 120, 87];

            const infoEmpresa = {
                nombre: (empresaDatos?.nombre || "PRODUCTOS SNZ S.A. DE C.V.").toUpperCase(),
                rfc: (empresaDatos?.rfc || "PSNZ900101ABC").toUpperCase(),
                direccion: empresaDatos?.direccion || "Av. de la Industry #450, Parque Industrial",
                telefono: empresaDatos?.telefono || "+52 (351) 123-4567",
                correo: empresaDatos?.correo || "finanzas@snz.com"
            };

            const total = parseFloat(factura?.total) || 0;
            const saldoPendiente = parseFloat(factura?.saldo_pendiente ?? total) || 0;
            const pagado = total - saldoPendiente;

            const IVA_RATE = 0.16;
            const subtotal = total / (1 + IVA_RATE);
            const iva = total - subtotal;

            const estatus = saldoPendiente <= 0
                ? { label: 'PAGADA', color: colorVerde }
                : (factura?.fecha_vencimiento && new Date(factura.fecha_vencimiento) < new Date())
                    ? { label: 'VENCIDA', color: colorRojo }
                    : { label: 'PENDIENTE', color: [180, 130, 20] };

            doc.setFillColor(...colorPrimario);
            doc.rect(0, 0, pageWidth, 38, "F");

            const logoSrc = empresaDatos?.logo
                ? (empresaDatos.logo.startsWith('http') ? empresaDatos.logo : `${BASE_API_URL}${empresaDatos.logo}`)
                : null;
            const logoDataURL = await cargarLogoComoDataURL(logoSrc);

            if (logoDataURL) {
                try {
                    const formato = logoDataURL.substring(11, 14).toUpperCase().includes('PNG') ? 'PNG' : 'JPEG';
                    doc.setFillColor(255, 255, 255);
                    doc.roundedRect(marginX, 9, 20, 20, 3, 3, "F");
                    doc.addImage(logoDataURL, formato, marginX + 1.5, 10.5, 17, 17, undefined, 'FAST');
                } catch (imgErr) {
                    dibujarPlaceholderLogo(doc, infoEmpresa, colorAcento, marginX);
                }
            } else {
                dibujarPlaceholderLogo(doc, infoEmpresa, colorAcento, marginX);
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text(infoEmpresa.nombre, marginX + 26, 16);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.text(`RFC: ${infoEmpresa.rfc}`, marginX + 26, 22);
            doc.text(`${infoEmpresa.direccion}`, marginX + 26, 27);
            doc.text(`Tel: ${infoEmpresa.telefono}   •   ${infoEmpresa.correo}`, marginX + 26, 32);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.text("FACTURA", pageWidth - marginX, 17, { align: "right" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`No. ${factura?.numero || 'S/N'}`, pageWidth - marginX, 24, { align: "right" });
            doc.setFontSize(8);
            doc.text(`Folio interno: #${factura?.id || 'N/A'}`, pageWidth - marginX, 29, { align: "right" });

            let y = 46;
            doc.setFillColor(...estatus.color);
            doc.roundedRect(pageWidth - marginX - 32, y - 5.5, 32, 7, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(estatus.label, pageWidth - marginX - 16, y - 0.8, { align: "center" });

            doc.setTextColor(...colorPrimario);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Comprobante de Factura de Proveedor", marginX, y);

            y += 8;
            const boxHeight = 30;
            const boxWidth = (contentWidth - 6) / 2;

            doc.setDrawColor(...colorBorde);
            doc.setFillColor(...colorFondoSuave);
            doc.roundedRect(marginX, y, boxWidth, boxHeight, 2, 2, "FD");
            doc.setTextColor(...colorTextoSuave);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.text("PROVEEDOR", marginX + 5, y + 6);

            doc.setTextColor(...colorPrimario);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(String(factura?.nombre_proveedor || 'Sin Proveedor Vinculado'), marginX + 5, y + 13);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(...colorTextoSuave);
            doc.text(`ID Cuenta en Sistema: #${factura?.proveedor || 'N/A'}`, marginX + 5, y + 19);
            doc.text(`Referencia interna: FAC-${String(factura?.id || '0').padStart(5, '0')}`, marginX + 5, y + 25);

            const box2X = marginX + boxWidth + 6;
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(box2X, y, boxWidth, boxHeight, 2, 2, "FD");
            doc.setTextColor(...colorTextoSuave);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.text("DETALLES DE PAGO", box2X + 5, y + 6);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(...colorPrimario);
            doc.text(`Fecha de emisión:`, box2X + 5, y + 13);
            doc.text(`${formatDate(factura?.fecha)}`, box2X + boxWidth - 5, y + 13, { align: "right" });
            doc.text(`Fecha de vencimiento:`, box2X + 5, y + 19);
            doc.text(`${formatDate(factura?.fecha_vencimiento)}`, box2X + boxWidth - 5, y + 19, { align: "right" });
            doc.text(`Forma de pago:`, box2X + 5, y + 25);
            doc.text(`${factura?.forma_pago || 'Transferencia'}`, box2X + boxWidth - 5, y + 25, { align: "right" });

            y += boxHeight + 10;
            const cuerpoTabla = [
                [
                    `Cargos operativos generales correspondientes al documento de facturación externa número ${factura?.numero || 'S/N'}.`,
                    `1`,
                    formatMonto(subtotal),
                    `16%`,
                    formatMonto(subtotal)
                ]
            ];

            safeAutoTable(doc, {
                startY: y,
                margin: { left: marginX, right: marginX },
                head: [['Descripción del Concepto', 'Cant.', 'Precio Unit.', 'IVA', 'Importe']],
                body: cuerpoTabla,
                headStyles: { fillColor: colorPrimario, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
                bodyStyles: { fontSize: 8.5, textColor: colorPrimario, cellPadding: 3 },
                alternateRowStyles: { fillColor: colorFondoSuave },
                columnStyles: {
                    0: { cellWidth: contentWidth - 15 - 28 - 18 - 30 },
                    1: { cellWidth: 15, halign: 'center' },
                    2: { cellWidth: 28, halign: 'right' },
                    3: { cellWidth: 18, halign: 'center' },
                    4: { cellWidth: 30, halign: 'right' }
                },
                theme: 'grid'
            });

            let finalY = (doc.lastAutoTable?.finalY || y + 20) + 8;
            const totalsBoxWidth = 75;
            const totalsX = pageWidth - marginX - totalsBoxWidth;

            doc.setDrawColor(...colorBorde);
            doc.setFontSize(9);

            const renderTotalRow = (label, value, opts = {}) => {
                doc.setFont("helvetica", opts.bold ? "bold" : "normal");
                doc.setTextColor(...(opts.color || colorPrimario));
                doc.text(label, totalsX, finalY);
                doc.text(value, pageWidth - marginX, finalY, { align: "right" });
                finalY += 6.5;
            };

            renderTotalRow("Subtotal:", formatMonto(subtotal));
            renderTotalRow("IVA (16%):", formatMonto(iva));

            doc.setDrawColor(...colorPrimario);
            doc.line(totalsX, finalY - 3, pageWidth - marginX, finalY - 3);

            renderTotalRow("TOTAL:", formatMonto(total), { bold: true });
            if (pagado > 0) {
                renderTotalRow("Pagos aplicados:", `- ${formatMonto(pagado)}`, { color: colorVerde });
            }

            doc.setFillColor(saldoPendiente > 0 ? 254 : 236, saldoPendiente > 0 ? 242 : 253, saldoPendiente > 0 ? 242 : 245);
            doc.roundedRect(totalsX - 5, finalY - 4.5, totalsBoxWidth + 5, 10, 2, 2, "F");
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...(saldoPendiente > 0 ? colorRojo : colorVerde));
            doc.setFontSize(10);
            doc.text("SALDO PENDIENTE:", totalsX, finalY + 1.5);
            doc.text(formatMonto(saldoPendiente), pageWidth - marginX, finalY + 1.5, { align: "right" });

            let notasY = finalY + 18;
            doc.setDrawColor(...colorBorde);
            doc.line(marginX, notasY, marginX + (contentWidth - totalsBoxWidth - 10), notasY);
            let YM = notasY + 6;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...colorTextoSuave);
            doc.text("CONDICIONES Y NOTAS", marginX, YM);
            YM += 5;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.8);
            doc.setTextColor(...colorPrimario);
            const notas = [
                "• Favor de conservar este comprobante para efectos de conciliación con el proveedor.",
                "• Cualquier aclaración sobre montos o vencimientos deberá notificarse dentro de los 5 días hábiles siguientes.",
                factura?.notas ? `• Nota adicional: ${factura.notas}` : null
            ].filter(Boolean);
            notas.forEach(linea => { doc.text(linea, marginX, YM); YM += 4.5; });

            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setDrawColor(...colorBorde);
            doc.line(marginX, pageHeight - 18, pageWidth - marginX, pageHeight - 18);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.5);
            doc.setTextColor(...colorTextoSuave);
            doc.text("Este documento es una representación impresa digital para el control interno de proveedores de la empresa.", marginX, pageHeight - 12);
            doc.text(`Generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`, marginX, pageHeight - 8);
            doc.text("Página 1 de 1", pageWidth - marginX, pageHeight - 8, { align: "right" });

            doc.save(`Factura_${factura?.numero || factura?.id || 'Generica'}.pdf`);
        } catch (pdfError) {
            alert(`No se pudo procesar la descarga: ${pdfError.message}`);
        }
    };

    // LÓGICA DE AGRUPACIÓN: Obtiene la lista resumida de proveedores con sus respectivos saldos totales
    const proveedoresAgrupados = useMemo(() => {
        const provMap = {};
        facturas.forEach(f => {
            const name = f.nombre_proveedor || "Sin Proveedor";
            const idProv = f.proveedor || "N/A";
            const saldo = parseFloat(f.saldo_pendiente) || 0;
            const total = parseFloat(f.total) || 0;

            if (!provMap[name]) {
                provMap[name] = {
                    nombre: name,
                    idProveedor: idProv,
                    totalFacturas: 0,
                    saldoPendiente: 0,
                    montoTotal: 0
                };
            }
            provMap[name].totalFacturas += 1;
            provMap[name].saldoPendiente += saldo;
            provMap[name].montoTotal += total;
        });

        const list = Object.values(provMap);
        const query = search.trim().toLowerCase();
        if (!query) return list;
        return list.filter(p => p.nombre.toLowerCase().includes(query));
    }, [facturas, search]);

    // FILTRO DE DETALLE: Si hay un proveedor seleccionado, filtra solo sus facturas
    const facturasDelProveedorSelected = useMemo(() => {
        if (!selectedProveedor) return [];
        return facturas.filter(f => (f.nombre_proveedor || "Sin Proveedor") === selectedProveedor);
    }, [facturas, selectedProveedor]);

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

                        {/* ENCABEZADO DINÁMICO */}
                        <div className="section-header">
                            <div>
                                {selectedProveedor ? (
                                    <>
                                        <button
                                            onClick={() => setSelectedProveedor(null)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
                                        >
                                            <Icon name="arrowLeft" /> Volver a Proveedores
                                        </button>
                                        <h2>Facturas de: {selectedProveedor}</h2>
                                    </>
                                ) : (
                                    <>
                                        <h2>Resumen de Saldos por Proveedor</h2>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                            Haga clic en un proveedor para auditar y ver su desglose de facturas.
                                        </p>
                                    </>
                                )}
                            </div>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Registrar Factura</span>
                            </button>
                        </div>

                        {/* BUSCADOR (Solo se muestra en la vista global) */}
                        {!selectedProveedor && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', gap: '10px' }}>
                                    <Icon name="search" />
                                    <input
                                        id="facturas-search"
                                        type="text"
                                        value={search}
                                        onChange={event => setSearch(event.target.value)}
                                        placeholder="Buscar proveedor..."
                                        style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: "#111827", fontSize: "0.95rem" }}
                                    />
                                </div>
                            </div>
                        )}

                        {error && <div style={{ padding: '12px', marginBottom: "16px", color: "#b91c1c", backgroundColor: '#fef2f2', borderRadius: '8px', fontWeight: "500", fontSize: '0.9rem' }}>⚠️ {error}</div>}

                        <div className="data-card">
                            <div className="table-wrapper">

                                {/* PANTALLA 1: TABLA GENERAL DE PROVEEDORES */}
                                {!selectedProveedor ? (
                                    <table className="personal-table">
                                        <thead>
                                            <tr>
                                                <th>Proveedor</th>
                                                <th style={{ textAlign: "center" }}>No. Facturas</th>
                                                <th style={{ textAlign: "right" }}>Monto Total Comprado</th>
                                                <th style={{ textAlign: "right" }}>Saldo Pendiente Total</th>
                                                <th style={{ textAlign: "center", width: '150px' }}>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Sincronizando registros...</td></tr>
                                            ) : proveedoresAgrupados.length === 0 ? (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No se encontraron proveedores.</td></tr>
                                            ) : (
                                                proveedoresAgrupados.map(prov => (
                                                    <tr key={prov.nombre}>
                                                        <td>
                                                            <span className="user-name" style={{ fontWeight: '600', color: '#1e293b' }}>
                                                                {prov.nombre}
                                                            </span>
                                                            <small style={{ display: 'block', color: '#64748b', fontSize: '0.75rem' }}>ID Cuenta: #{prov.idProveedor}</small>
                                                        </td>
                                                        <td style={{ textAlign: "center", fontWeight: '500' }}>{prov.totalFacturas}</td>
                                                        <td style={{ textAlign: "right", color: '#475569' }}>{formatMonto(prov.montoTotal)}</td>
                                                        <td style={{ textAlign: "right", color: prov.saldoPendiente > 0 ? '#b91c1c' : '#047857', fontWeight: '700' }}>
                                                            {formatMonto(prov.saldoPendiente)}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            <button
                                                                className="btn-add"
                                                                style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#f1f5f9', color: '#2563eb', border: '1px solid #e2e8f0' }}
                                                                onClick={() => setSelectedProveedor(prov.nombre)}
                                                            >
                                                                Ver Facturas
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                ) : (

                                    /* PANTALLA 2: PANTALLA DETALLE CON SOLO SUS FACTURAS */
                                    <table className="personal-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '80px' }}>ID</th>
                                                <th>No. Factura</th>
                                                <th style={{ textAlign: "center" }}>Fecha Emisión</th>
                                                <th style={{ textAlign: "center" }}>Fecha Vencimiento</th>
                                                <th style={{ textAlign: "right" }}>Monto Total</th>
                                                <th style={{ textAlign: "right" }}>Saldo Pendiente</th>
                                                <th style={{ textAlign: "center", width: '120px' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {facturasDelProveedorSelected.map(item => (
                                                <tr key={item.id}>
                                                    <td><strong>#{item.id}</strong></td>
                                                    <td>
                                                        <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ color: '#64748b' }}><Icon name="fileText" /></span>
                                                            {item.numero}
                                                        </span>
                                                    </td>
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
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showModal && <FormFactura onClose={() => setShowModal(false)} onRefresh={loadInitialData} />}
        </div>
    );
}