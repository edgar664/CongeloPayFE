import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Icon = ({ name, className }) => {
    const icons = {
        box: <path d="M21 8v13H3V8M1 3h22v5H1V3zm10 8h2" />,
        archive: <path d="M4 7h16v11H4zM4 7l8 6 8-6M9 12h6" />,
        users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
        chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
        map: <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zm7-4v16m8 4V6" />,
        menu: <path d="M3 12h18M3 6h18M3 18h18" />,
        close: <path d="M18 6L6 18M6 6l12 12" />,
        money: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
        day: <path d="M3 8h18M3 12h18M3 16h18M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />,
        chevron: <path d="M6 9l6 6 6-6" />,
        briefcase: <path d="M20 7h-12a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM12 13v-1M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
        checklist: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
    };
    return (
        <svg className={className} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[name] || <circle cx="12" cy="12" r="10" />}
        </svg>
    );
};

const Sidebar = ({ handleLogout, collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedModule, setExpandedModule] = useState(null);

    // Inline unified styles to ensure sidebar behaves the same across templates
    const styles = {
        aside: {
            width: collapsed ? '72px' : '240px',
            transition: 'width 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            background: '#0f1724',
            color: '#e6eef8',
            boxSizing: 'border-box',
            overflow: 'auto',
        },
        proLogo: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.03)'
        },
        logoSymbol: {
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: '#0ea5a4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700'
        },
        proMenu: { padding: '8px 0', flex: 1 },
        menuItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            cursor: 'pointer',
            userSelect: 'none'
        },
        menuLabel: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        chevronIcon: { marginLeft: '8px', transition: 'transform 0.2s' },
        submenu: { paddingLeft: '48px', display: 'flex', flexDirection: 'column' },
        submenuItem: { padding: '8px 0', cursor: 'pointer' },
        userFooter: { padding: '12px', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '10px' },
        avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#0ea5a4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
        logoutMini: { marginLeft: 'auto', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }
    };

    const getActiveClass = (path) => location.pathname === path ? 'active' : '';

    const toggleModule = (moduleName) => {
        setExpandedModule(expandedModule === moduleName ? null : moduleName);
    };

    const modules = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'chart',
            path: '/dashboard',
            submenu: null
        },
        {
            id: 'empleados',
            label: 'Empleados',
            icon: 'users',
            submenu: [
                { label: 'Lista de Empleados', path: '/personal' },
                { label: 'Asistencia', path: '/captura-diaria' },
                { label: 'Nómina', path: '/nomina' }
            ]
        },
        {
            id: 'procesos',
            label: 'departamentos',
            icon: 'briefcase',
            submenu: [
                { label: 'Registros de Actividad', path: '/verRegistro' },
                { label: 'Captura Diaria', path: '/captura-diaria' },
                { label: 'Calidad', path: '/calidad' },
                { label: 'Producción', path: '/produccion' },
                { label: 'Recepción', path: '/recepcion' }
            ]
        },
        {
            id: 'reportes',
            label: 'Facturación',
            icon: 'checklist',
            path: '/reportes',
            submenu: [
                { label: 'Proveedores', path: '/facProv' },
                { label: 'Clientes', path: '/facCli' },
                { label: 'Facturas', path: '#' }
            ]
        },
        {
            id: 'inventario',
            label: 'Inventarios',
            icon: 'box',
            path: '/productos',
            submenu: [
                { label: 'Inventario Fruta', path: '/productos' },
                { label: 'Movimientos', path: '/entradas' },
                { label: 'Traspasos', path: '/salidas' },
            ],
        },
        {
            id: 'general',
            label: 'Catalogos',
            icon: 'archive',
            path: '/general',
            submenu: [
                { label: 'Emvases', path: '/catalogos' },
                { label: 'Proveedores', path: '/proveedores' },
                { label: 'Clientes', path: '/clientes' },
                { label: 'Almacenes', path: '/almacen' },
            ],
        }
    ];

    return (
        <aside className={`pro-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="pro-logo">
                <div className="logo-symbol">C</div>
                {!collapsed && <span className="logo-text">CONGELO<b>PAY</b></span>}
            </div>

            <nav className="pro-menu">
                {modules.map((module) => (
                    <div key={module.id}>
                        <div
                            className={`menu-item ${getActiveClass(module.path)} ${expandedModule === module.id ? 'expanded' : ''}`}
                            onClick={() => {
                                if (module.submenu) {
                                    toggleModule(module.id);
                                } else {
                                    navigate(module.path);
                                }
                            }}
                        >
                            <Icon name={module.icon} />
                            <span className="menu-label">{module.label}</span>
                            {module.submenu && !collapsed && (
                                <Icon name="chevron" className="chevron-icon" />
                            )}
                        </div>

                        {module.submenu && expandedModule === module.id && !collapsed && (
                            <div className="submenu">
                                {module.submenu.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`submenu-item ${getActiveClass(item.path)}`}
                                        onClick={(e) => {
                                                e.stopPropagation();
                                                if (item.path && item.path !== '#') {
                                                    navigate(item.path);
                                                    setExpandedModule(null);
                                                }
                                            }}
                                    >
                                        <span className="submenu-label">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="pro-user-footer">
                <div className="u-avatar">A</div>
                {!collapsed && (
                    <>
                        <div className="u-info">
                            <p className="u-name">Administrador</p>
                            <p className="u-status">En Línea</p>
                        </div>
                        <button className="logout-mini" onClick={handleLogout} title="Cerrar Sesión">⎋</button>
                    </>
                )}
            </div>
        </aside>
    );
};

export { Sidebar, Icon };