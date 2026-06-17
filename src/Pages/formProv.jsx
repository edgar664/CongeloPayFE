import React, { useState } from 'react';
import './formEmp.css'; // Reutilizamos tus estilos existentes del modal
import { ENDPOINTS } from '../api'; // Importamos tus rutas dinámicas centralizadas

export default function FormCli({ onClose, onRefresh }) {
    // Estado inicial limpio basado exclusivamente en el modelo Cliente de Django
    const [formData, setFormData] = useState({
        nombre: '',
        rfc: '',
        direccion: '',
        telefono: '',
        email: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Limpieza básica de cadenas antes de realizar el envío
        const dataToSend = {
            nombre: formData.nombre.trim(),
            rfc: formData.rfc.trim().toUpperCase(), // Los RFC se guardan en mayúsculas
            direccion: formData.direccion.trim() || null,
            telefono: formData.telefono.trim() || null,
            email: formData.email.trim() || null,
        };

        try {
            // Se realiza la petición apuntando a ENDPOINTS.clientes
            const response = await fetch(ENDPOINTS.clientes, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡ÉXITO! Cliente registrado correctamente.');
                onRefresh(); // Refresca la tabla del componente padre (Listado de Clientes)
                onClose();   // Cierra el modal automático
            } else {
                console.error('Django dice:', data);
                // Si el RFC ya existe u otro error de restricción, Django lo devolverá aquí
                alert('Error de validación en Django: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo establecer conexión con el servidor.');
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Nuevo Cliente</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="form-emp-grid">
                    
                    {/* Nombre / Razón Social */}
                    <div className="f-group">
                        <label>Nombre o Razón Social *</label>
                        <input 
                            type="text" 
                            name="nombre" 
                            value={formData.nombre} 
                            onChange={handleChange} 
                            placeholder="Ej: Comercializadora de Alimentos S.A."
                            required 
                        />
                    </div>

                    {/* RFC */}
                    <div className="f-group">
                        <label>RFC *</label>
                        <input 
                            type="text" 
                            name="rfc" 
                            maxLength={13}
                            value={formData.rfc} 
                            onChange={handleChange} 
                            placeholder="12 o 13 caracteres"
                            required 
                        />
                    </div>

                    {/* Teléfono */}
                    <div className="f-group">
                        <label>Teléfono de Contacto</label>
                        <input 
                            type="text" 
                            name="telefono" 
                            value={formData.telefono} 
                            onChange={handleChange} 
                            placeholder="Ej: 3519876543"
                        />
                    </div>

                    {/* Correo Electrónico */}
                    <div className="f-group">
                        <label>Correo Electrónico</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            placeholder="cliente@logistica.com"
                        />
                    </div>

                    {/* Dirección Fiscal */}
                    <div className="f-group" style={{ gridColumn: 'span 2' }}>
                        <label>Dirección Fiscal</label>
                        <textarea 
                            name="direccion" 
                            value={formData.direccion} 
                            onChange={handleChange} 
                            placeholder="Calle, Número, Colonia, C.P. y Municipio"
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* Acciones del Footer */}
                    <div className="f-actions-footer" style={{ gridColumn: 'span 2' }}>
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar">Guardar Cliente</button>
                    </div>

                </form>
            </div>
        </div>
    );
}