import React, { useState, useEffect } from 'react';
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas
import FormNomina from './formNomina';
import './nomina.css';

const Icon = ({ name }) => {
    const icons = {
        eye: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>,
        plus: <path d="M12 5v14M5 12h14" />,
        back: <path d="M19 12H5M12 19l-7-7 7-7" />,
        play: <path d="M5 3l14 9-14 9V3z"></path> // Icono para procesar/generar
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function Nomina() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [view, setView] = useState('list');
    const [nominas, setNominas] = useState([]);
    const [selectedNomina, setSelectedNomina] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false); // Nuevo estado

    // 1. CARGAR LISTA DE NÓMINAS DESDE DJANGO
    const fetchNominas = async () => {
        setLoading(true);
        try {
            const response = await fetch(ENDPOINTS.nominas);
            const data = await response.json();
            setNominas(data);
        } catch (error) {
            console.error("Error al cargar nóminas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNominas();
    }, []);

    // 2. CARGAR EL DESGLOSE DE EMPLEADOS DE UNA NÓMINA ESPECÍFICA
    const handleVerDetalle = async (nom) => {
        setLoading(true);
        try {
            // Suponiendo que tu Serializer de Nomina ya incluye los 'detalles'
            const response = await fetch(`http://localhost:8000/apiNom/nominas/${nom.id}/`);
            const data = await response.json();
            setSelectedNomina(data); // data ahora tiene la info de la nómina + array de detalles
            setView('detail');
        } catch (error) {
            alert("No se pudo cargar el detalle de la nómina");
        } finally {
            setLoading(false);
        }
    };

    // 3. DISPARAR EL CÁLCULO (EL BOTÓN "GENERAR" QUE CREAMOS EN DJANGO)
    const handleGenerarCalculo = async (id) => {
        if (!window.confirm("¿Deseas procesar los pagos de esta semana?")) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/apiNom/nominas/${id}/calcular/`, {
                method: 'POST'
            });
            if (response.ok) {
                alert("Nómina procesada con éxito");
                fetchNominas(); // Refrescar lista
            }
        } catch (error) {
            alert("Error al procesar el cálculo");
        } finally {
            setLoading(false);
        }
    };

    const getEsquemaPago = (det) => {
        if (det.monto_destajos > 0) return 'Destajo';
        if (det.monto_horas_extra > 0) return 'Horas';
        return 'Fijo';
    };

    const formatMoney = (val) => `$${parseFloat(val || 0).toFixed(2)}`;

    return (
        <div className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''}`}>
            <Sidebar collapsed={isCollapsed} />
            <main className="pro-main">
                <header className="pro-top-nav">
                    <div className="header-left">
                        <button className="menu-hamburger" onClick={() => setIsCollapsed(!isCollapsed)}>
                            <SidebarIcon name="menu" />
                        </button>
                        <h1>Nóminas</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">

                        <div className="section-header">
                            <div className="header-text">
                                <h2>{view === 'list' ? "Historial de Semanas" : `Detalle: ${selectedNomina.descripcion}`}</h2>
                                {view === 'detail' && <p>Periodo: {selectedNomina.fecha_inicio} al {selectedNomina.fecha_fin}</p>}
                            </div>
                            {view === 'list' ? (
                                <button className="btn-add" onClick={() => setShowModal(true)}>
                                    <Icon name="plus" /> <span>Nueva Semana</span>
                                </button>
                            ) : (
                                <button className="btn-filter" onClick={() => setView('list')}>
                                    <Icon name="back" /> <span>Volver</span>
                                </button>
                            )}
                        </div>

                        <div className="data-card">
                            <div className="table-wrapper">
                                {loading ? (
                                    <div style={{ padding: '40px', textAlign: 'center' }}>Procesando datos...</div>
                                ) : (
                                    <table className="personal-table">
                                        {view === 'list' ? (
                                            <>
                                                <thead>
                                                    <tr>
                                                        <th>Descripción</th>
                                                        <th>Estado</th>
                                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {nominas.map(nom => (
                                                        <tr key={nom.id}>
                                                            <td className="user-name">{nom.descripcion}</td>
                                                            <td>
                                                                <span className={`status-pill ${nom.estado === 'CERRADA' ? 'activo' : 'permiso'}`}>
                                                                    {nom.estado}
                                                                </span>
                                                            </td>
                                                            <td className="actions-cell">
                                                                <button className="btn-icon edit" title="Ver Desglose" onClick={() => handleVerDetalle(nom)}>
                                                                    <Icon name="eye" />
                                                                </button>
                                                                {nom.estado === 'ABIERTA' && (
                                                                    <button className="btn-icon" title="Generar Pagos" style={{ color: '#15803d' }} onClick={() => handleGenerarCalculo(nom.id)}>
                                                                        <Icon name="play" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </>
                                        ) : (
                                            <>
                                                <thead>
                                                    <tr>
                                                        <th>Empleado</th>
                                                        <th>Esquema</th>
                                                        <th>Sueldo Base</th>
                                                        <th>Destajos</th>
                                                        <th>Horas Extra</th>
                                                        <th>Bonos</th>
                                                        <th>Total Neto</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedNomina.detalles?.map(det => (
                                                        <tr key={det.id}>
                                                            <td className="user-name">
                                                                {det.empleado?.nombre_completo || "Empleado no identificado"}
                                                            </td>
                                                            <td>{getEsquemaPago(det)}</td>
                                                            <td>{formatMoney(det.monto_fijo)}</td>
                                                            <td style={{ color: '#2563eb', fontWeight: 'bold' }}>{formatMoney(det.monto_destajos)}</td>
                                                            <td>{formatMoney(det.monto_horas_extra)}</td>
                                                            <td>{formatMoney(det.monto_bonos)}</td>
                                                            <td><span className="status-pill activo" style={{ fontSize: '0.9rem' }}>{formatMoney(det.total_neto)}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </>
                                        )}
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {showModal && (
                <FormNomina
                    onClose={() => setShowModal(false)}
                    onRefresh={fetchNominas}
                />
            )}
        </div>
    );
}