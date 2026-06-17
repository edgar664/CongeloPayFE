import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./Pages/login";
import Dashboard from './Pages/Dashboard';
import Personal from './Pages/personal';
import Nomina from './Pages/nomina';
import CapturaDiaria from './Pages/capturaDiaria';
import VerRegistro from './Pages/verRegistro';
import Inventario from './Pages/Inventario';
import Almacenes from './Pages/almacen';
import Catalogos from './Pages/catalogos';
import Entradas from './Pages/entradas';
import Proveedores from './Pages/proveedores';
import Salidas from './Pages/salidas';
import FacturasProv from './Pages/facProv';
import Clientes from './Pages/clientes'; // NUEVA IMPORTACIÓN PARA CLIENTES
import FacturasCli from './Pages/facCli'; // NUEVA IMPORTACIÓN PARA FACTURAS DE CLIENTES



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

        {/* Personal Protegido */}
        <Route
          path="/personal"
          element={isAuth ? <Personal onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        {/* Nomina Protegido */}
        <Route
          path="/nomina"
          element={isAuth ? <Nomina onLogout={logoutAction} /> : <Navigate to="/login" />}
        />

        <Route
          path="/captura-diaria"
          element={isAuth ? <CapturaDiaria onLogout={logoutAction} /> : <Navigate to="/login" />}
        />

        <Route
          path="/verRegistro"
          element={isAuth ? <VerRegistro onLogout={logoutAction} /> : <Navigate to="/login" />}
        />

        <Route
          path="/productos"
          element={isAuth ? <Inventario onLogout={logoutAction} /> : <Navigate to="/login" />}
        />

        <Route
          path="/catalogos"
          element={isAuth ? <Catalogos onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route
          path="/entradas"
          element={isAuth ? <Entradas onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route
          path="/entradas/crear"
          element={isAuth ? <Entradas onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route
          path="/entradas/editar/:id"
          element={isAuth ? <Entradas onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route
          path="/entradas/:id"
          element={isAuth ? <Entradas onLogout={logoutAction} /> : <Navigate to="/login" />}
        />

        <Route
          path="/almacen"
          element={isAuth ? <Almacenes onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route
          path="/proveedores"
          element={isAuth ? <Proveedores onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route
          path="/proveedores/crear"
          element={isAuth ? <Proveedores onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route
          path="/proveedores/editar/:id"
          element={isAuth ? <Proveedores onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route
          path="/proveedores/:id"
          element={isAuth ? <Proveedores onLogout={logoutAction} /> : <Navigate to="/login" />}
        />

        <Route
          path="/salidas"
          element={isAuth ? <Salidas onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route 
          path="/facProv"
          element={isAuth ? <FacturasProv onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route 
          path="/clientes"
          element={isAuth ? <Clientes onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        <Route 
          path="/facCli"
          element={isAuth ? <FacturasCli onLogout={logoutAction} /> : <Navigate to="/login" />}
        />
        {/* Comodín: Cualquier otra ruta inválida redirige al inicio */}
        <Route path="*" element={<Navigate to={isAuth ? "/dashboard" : "/login"} />} />



        {/* Aquí agregaríamos más rutas protegidas según sea necesario */}
        <Route path="/Inventario" element={isAuth ? <Inventario onLogout={logoutAction} /> : <Navigate to="/login" />} />
        
      </Routes>
    </Router>
  );
}

export default App;