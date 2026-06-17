import React, { useState, useEffect } from 'react';
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar'; 
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas
import FormEmp from './FormEmp'; 
import './personal.css';
import './dashboard.css';

const Icon = ({ name }) => {
    const icons = {
        plus: <path d="M12 5v14M5 12h14" />,
        search: <circle cx="11" cy="11" r="8"></circle>,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>,
        trash: <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>,
        'id-card': <path d="M3 7h18v10H3zM7 10h6M7 14h4" />,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
        close: <path d="M18 6L6 18M6 6l12 12" />
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function Personal() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [personalData, setPersonalData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCredential, setSelectedCredential] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const API_URL = ENDPOINTS.empleados;

    const fetchEmpleados = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            
            const finalData = Array.isArray(data) ? data : (data.results || []);
            setPersonalData(finalData);
            console.log("Datos recibidos en frontend:", finalData);
        } catch (error) { 
            console.error("Error al obtener empleados:", error); 
        } finally { 
            setLoading(false); 
        }
    };

    const getQrCodeUrl = (emp) => {
        // Usamos id_empleado (ej: SNZ0001) o el ID numérico por defecto
        const codigo = emp.id_empleado || emp.id;
        const payload = `empleado:${emp.id}:${emp.nombre || ''} ${emp.apellido || ''}:${codigo}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(payload)}`;
    };

    const filteredData = personalData.filter(emp => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        const values = [
            emp.id_empleado,
            emp.id?.toString(),
            emp.nombre,
            emp.apellido,
            emp.puesto?.nombre,
            typeof emp.puesto === 'string' ? emp.puesto : '',
            emp.departamento?.nombre,
            typeof emp.departamento === 'string' ? emp.departamento : '',
            emp.supervisor?.nombre,
            emp.cellular,
            emp.jornada_laboral,
            emp.status ? 'activo' : 'inactivo'
        ].filter(Boolean).join(' ').toLowerCase();
        return values.includes(query);
    });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchEmpleados();
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar empleado?')) return;
        try {
            await fetch(`${API_URL}${id}/`, { method: 'DELETE' });
            fetchEmpleados();
        } catch (e) { alert("Error al eliminar"); }
    };

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
                        <h1>Gestión de Personal de Congeladora</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">
                        <div className="section-header">
                            <div>
                                <h2>Listado de Empleados</h2>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Buscar empleado..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="btn-add" onClick={() => setShowModal(true)}>
                                <Icon name="plus" /> <span>Agregar Empleado</span>
                            </button>
                        </div>

                        <div className="data-card">
                            <div className="table-wrapper">
                                <table className="personal-table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Nombre Completo</th>
                                            <th>Puesto</th>
                                            <th>Departamento</th>
                                            <th>Jefe inmediato</th>
                                            <th>Salario Diario</th>
                                            <th>Fecha Contratación</th>
                                            <th>Jornada</th>
                                            <th>Celular</th>
                                            <th>Estado</th>
                                            <th>QR</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="12" style={{textAlign: 'center'}}>Cargando...</td></tr>
                                        ) : filteredData.length === 0 ? (
                                            <tr><td colSpan="12" style={{textAlign: 'center'}}>{searchQuery ? 'No se encontraron empleados con esa búsqueda.' : 'No se encontraron empleados registrados.'}</td></tr>
                                        ) : filteredData.map(emp => (
                                            <tr key={emp.id}>
                                                {/* Se muestra el código autogenerado SNZXXXX (o el ID numérico si viene nulo) */}

                                                <td style={{ fontWeight: 'bold' }}>{emp.id_empleado || `ID: ${emp.id}`}</td>
                                                <td>{emp.nombre} {emp.apellido}</td>
                                                {/* CORRECCIÓN DE CAMPOS EXTRANJEROS: 
                                                    Si tu serializador en Django manda el objeto completo del puesto/depto, usamos .nombre, 
                                                    si solo manda el ID numérico o null, mostramos un texto alternativo o el ID. */}
                                                <td>{emp.nombre_puesto || emp.puesto}</td>
                                                <td>{emp.nombre_departamento }</td>
                                                <td>{emp.nombre_supervisor || '—'}</td>
                                                
                                                {/* Muestra el salario diario o un guión si vino Null del script masivo */}
                                                <td>{emp.salarioDiario ? `$${emp.salarioDiario}` : '—'}</td>
                                                <td>{emp.fecha_contratacion || '—'}</td>
                                                <td>{emp.jornada_laboral || '—'}</td>
                                                <td>{emp.cellular || '—'}</td>
                                                <td>
                                                    <span className={`status-pill ${emp.status ? 'activo' : 'inactivo'}`}>
                                                        {emp.status ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="qr-cell">
                                                    <img src={getQrCodeUrl(emp)} alt={`QR ${emp.nombre}`} width="50" height="50" />
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn-icon credential" onClick={() => setSelectedCredential(emp)} title="Ver credencial">
                                                        <Icon name="id-card" />
                                                    </button>
                                                    <button className="btn-icon delete" onClick={() => handleDelete(emp.id)}>
                                                        <Icon name="trash" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showModal && (
                <FormEmp 
                    onClose={() => setShowModal(false)} 
                    onRefresh={fetchEmpleados} 
                />
            )}

            {selectedCredential && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="credential-card" style={{ background: '#fff', borderRadius: '12px', width: '340px', maxWidth: '95%', padding: '20px', boxShadow: '0 12px 28px rgba(0,0,0,0.2)', position: 'relative' }}>
                        <button onClick={() => setSelectedCredential(null)} style={{ position: 'absolute', top: '12px', right: '12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px' }}>×</button>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', textAlign: 'center' }}>Credencial</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '16px', alignItems: 'start' }}>
                            <div style={{ width: '100px', height: '120px', border: '2px dashed #ccc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
                                Foto<br />aquí
                            </div>
                            <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                                <div><strong>Nombre:</strong><br />{selectedCredential.nombre} {selectedCredential.apellido}</div>
                                <div><strong>Departamento:</strong><br />{selectedCredential.nombre_departamento || (selectedCredential.departamento?.nombre || selectedCredential.departamento) || '—'}</div>
                                <div><strong>Puesto:</strong><br />{selectedCredential.nombre_puesto || (selectedCredential.puesto?.nombre || selectedCredential.puesto) || '—'}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '18px', textAlign: 'center' }}>
                            <img src={getQrCodeUrl(selectedCredential)} alt={`QR ${selectedCredential.nombre}`} width="120" height="120" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}