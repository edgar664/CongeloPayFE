import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Icon } from '../Components/Sidebar'; // Importamos tus componentes
import './dashboard.css';

export default function Dashboard() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

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

    const toggleMenu = () => {
        if (window.innerWidth <= 1024) setMenuOpen(!menuOpen);
        else setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''} ${menuOpen ? 'menu-open' : ''}`}>
            
            {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

            {/* SIDEBAR */}
            <Sidebar collapsed={isCollapsed} handleLogout={handleLogout} />

            <main className="pro-main">
                <header className="pro-top-nav">
                    <div className="header-left">
                        <button className="menu-hamburger" onClick={toggleMenu}>
                            <Icon name={menuOpen ? "close" : "menu"} />
                        </button>
                        <div className="page-title">
                            <h1>Monitoreo de Producción - Frambuesa</h1>
                            <p>Congeladora SNZ - Control de Túneles y Calidad</p>
                        </div>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    {/* TARJETAS DE SPRINT / KPIS PRINCIPALES */}
                    <section className="pro-stats">
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">FRAMBUESA PROCESADA (HOY)</span>
                                <Icon name="box" /> {/* Puedes cambiarlo por un icono de báscula/fruta si tienes */}
                            </div>
                            <div className="p-card-body">
                                <h2>8,450 <small>kg</small></h2>
                            </div>
                        </div>
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">TEMP. MEDIA TÚNEL IQF</span>
                                <Icon name="thermometer" /> {/* O el nombre de icono de temperatura que uses */}
                            </div>
                            <div className="p-card-body">
                                <h2>-38.5 <small>°C</small></h2>
                            </div>
                        </div>
                        <div className="p-card">
                            <div className="p-card-head">
                                <span className="label">RENDIMIENTO DE MATERIA PRIMA</span>
                                <Icon name="chart" />
                            </div>
                            <div className="p-card-body">
                                <h2>92.4%</h2>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN DE DETALLES Y ALERTAS DE LA PLANTA */}
                    <div className="pro-grid">
                        {/* TABLA DE LOTES DE FRAMBUESA */}
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
                                            <td>3,500</td>
                                            <td>IQF - Primera</td>
                                            <td><span className="st-badge active">Congelado</span></td>
                                        </tr>
                                        <tr>
                                            <td>LT-FRA-002</td>
                                            <td>Amira</td>
                                            <td>2,800</td>
                                            <td>IQF - Primera</td>
                                            <td><span className="st-badge active">En Túnel</span></td>
                                        </tr>
                                        <tr>
                                            <td>LT-FRA-003</td>
                                            <td>Malling Freya</td>
                                            <td>2,150</td>
                                            <td>Bloque / Pulpa</td>
                                            <td><span className="st-badge warning">En Selección</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ALERTAS CRÍTICAS DE LA CONGELADORA */}
                        <div className="pro-card">
                            <div className="card-header">Alertas de Planta y Calidad</div>
                            <div className="pro-alerts">
                                <div className="alert-box critical">
                                    <strong>Variación de Temp:</strong> Cámara de conservación 02 muestra fluctuación cercana a -18°C. REVISAR.
                                </div>
                                <div className="alert-box info">
                                    <strong>Control de Calidad:</strong> Próximo muestreo microbiológico de bandas de selección a las 16:00 hrs.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}