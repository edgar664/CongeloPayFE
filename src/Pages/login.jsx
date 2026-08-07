import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import { ENDPOINTS } from '../api';
import { useCompany } from '../Context/CompanyContext';
// 1. Importa la imagen (ajusta la ruta según la ubicación real dentro de src/)
import logoSvg from '../assets/gemini-svg.svg';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    // Consumimos el contexto de empresa si está disponible para variables de tema/colores
    const companyContext = useCompany?.();
    const company = companyContext?.company || {
        nombre_comercial: 'Sano y Nutritivo Zamora',
        color_primario: '#1B2A52',
        color_secundario: '#2E7D32'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const exactUsername = username.trim();

        try {
            const response = await fetch(ENDPOINTS.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: exactUsername,
                    password: password
                }),
            });
            const data = await response.json();

            if (response.ok) {
                // Guardar tokens JWT en almacenamiento local
                localStorage.setItem('token', data.access);
                localStorage.setItem('refresh_token', data.refresh);

                if (onLogin) {
                    onLogin(data.user);
                }

                navigate('/dashboard');
            } else {
                const mensajeError = data.error || data.detail || 'Usuario o contraseña incorrectos.';
                setError(mensajeError);
            }
        } catch (err) {
            setError('Error de conexión con el servidor. Verifica tu red o la API.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="login-container"
            style={{
                '--primary-theme': company.color_primario || '#1B2A52',
                '--secondary-theme': company.color_secundario || '#2E7D32'
            }}
        >
            <div className="login-overlay"></div>
            <div className="login-box">
                <div className="login-header">
                    {/* 2. Úsalo como variable */}
                    <div className="logo-placeholder">
                        <img src={logoSvg} alt="Logo" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Usuario de sistema"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-container" role="alert">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <span className="loader"></span> : 'Iniciar Sesión'}
                    </button>
                </form>

                <footer className="login-footer">
                    &copy; {new Date().getFullYear()} {company.nombre_comercial || 'Sano y Nutritivo Zamora'}. Todos los derechos reservados.
                </footer>
            </div>
        </div>
    );
}