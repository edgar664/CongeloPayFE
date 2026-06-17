import React, { useState } from 'react';
import './formEmp.css'; // Reutilizamos tus estilos de modal
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas

export default function FormNomina({ onClose, onRefresh }) {
    const [formData, setFormData] = useState({
        descripcion: '',
        fecha_inicio: '', // Viernes
        fecha_fin: '',    // Jueves
        estado: 'ABIERTA'
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

        try {
            const response = await fetch(ENDPOINTS.nominas, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("¡Semana de nómina creada!");
                onRefresh();
                onClose();
            } else {
                const data = await response.json();
                alert("Error: " + JSON.stringify(data));
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-modal-container">
                <div className="form-header">
                    <h2>Crear Semana de Nómina</h2>
                    <button className="btn-close-x" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="form-emp-grid">
                    <div className="f-group" style={{ gridColumn: 'span 2' }}>
                        <label>Descripción de la Semana</label>
                        <input 
                            type="text" 
                            name="descripcion" 
                            placeholder="Ej: Nómina Semana 15 - Pago Fijo/Destajo/Horas" 
                            value={formData.descripcion} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="f-group">
                        <label>Fecha Inicio (Viernes)</label>
                        <input 
                            type="date" 
                            name="fecha_inicio" 
                            value={formData.fecha_inicio} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="f-group">
                        <label>Fecha Fin (Jueves)</label>
                        <input 
                            type="date" 
                            name="fecha_fin" 
                            value={formData.fecha_fin} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    
                    <div className="f-actions-footer">
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-guardar">Crear Semana</button>
                    </div>
                </form>
            </div>
        </div>
    );
}