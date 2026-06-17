import React, { useState, useEffect } from 'react';
import './formEmp.css';
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas

export default function FormProd({ onClose, onRefresh, productToEdit }) {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: 'Fresco',
        precio: '',
        unidades: 0,
        kilos: ''
    });

    // Efecto para rellenar el formulario si se pasa un producto para editar
    useEffect(() => {
        if (productToEdit) {
            setFormData({
                nombre: productToEdit.nombre || '',
                descripcion: productToEdit.descripcion || '',
                categoria: productToEdit.categoria || 'Fresco',
                precio: productToEdit.precio || '',
                unidades: productToEdit.unidades || 0,
                kilos: productToEdit.kilos || ''
            });
        }
    }, [productToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = {
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            categoria: formData.categoria,
            precio: parseFloat(formData.precio) || 0.0,
            unidades: parseInt(formData.unidades, 10) || 0,
            kilos: parseFloat(formData.kilos) || 0.0
        };

        // Definir método y URL dinámicamente si es edición o creación
        const isEditing = !!productToEdit;
        const url = isEditing ? `${ENDPOINTS.productos}${productToEdit.id}/` : ENDPOINTS.productos;
        const method = isEditing ? 'PUT' : 'POST'; // Puedes cambiar 'PUT' por 'PATCH' si tu backend lo requiere

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                alert(isEditing ? '¡ÉXITO! Producto actualizado correctamente.' : '¡ÉXITO! Producto agregado correctamente.');
                onRefresh();
                onClose();
            } else {
                console.error('Django dice:', data);
                alert('Error en campos: ' + JSON.stringify(data));
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
                    {/* Título dinámico */}
                    <h2>{productToEdit ? 'Editar Producto' : 'Agregar Producto'}</h2>
                    <button className="btn-close-x" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="form-emp-grid">
                    <div className="f-group">
                        <label>Nombre *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="f-group">
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows="4"
                        />
                    </div>

                    <div className="f-group">
                        <label>Categoría *</label>
                        <select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            required
                        >
                            <option value="Fresco">Fresco</option>
                            <option value="Semiterminado">Semiterminado</option>
                            <option value="Terminado">Terminado</option>
                        </select>
                    </div>

                    <div className="f-group">
                        <label>Precio *</label>
                        <input
                            type="number"
                            name="precio"
                            step="0.01"
                            value={formData.precio}
                            onChange={handleChange}
                            min="0"
                            required
                        />
                    </div>

                    <div className="f-group">
                        <label>Unidades *</label>
                        <input
                            type="number"
                            name="unidades"
                            value={formData.unidades}
                            onChange={handleChange}
                            min="0"
                            required
                        />
                    </div>

                    <div className="f-group">
                        <label>Kilos *</label>
                        <input
                            type="number"
                            name="kilos"
                            step="0.01"
                            value={formData.kilos}
                            onChange={handleChange}
                            min="0"
                            required
                        />
                    </div>

                    <div className="f-actions-footer">
                        <button type="button" className="btn-cancelar" onClick={onClose}>Cancelar</button>
                        {/* Texto de botón dinámico */}
                        <button type="submit" className="btn-guardar">
                            {productToEdit ? 'Actualizar Cambios' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}