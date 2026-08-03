import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./Pages/login";
import Dashboard from './Pages/Dashboard';

function App() {
  // Estado inicial basado en si existe el token en el navegador
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));

  // Función que llamaremos desde el Login al tener éxito
  const loginAction = () => {
    setIsAuth(true);
  };

  // Función para cerrar sesión
  const logoutAction = () => {
    localStorage.removeItem('token');
    setIsAuth(false);
  };

  return (
    <Router> {/* ESTA LÍNEA ES INDISPENSABLE */}
      <Routes>
        {/* Raíz: Redirige según si hay token o no */}
        <Route 
          path="/" 
          element={isAuth ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />

        {/* Login: Si ya está logueado, lo manda al dashboard automáticamente */}
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/dashboard" /> : <Login onLogin={loginAction} />}
        />

        {/* Dashboard Protegido */}
        <Route
          path="/dashboard"
          element={isAuth ? <Dashboard onLogout={logoutAction} /> : <Navigate to="/login" />}
        />

        
      </Routes>
    </Router>
  );
}

export default App;