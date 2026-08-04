import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useCompany } from '../Context/CompanyContext'; // Importamos el contexto de la empresa
import './Sidebar.css';

// Iconos SVG Vectoriales de Trazo Delgado (Estilo SAP Fiori / Lucide)
const ICONS = {
    dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
    ),
    inventario: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    ),
    personal: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    chevron: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    collapse: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
            <path d="m14 15-3-3 3-3" />
        </svg>
    ),
    expand: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
            <path d="m12 9 3 3-3 3" />
        </svg>
    ),
    logout: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    dot: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="2.5" />
        </svg>
    ),
    sett: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 .94l-.27.54a2 2 0 1 1-3.64-2l.27-.54a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-.94l.27-.54a2 2 0 1 1 3.64 2l-.27.54a1.65 1.65 0 0 0 .33 1.82z" />
        </svg>
    )
};

const MODULE_GROUPS = [
    {
        category: 'PRINCIPAL',
        items: [
            { id: 'dashboard', label: 'Panel Principal', icon: 'dashboard', path: '/dashboard' }
        ]
    },
    {
        category: 'GESTIÓN OPERATIVA',
        items: [
            {
                id: 'inventario',
                label: 'Inventarios y Almacén',
                icon: 'inventario',
                submenu: [
                    { label: 'Catálogo de Productos', path: '/productos' },
                    { label: 'Entradas y Salidas', path: '/movimientos' },
                    { label: 'Ajustes de Inventario', path: '/ajustes' }
                ]
            },
            {
                id: 'personal',
                label: 'Recursos Humanos',
                icon: 'personal',
                submenu: [
                    { label: 'Directorio de Personal', path: '/personal' },
                    { label: 'Control de Asistencia', path: '/asistencia' }
                ]
            }
        ]
    },
    {
        category: 'SETTINGS',
        items: [
            { id: 'sett', label: 'Panel de Configuración', icon: 'sett', path: '/configuracion' }
        ]
    }
];

export const Sidebar = ({
    user,
    handleLogout,
    collapsed = false,
    setCollapsed = () => { }
}) => {
    const [openSubmenus, setOpenSubmenus] = useState({ inventario: true });
    const location = useLocation();

    // Obtenemos los datos dinámicos de la empresa desde la BD mediante el contexto
    const { company } = useCompany();

    // Auto-expandir el submenú padre si la ruta activa pertenece a un ítem hijo
    useEffect(() => {
        MODULE_GROUPS.forEach((group) => {
            group.items.forEach((item) => {
                if (item.submenu) {
                    const isChildActive = item.submenu.some((sub) => sub.path === location.pathname);
                    if (isChildActive) {
                        setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
                    }
                }
            });
        });
    }, [location.pathname]);

    const toggleSubmenu = (id) => {
        if (collapsed) {
            setCollapsed(false);
            setOpenSubmenus((prev) => ({ ...prev, [id]: true }));
            return;
        }
        setOpenSubmenus((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const isSubmenuActive = (submenu) => {
        return submenu?.some((sub) => location.pathname === sub.path);
    };

    const getUserInitials = (name) => {
        if (!name) return 'OP';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    };

    return (
        <aside
            className={`sap-sidebar ${collapsed ? 'collapsed' : ''}`}
            aria-label="Navegación principal ERP"
            style={{
                // Opcional: inyecta el color primario de la BD directamente como variable del Sidebar
                '--sidebar-primary-color': company.color_primario || '#1B2A52'
            }}
        >
            {/* CABECERA / BRANDING DINÁMICO */}
            <div className="sap-sidebar-header">
                <div className="sap-brand" title={company.nombre_comercial}>
                    <div className="sap-brand-logo">
                        {company.logo ? (
                            <img src={company.logo} alt="Logo Empresa" className="sap-logo-img" />
                        ) : (
                            <span>{company.nombre_comercial ? company.nombre_comercial[0] : 'S'}</span>
                        )}
                    </div>
                    {!collapsed && (
                        <div className="sap-brand-info">
                            <span className="sap-brand-name">{company.nombre_comercial}</span>
                            <span className="sap-brand-system">{company.subtitulo || 'ENTERPRISE ERP'}</span>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="sap-toggle-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                    aria-label="Alternar menú"
                >
                    {collapsed ? ICONS.expand : ICONS.collapse}
                </button>
            </div>

            {/* ÁREA DE NAVEGACIÓN */}
            <nav className="sap-sidebar-nav">
                {MODULE_GROUPS.map((group, gIdx) => (
                    <div key={gIdx} className="sap-nav-group">
                        {!collapsed && (
                            <div className="sap-group-title">{group.category}</div>
                        )}
                        {group.items.map((item) => {
                            const hasSubmenu = Boolean(item.submenu);
                            const isOpen = Boolean(openSubmenus[item.id]);
                            const childActive = hasSubmenu && isSubmenuActive(item.submenu);

                            if (hasSubmenu) {
                                return (
                                    <div
                                        key={item.id}
                                        className={`sap-menu-accordion ${isOpen ? 'is-open' : ''} ${childActive ? 'has-active-child' : ''
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            className={`sap-menu-item accordion-trigger ${childActive ? 'active-parent' : ''
                                                }`}
                                            onClick={() => toggleSubmenu(item.id)}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <span className="sap-icon-wrapper">{ICONS[item.icon]}</span>
                                            {!collapsed && (
                                                <>
                                                    <span className="sap-menu-label">{item.label}</span>
                                                    <span className="sap-chevron">{ICONS.chevron}</span>
                                                </>
                                            )}
                                        </button>

                                        {!collapsed && isOpen && (
                                            <div className="sap-submenu">
                                                {item.submenu.map((sub) => (
                                                    <NavLink
                                                        key={sub.path}
                                                        to={sub.path}
                                                        className={({ isActive }) =>
                                                            `sap-submenu-item ${isActive ? 'active' : ''}`
                                                        }
                                                    >
                                                        <span className="sap-sub-icon">{ICONS.dot}</span>
                                                        <span className="sap-submenu-label">{sub.label}</span>
                                                    </NavLink>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `sap-menu-item ${isActive ? 'active' : ''}`
                                    }
                                    title={collapsed ? item.label : undefined}
                                >
                                    <span className="sap-icon-wrapper">{ICONS[item.icon]}</span>
                                    {!collapsed && (
                                        <span className="sap-menu-label">{item.label}</span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* PIE DE PÁGINA / USUARIO */}
            <div className="sap-sidebar-footer">
                <div
                    className="sap-user-card"
                    title={collapsed ? user?.nombre || 'Edgar Barajas' : undefined}
                >
                    <div className="sap-avatar">
                        {getUserInitials(user?.nombre || 'Edgar Barajas')}
                    </div>
                    {!collapsed && (
                        <div className="sap-user-details">
                            <span className="sap-user-name">
                                {user?.nombre || 'Edgar Barajas'}
                            </span>
                            <span className="sap-user-role">
                                {user?.puesto || 'Analista de Manufactura'}
                            </span>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="sap-logout-btn"
                    title={collapsed ? 'Cerrar sesión' : undefined}
                >
                    <span className="sap-icon-wrapper">{ICONS.logout}</span>
                    {!collapsed && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
};