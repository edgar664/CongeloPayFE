import React, { useState } from 'react';
import './formEmp.css';
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas

export default function FormEmp({ onClose, onRefresh }) {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        puesto: '',
        salarioDiario: '',
        status: true,
        fecha_contratacion: '',
        nss: '',
        rfc: '',
        statusImss: true,
        email: '',
        cellular: '',
        usuaio: '',
        password: '',
        departamento: '',
        dias_vacaciones: 0,
        jornada_laboral: '',
        telefonoEmergencia: '',
        avisarA: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = {
            ...formData,
            puesto: formData.puesto || null,
            departamento: formData.departamento || null,
            salarioDiario: formData.salarioDiario ? Number(formData.salarioDiario) : 0,
            dias_vacaciones: Number(formData.dias_vacaciones) || 0,
            fecha_contratacion: formData.fecha_contratacion || null,
        };

        try {
            const response = await fetch(ENDPOINTS.empleados, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡ÉXITO! Empleado guardado.');
                onRefresh();
                onClose();
            } else {
                console.error('Django dice:', data);
                alert('Error de campos: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor.');
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Nuevo Empleado</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="form-emp-grid">
                    <div className="f-group">
                        <label>Nombre</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    </div>
                    <div className="f-group">
                        <label>Apellido</label>
                        <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
                    </div>
                    <div className="f-group">
                        <label>Salario Diario</label>
                        <input type="number" name="salarioDiario" step="0.01" value={formData.salarioDiario} onChange={handleChange} required />
                    </div>
                    <div className="f-group">
                        <label>Fecha Contratación</label>
                        <input type="date" name="fecha_contratacion" value={formData.fecha_contratacion} onChange={handleChange} />
                    </div>
                    <div className="f-group">
                        <label>NSS</label>
                        <input type="text" name="nss" value={formData.nss} onChange={handleChange} />
                    </div>
                    <div className="f-group">
                        <label>RFC</label>
                        <input type="text" name="rfc" value={formData.rfc} onChange={handleChange} />
                    </div>
                    <div className="f-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="f-group">
                        <label>Celular</label>
                        <input type="text" name="cellular" value={formData.cellular} onChange={handleChange} />
                    </div>
                    <div className="f-group">
                        <label>Jornada Laboral</label>
                        <input type="text" name="jornada_laboral" value={formData.jornada_laboral} onChange={handleChange} />
                    </div>
                    <div className="f-group">
                        <label>Teléfono de Emergencia</label>
                        <input type="text" name="telefonoEmergencia" value={formData.telefonoEmergencia} onChange={handleChange} />
                    </div>
                    <div className="f-group">
                        <label>Avisar a</label>
                        <input type="text" name="avisarA" value={formData.avisarA} onChange={handleChange} />
                    </div>
                    <div className="f-actions-footer">
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
