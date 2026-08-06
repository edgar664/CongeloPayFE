import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Components/Sidebar';
import { useCompany } from '../Context/CompanyContext'; // Inyección del contexto de empresa
import { Icon } from '../Components/Icon';
import './dashboard.css';

export default function Dashboard() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Contexto de la empresa para personalizar datos, nombre y colores
    const { company } = useCompany();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login'; 
    };

    return (
        <div 
            className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''} ${menuOpen ? 'menu-open' : ''}`}
            style={{
                '--primary-theme': company.color_primario || '#1B2A52',
                '--secondary-theme': company.color_secundario || '#2E7D32'
            }}
        >
            {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

            {/* SIDEBAR CONTEXTUALIZADA */}
            <Sidebar 
                collapsed={isCollapsed} 
                setCollapsed={setIsCollapsed} 
                handleLogout={handleLogout} 
            />

            <main className="pro-main">
                {/* ENCABEZADO CONTEXTUAL CON DATOS DE LA EMPRESA */}
                <header className="pro-top-nav">
                    <div className="header-left">
                        <div className="page-title">
                            <h1>Monitoreo de Producción - Frambuesa</h1>
                            <p>
                                {company.nombre_comercial || 'Sano y Nutritivo Zamora'} &mdash; {company.subtitulo || 'Control de Túneles IQF y Calidad'}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    {/* TARJETAS DE KPIS PRINCIPALES DE PROCESAMIENTO */}
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">FRAMBUESA PROCESADA (HOY)</span>
                                <Icon name="box" />
                            </div>
                            <div className="p-card-body">
                                <h2>8,450 <small>kg</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TEMP. MEDIA TÚNEL IQF</span>
                                <Icon name="thermometer" />
                            </div>
                            <div className="p-card-body">
                                <h2>-38.5 <small>°C</small></h2>
                            </div>
                        </div>

                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">RENDIMIENTO MATERIA PRIMA</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>92.4%</h2>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN DE DETALLES Y ALERTAS DE LA PLANTA */}
                    <div className="pro-grid">
                        {/* TABLA DE LOTES Y CALIDAD */}
                        <div className="pro-card">
                            <div className="card-header">Lotes en Proceso e Inocuidad</div>
                            <div className="table-res">
                                <table className="pro-table">
                                    <thead>
                                        <tr>
                                            <th>ID Lote</th>
                                            <th>Variedad</th>
                                            <th>Kilos</th>
                                            <th>Calidad / Calibre</th>
                                            <th>Estatus</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>LT-FRA-001</td>
                                            <td>Heritage</td>
                                            <td>3,500 kg</td>
                                            <td>IQF - Primera</td>
                                            <td><span className="st-badge active">Congelado</span></td>
                                        </tr>
                                        <tr>
                                            <td>LT-FRA-002</td>
                                            <td>Amira</td>
                                            <td>2,800 kg</td>
                                            <td>IQF - Primera</td>
                                            <td><span className="st-badge active">En Túnel</span></td>
                                        </tr>
                                        <tr>
                                            <td>LT-FRA-003</td>
                                            <td>Malling Freya</td>
                                            <td>2,150 kg</td>
                                            <td>Bloque / Pulpa</td>
                                            <td><span className="st-badge warning">En Selección</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ALERTAS CRÍTICAS Y CONTROL DE CALIDAD */}
                        <div className="pro-card">
                            <div className="card-header">Alertas de Planta y Calidad</div>
                            <div className="pro-alerts">
                                <div className="alert-box critical">
                                    <strong>Variación de Temp:</strong> Cámara de conservación 02 muestra fluctuación cercana a -18°C. REVISAR.
                                </div>
                                <div className="alert-box info">
                                    <strong>Control de Calidad:</strong> Próximo muestreo microbiológico de bandas de selección a las 16:00 hrs.
                                </div>
                                <div className="alert-box info">
                                    <strong>Inocuidad:</strong> Auditoría de sanitización programada para Turno Nocturno.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}