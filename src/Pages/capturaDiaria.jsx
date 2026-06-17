import React, { useState, useEffect } from 'react';
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import './capturaDiaria.css'; 
import { ENDPOINTS } from '../api';


const Icon = ({ name }) => {
    const icons = {
        save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>,
        calendar: <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>,
        // Nuevo icono para la sincronización del reloj
        refresh: <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path> 
    };
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name]}
        </svg>
    );
};

export default function CapturaDiaria() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [empleados, setEmpleados] = useState([]);
    const [registros, setRegistros] = useState({});
    const [sincronizando, setSincronizando] = useState(false); // Estado de carga del reloj

    // 1. Cargar empleados activos al iniciar
    useEffect(() => {
        fetch('http://localhost:8000/apiEmp/empleados/')
            .then(res => res.json())
            .then(data => setEmpleados(data.filter(e => e.status)));
    }, []);

    // 2. Cargar asistencias automáticas desde el reloj cuando cambie la fecha
    useEffect(() => {
        if (!fecha) return;

        // Petición a Django para traer qué empleados asistieron en esta fecha específica
        fetch(`http://localhost:8000/apiNom/asistencias/?fecha=${fecha}`)
            .then(res => res.json())
            .then(asistenciasDelDia => {
                // Suponiendo que Django te regresa una lista de IDs de empleados que sí checaron: [1, 4, 7]
                // Mapeamos esto al estado de registros para encender los checkboxes de forma automática
                const nuevasAsistencias = {};
                
                // Conservamos lo que el usuario ya haya escrito (cajas, procesos) pero actualizamos asistencias
                empleados.forEach(emp => {
                    const siAsistio = asistenciasDelDia.includes(emp.id);
                    nuevasAsistencias[emp.id] = {
                        ...registros[emp.id],
                        empleado: emp.id,
                        fecha: fecha,
                        asistencia: siAsistio, // true si se encontró registro en el reloj
                    };
                });
                setRegistros(prev => ({ ...prev, ...nuevasAsistencias }));
            })
            .catch(err => console.error("Error al traer asistencias del reloj:", err));

    }, [fecha, empleados]);

    // 3. Función para mandar a traer los datos del reloj checador local (Tratamiento del botón nuevo)
    // 3. Función optimizada para traer los datos del reloj checador local
 // 3. Función optimizada para traer los datos del reloj checador local pasándole la fecha
    const handleSincronizarReloj = async () => {
        setSincronizando(true);
        try {
            const response = await fetch(ENDPOINTS.sincronizarReloj, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // ---> ENVIAMOS LA FECHA ACTUAL DE LA CAPTURA <---
                body: JSON.stringify({ fecha: fecha }) 
            });
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("El servidor no respondió con un formato JSON válido.");
            }

            const data = await response.json();
            
            if (response.ok) {
                alert(`¡Reloj sincronizado! Registros nuevos: ${data.nuevos_registros || 0}`);
                // Volvemos a setear la fecha para que el useEffect secundario 
                // vuelva a pedir las asistencias actualizadas a Django
                setFecha(prev => prev); 
            } else {
                alert("Error en el dispositivo: " + (data.message || "Error desconocido"));
            }
        } catch (error) {
            console.error("Error capturado:", error);
            alert("No se pudo establecer comunicación con el backend (Timeout del Reloj).");
        } finally {
            setSincronizando(false);
        }
    };
    const handleChange = (empId, field, value) => {
        setRegistros(prev => ({
            ...prev,
            [empId]: { ...prev[empId], [field]: value, empleado: empId, fecha: fecha }
        }));
    };

    const handleSave = async () => {
        const dataToSend = Object.values(registros).map(reg => ({
            empleado_id: reg.empleado,
            fecha: reg.fecha,
            asistencia: reg.asistencia ?? false, 
            cajas_hechas: parseInt(reg.cajas_hechas || 0),
            procesos_hechos: parseInt(reg.procesos_hechos || 0),
            horas_extra: parseFloat(reg.horas_extra || 0)
        }));

        if (dataToSend.length === 0) {
            alert("No hay cambios para guardar.");
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/apiNom/registros/guardar_masivo/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (response.ok) {
                alert("¡Éxito! Registros guardados en la base de datos.");
            } else {
                const errorData = await response.json();
                alert("Error al guardar: " + JSON.stringify(errorData));
            }
        } catch (error) {
            alert("No se pudo conectar con el servidor.");
        }
    };

    return (
        <div className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''}`}>
            <Sidebar collapsed={isCollapsed} />
            <main className="pro-main">
                <header className="pro-top-nav">
                    <div className="header-left">
                        <button className="menu-hamburger" onClick={() => setIsCollapsed(!isCollapsed)}>
                            <SidebarIcon name="menu" />
                        </button>
                        <h1>Captura de Nómina Diario</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <div className="personal-screen">
                        <div className="section-header">
                            <div className="header-text">
                                <h2>Registro Diario de Nómina</h2>
                                <p>Información de producción y horas para calcular pagos: <b>{fecha}</b></p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {/* NUEVO BOTÓN: Sincronizar Reloj Local */}
                                <button 
                                    className="btn-add" 
                                    style={{ backgroundColor: '#2563eb' }} 
                                    onClick={handleSincronizarReloj}
                                    disabled={sincronizando}
                                >
                                    <Icon name="refresh" /> 
                                    <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar Reloj'}</span>
                                </button>

                                <input
                                    type="date"
                                    className="btn-filter"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                />
                                <button className="btn-add" onClick={handleSave}>
                                    <Icon name="save" /> <span>Guardar Jornada</span>
                                </button>
                            </div>
                        </div>

                        <div className="data-card">
                            <div className="table-wrapper">
                                <table className="personal-table">
                                    <thead>
                                        <tr>
                                            <th>Empleado</th>
                                            <th>Asistencia (Reloj)</th>
                                          
                                            <th>Horas Extra</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {empleados.map(emp => (
                                            <tr key={emp.id}>
                                                <td className="user-name">{emp.nombre} {emp.apellido}</td>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                                        checked={registros[emp.id]?.asistencia || false}
                                                        onChange={(e) => handleChange(emp.id, 'asistencia', e.target.checked)}
                                                    />
                                                </td>
                                           
                                                <td>
                                                    <input type="number" className="search-box" style={{ width: '80px', padding: '5px' }}
                                                        value={registros[emp.id]?.horas_extra || ''}
                                                        onChange={(e) => handleChange(emp.id, 'horas_extra', e.target.value)} />
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
        </div>
    );
}