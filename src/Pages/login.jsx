import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import { ENDPOINTS } from '../api'; // <-- Importas tus rutas dinámicas

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

        try {
            // Asegúrate de que termine exactamente en /
            const response = await fetch(ENDPOINTS.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.access);
                onLogin();
                navigate('/dashboard');
            } else {
                setError(data.detail || "Usuario o contraseña incorrectos.");
            }
        } catch (err) {
            setError(err.message || "Error de conexión con el servidor");
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
                        <label>Usuario</label>
                        <input
                            type="text"
                            placeholder="Usuario de sistema"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-container">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <span className="loader"></span> : 'Iniciar Sesión'}
                    </button>
                </form>
                <footer className="login-footer">
                    &copy; {new Date().getFullYear()} Software de Nóminas Congeladora
                </footer>
            </div>
        </div>
    );
}