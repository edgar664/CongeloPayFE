import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyProvider } from './Context/CompanyContext'; // Asegúrate de que la ruta coincida con la ubicación de tu archivo
import Login from "./Pages/login";
import Dashboard from './Pages/Dashboard';
import Configuracion from './Pages/EmpresaSettings';
import AlmacenProductos from './Pages/Inventario';
import Productos from './Pages/Productos';
import Categoria from './Pages/Categoria'; // Página para el catálogo de categorías
import Unidades from './Pages/UnidadM'; // Página para el catálogo de unidades de medida
import Empaques from './Pages/Empaque';
import Almacenes from'./Pages/Almacen'; // Página para el catálogo de almacenes
import Ubicaciones from './Pages/Ubicaciones'; // Página para el catálogo de ubicaciones
import Lotes from './Pages/Lote'; // Página para el catálogo de ubicaciones
import Proveedores from './Pages/Proveedor'; // Página para el catálogo de ubicaciones





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
          <Route
            path="/almacen"
            element={isAuth ? <AlmacenProductos onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          <Route
            path="/productos"
            element={isAuth ? <Productos onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          {/* Agrega más rutas según sea necesario */}
          <Route
            path="/categorias"
            element={isAuth ? <Categoria onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          <Route
            path="/unidades"
            element={isAuth ? <Unidades onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          <Route
            path="/empaques"
            element={isAuth ? <Empaques onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          <Route
            path="/almacenes"
            element={isAuth ? <Almacenes onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          <Route
            path="/ubicaciones"
            element={isAuth ? <Ubicaciones onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          <Route
            path="/lotes"
            element={isAuth ? <Lotes onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          <Route
            path="/proveedores"
            element={isAuth ? <Proveedores onLogout={logoutAction} /> : <Navigate to="/login" />}
          />
          {/* Agrega más rutas según sea necesario */}
          {/* Ruta comodín para redirigir a la página de inicio si no se encuentra la ruta */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </CompanyProvider>
    </Router>
  );
}

export default App;