import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Components/Sidebar';
import { Icon } from '../Components/Icon'; // Importamos el icono para el menú
import { ENDPOINTS } from '../api';
import './empresaSettings.css';

export default function EmpresaSettings() {
    const [formData, setFormData] = useState({
        nombre_comercial: '',
        subtitulo: '',
        color_primario: '#1B2A52',
        color_secundario: '#4EA93B',
        color_acento: '#C81D31'
    });

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // Estados de control para el menú responsivo (igual que en el Dashboard)
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        if (window.innerWidth <= 1024) {
            setMenuOpen((prev) => !prev);
        } else {
            setIsCollapsed((prev) => !prev);
        }
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    useEffect(() => {
        const fetchEmpresaData = async () => {
            try {
                const response = await fetch(ENDPOINTS.empresa, {
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error(`Error HTTP ${response.status}`);
                }

                const data = await response.json();
                setFormData({
                    nombre_comercial: data.nombre_comercial || '',
                    subtitulo: data.subtitulo || '',
                    color_primario: data.color_primario || '#1B2A52',
                    color_secundario: data.color_secundario || '#4EA93B',
                    color_acento: data.color_acento || '#C81D31'
                });
                setLogoPreview(data.logo || '');
            } catch (error) {
                console.error('Error al consultar Django:', error);
                setStatusMessage({
                    type: 'error',
                    text: 'No se pudo cargar la configuración de la empresa.'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchEmpresaData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (logoFile && logoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatusMessage({ type: '', text: '' });

        const data = new FormData();
        data.append('nombre_comercial', formData.nombre_comercial);
        data.append('subtitulo', formData.subtitulo);
        data.append('color_primario', formData.color_primario);
        data.append('color_secundario', formData.color_secundario);
        data.append('color_acento', formData.color_acento);

        if (logoFile) {
            data.append('logo', logoFile);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(ENDPOINTS.empresa, {
                method: 'PUT',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Accept': 'application/json'
                },
                body: data
            });

            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}`);
            }

            const updatedData = await response.json();

            if (updatedData.logo) {
                setLogoPreview(updatedData.logo);
                setLogoFile(null);
            }

            setStatusMessage({
                type: 'success',
                text: 'Configuración de empresa guardada con éxito.'
            });
        } catch (error) {
            console.error('Error al guardar:', error);
            setStatusMessage({
                type: 'error',
                text: 'Error al intentar guardar los cambios.'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''} ${menuOpen ? 'menu-open' : ''}`}>
            
            {/* OVERLAY PARA MÓVIL */}
            {menuOpen && (
                <div 
                    className="menu-overlay" 
                    onClick={() => setMenuOpen(false)} 
                />
            )}

            {/* SIDEBAR CON LAS PROPS CORRECTAS */}
            <Sidebar 
                collapsed={isCollapsed} 
                setCollapsed={setIsCollapsed} 
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                toggleMenu={toggleMenu}
            />

            <main className="pro-main">
                <header className="pro-top-nav settings-header">
                    <div className="header-left">
                       
                        <div>
                            <h2>Configuración de Empresa</h2>
                            <p>Personaliza la identidad visual y datos de marca registrados en el ERP.</p>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="settings-loading">
                        <div className="spinner"></div>
                        <span>Cargando datos de la empresa...</span>
                    </div>
                ) : (
                    <div className="pro-content-scroll settings-container-grid">
                        {/* FORMULARIO */}
                        <form onSubmit={handleSubmit} className="settings-form">
                            {statusMessage.text && (
                                <div className={`settings-alert alert-${statusMessage.type}`}>
                                    {statusMessage.text}
                                </div>
                            )}

                            <section className="form-section">
                                <h3>Información General</h3>
                                <div className="form-group">
                                    <label htmlFor="nombre_comercial">Nombre Comercial / Empresa</label>
                                    <input
                                        id="nombre_comercial"
                                        type="text"
                                        name="nombre_comercial"
                                        placeholder="Ej. Sano y Nutritivo"
                                        value={formData.nombre_comercial}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subtitulo">Subtítulo / Leyenda</label>
                                    <input
                                        id="subtitulo"
                                        type="text"
                                        name="subtitulo"
                                        placeholder="Ej. Procesadora de Alimentos S.A. de C.V."
                                        value={formData.subtitulo}
                                        onChange={handleChange}
                                    />
                                </div>
                            </section>

                            <section className="form-section">
                                <h3>Logotipo Principal</h3>
                                <div className="logo-upload-wrapper">
                                    <div className="logo-preview-box">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo Preview" className="logo-preview-img" />
                                        ) : (
                                            <div className="logo-placeholder">Sin Logo</div>
                                        )}
                                    </div>

                                    <div className="logo-upload-actions">
                                        <p className="upload-hint">Formatos soportados: PNG, JPG, SVG (Máx. 2MB)</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            id="logo-input"
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="logo-input" className="btn-secondary">
                                            Subir Nuevo Logo
                                        </label>
                                    </div>
                                </div>
                            </section>

                            <section className="form-section">
                                <h3>Paleta de Colores</h3>
                                <div className="colors-grid">
                                    <div className="color-picker-card">
                                        <label>Color Primario</label>
                                        <div className="picker-input-wrapper">
                                            <input
                                                type="color"
                                                name="color_primario"
                                                value={formData.color_primario}
                                                onChange={handleChange}
                                            />
                                            <input
                                                type="text"
                                                className="color-hex-input"
                                                name="color_primario"
                                                value={formData.color_primario}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="color-picker-card">
                                        <label>Color Secundario</label>
                                        <div className="picker-input-wrapper">
                                            <input
                                                type="color"
                                                name="color_secundario"
                                                value={formData.color_secundario}
                                                onChange={handleChange}
                                            />
                                            <input
                                                type="text"
                                                className="color-hex-input"
                                                name="color_secundario"
                                                value={formData.color_secundario}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="color-picker-card">
                                        <label>Color Acento</label>
                                        <div className="picker-input-wrapper">
                                            <input
                                                type="color"
                                                name="color_acento"
                                                value={formData.color_acento}
                                                onChange={handleChange}
                                            />
                                            <input
                                                type="text"
                                                className="color-hex-input"
                                                name="color_acento"
                                                value={formData.color_acento}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>

                        {/* PREVIEW EN TIEMPO REAL */}
                        <aside className="preview-panel">
                            <h3>Previsualización de Marca</h3>
                            <div className="brand-preview-card">
                                <div
                                    className="preview-header-bar"
                                    style={{ backgroundColor: formData.color_primario }}
                                >
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" className="preview-bar-logo" />
                                    ) : (
                                        <div className="preview-logo-placeholder">LOGO</div>
                                    )}
                                    <span className="preview-bar-title">{formData.nombre_comercial || 'Nombre de la Empresa'}</span>
                                </div>

                                <div className="preview-body">
                                    <p className="preview-subtitle">{formData.subtitulo || 'Subtítulo o giro comercial'}</p>
                                    <hr className="preview-divider" />
                                    <div className="preview-buttons">
                                        <button
                                            type="button"
                                            className="preview-btn"
                                            style={{ backgroundColor: formData.color_secundario, color: '#FFF' }}
                                        >
                                            Botón Secundario
                                        </button>
                                        <button
                                            type="button"
                                            className="preview-btn"
                                            style={{ backgroundColor: formData.color_acento, color: '#FFF' }}
                                        >
                                            Acción Especial
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}