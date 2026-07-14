import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import { ENDPOINTS } from '../api';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Limpia solo espacios al inicio/final, NO alteres las mayúsculas
        const exactUsername = username.trim();

        try {
            const response = await fetch(ENDPOINTS.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: exactUsername, // <--- Enviado tal cual
                    password: password
                }),
            });
            const data = await response.json();

            if (response.ok) {
                // 2. Guardar AMBOS tokens para el ciclo de vida de JWT
                localStorage.setItem('token', data.access);
                localStorage.setItem('refresh_token', data.refresh);

                // 3. Pasar los datos del usuario (como el rol) al estado global si es necesario
                if (onLogin) {
                    onLogin(data.user);
                }

                navigate('/dashboard');
            } else {
                // 4. Mapear correctamente el error enviado desde tu API de Django
                const mensajeError = data.error || data.detail || "Usuario o contraseña incorrectos.";
                setError(mensajeError);
            }
        } catch (err) {
            setError("Error de conexión con el servidor. Verifica tu red.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-overlay"></div>
            <div className="login-box">
                <div className="login-header">
                    <div className="logo-placeholder">❄️</div>
                    <h1>Congeladora SNZ</h1>
                    <p>Gestión de Nóminas para Personal de Congeladora</p>
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
                        {loading ? <span className="loader">Cargando...</span> : 'Iniciar Sesión'}
                    </button>
                </form>
                <footer className="login-footer">
                    &copy; {new Date().getFullYear()} Software de Nóminas Congeladora
                </footer>
            </div>
        </div>
    );
}