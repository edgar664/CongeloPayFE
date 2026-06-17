// formCli.jsx
import React, { useState } from 'react';
import './formEmp.css'; // Tus estilos limpios de modal
import { ENDPOINTS } from '../api';

export default function FormCli({ onClose, onRefresh }) {
    const [formData, setFormData] = useState({
        nombre: '',
        rfc: '',
        direccion: '',
        telefono: '',
        email: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSend = {
            nombre: formData.nombre.trim(),
            rfc: formData.rfc.trim().toUpperCase(),
            direccion: formData.direccion.trim() || null,
            telefono: formData.telefono.trim() || null,
            email: formData.email.trim() || null,
        };

        try {
            const response = await fetch(ENDPOINTS.clientes, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (response.ok) {
                alert('¡ÉXITO! Cliente registrado correctamente.');
                onRefresh();
                onClose();
            } else {
                const data = await response.json();
                alert('Error de validación: ' + JSON.stringify(data));
            }
        } catch (error) {
            alert('No se pudo establecer conexión con el servidor.');
        }
    };

    // --- EL CONTENEDOR DEBE SER EXCLUSIVAMENTE EL MODAL OVERLAY ---
    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Nuevo Cliente</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="form-emp-grid">
                    <div className="f-group">
                        <label>Nombre o Razón Social *</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    </div>

                    <div className="f-group">
                        <label>RFC *</label>
                        <input type="text" name="rfc" maxLength={13} value={formData.rfc} onChange={handleChange} required />
                    </div>

                    <div className="f-group">
                        <label>Teléfono de Contacto</label>
                        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
                    </div>

                    <div className="f-group">
                        <label>Correo Electrónico</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    </div>

                    <div className="f-group" style={{ gridColumn: 'span 2' }}>
                        <label>Dirección Fiscal</label>
                        <textarea name="direccion" value={formData.direccion} onChange={handleChange} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <div className="f-actions-footer" style={{ gridColumn: 'span 2' }}>
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar">Guardar Cliente</button>
                    </div>
                </form>
            </div>
        </div>
    );
}