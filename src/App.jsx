import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyProvider } from './Context/CompanyContext'; // Asegúrate de que la ruta coincida con la ubicación de tu archivo
import Login from "./Pages/login";
import Dashboard from './Pages/Dashboard';
import Configuracion from './Pages/EmpresaSettings';

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));

  const loginAction = () => {
    setIsAuth(true);
  };

  const logoutAction = () => {
    localStorage.removeItem('token');
    setIsAuth(false);
  };

  return (
    <Router>
      <CompanyProvider>
        <Routes>
          <Route 
            path="/" 
            element={isAuth ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />

          <Route
            path="/login"
            element={isAuth ? <Navigate to="/dashboard" /> : <Login onLogin={loginAction} />}
          />

          <Route
            path="/dashboard"
            element={isAuth ? <Dashboard onLogout={logoutAction} /> : <Navigate to="/login" />}
          />

          <Route
            path="/configuracion"
            element={isAuth ? <Configuracion onLogout={logoutAction} /> : <Navigate to="/login" />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </CompanyProvider>
    </Router>
  );
}

export default App;