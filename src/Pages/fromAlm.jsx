import React, { useState } from 'react';
import './formEmp.css'; // Reutiliza tus estilos css idénticos de manera perfecta
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas


export default function FormAlmacen({ onClose, onRefresh }) {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });

    // Manejador de cambios idéntico al que utilizas en FormEmp
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Estructura y limpia los datos a enviar tal como lo espera tu backend en Django
        const dataToSend = {
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim()
        };

        if (!dataToSend.nombre) {
            alert('Por favor ingresa un nombre válido.');
            return;
        }

        try {
            // URL de tu API para inventarios/envases
            const response = await fetch(ENDPOINTS.almacenes, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡ÉXITO! Almacén guardado.');
                onRefresh(); // Refresca automáticamente la tabla del catálogo
                onClose();   // Cierra el modal flotante
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
                    <h2>Nuevo Envase</h2>
                    <button className="btn-close-x" onClick={onClose} type="button">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="form-emp-grid">
                        <div className="f-group">
                        <label>Nombre del Almacén</label>
                        <input 
                            type="text" 
                            name="nombre" 
                            value={formData.nombre} 
                            onChange={handleChange} 
                            placeholder="Ej. Almacén Central"
                            required 
                        />
                    </div>
                    
                    <div className="f-group">
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Descripción opcional del almacén"
                        />
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