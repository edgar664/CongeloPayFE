import React, { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useCompany } from '../Context/CompanyContext';
import './Sidebar.css';

/* =========================================================================
 * ICONOS — trazo delgado estilo SAP Fiori / Lucide
 * Se definen fuera del componente para que NUNCA se recreen entre renders.
 * ===================================================================== */
const ICONS = Object.freeze({
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
    ),
    calidad: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
    ),
    catalogos: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
});

/* =========================================================================
 * CONFIGURACIÓN DE MÓDULOS — estática, fuera del componente.
 * `permission` es opcional: si el sidebar recibe la prop `permissions`
 * (array/Set de ids), solo se muestran los ítems permitidos.
 * ===================================================================== */
const MODULE_GROUPS = Object.freeze([
    {
        category: 'PRINCIPAL',
        items: [
            { id: 'dashboard', label: 'Panel Principal', icon: 'dashboard', path: '/dashboard' },
        ],
    },
    {
        category: 'GESTIÓN OPERATIVA',
        items: [
            {
                id: 'inventario',
                label: 'Inventarios y Almacén',
                icon: 'inventario',
                submenu: [
                    { label: 'Movimientos', path: '/almacen' },
                    { label: 'Ajustes de Inventario', path: '/ajustes' },
                ],
            },
            {
                id: 'personal',
                label: 'Recursos Humanos',
                icon: 'personal',
                submenu: [
                    { label: 'Directorio de Personal', path: '/personal' },
                    { label: 'Control de Asistencia', path: '/asistencia' },
                ],
            },
            {
                id: 'calidad',
                label: 'Calidad e Inocuidad',
                icon: 'calidad',
                submenu: [
                    { label: 'Directorio de Personal', path: '/personal' },
                    { label: 'Control de Asistencia', path: '/asistencia' },
                ],
            },
            
        ],
    },
    {
        category: 'CONFIGURACIÓN',
        items: [
            { id: 'sett', label: 'Panel de Configuración', icon: 'sett', path: '/configuracion' },
            {
                id: 'catalogos',
                label: 'Catálogos Maestros',
                icon: 'catalogos',
                submenu: [
                    { label: 'Catálogo de Productos', path: '/productos' },
                    { label: 'Catálogo de Categorías', path: '/categorias' },
                    { label: 'Unidades de Medida', path: '/unidades' },
                    { label: 'Catálogo de Empaques', path: '/empaques' },
                    { label: 'Catálogo de Almacenes', path: '/almacenes' },
                    { label: 'Catálogo de Ubicaciones', path: '/ubicaciones' },

                ],
            },
        ],
    },
]);

const STORAGE_KEY = 'sap:sidebar:collapsed';

const getUserInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
};

/* =========================================================================
 * SUBCOMPONENTES MEMOIZADOS
 * Aislar cada ítem evita que TODO el menú se vuelva a renderizar cuando
 * solo cambia el estado de un acordeón o el hover de otro elemento.
 * ===================================================================== */

const MenuLink = React.memo(function MenuLink({ item, collapsed }) {
    return (
        <NavLink
            to={item.path}
            className={({ isActive }) => `sap-menu-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
        >
            <span className="sap-icon-wrapper">{ICONS[item.icon]}</span>
            {!collapsed && <span className="sap-menu-label">{item.label}</span>}
        </NavLink>
    );
});

const MenuAccordion = React.memo(function MenuAccordion({
    item,
    collapsed,
    isOpen,
    isChildActive,
    onToggle,
    currentPath,
}) {
    const panelId = useId();

    return (
        <div className={`sap-menu-accordion ${isOpen ? 'is-open' : ''} ${isChildActive ? 'has-active-child' : ''}`}>
            <button
                type="button"
                className={`sap-menu-item accordion-trigger ${isChildActive ? 'active-parent' : ''}`}
                onClick={() => onToggle(item.id)}
                title={collapsed ? item.label : undefined}
                aria-expanded={!collapsed && isOpen}
                aria-controls={panelId}
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
                <div className="sap-submenu" id={panelId} role="group">
                    {item.submenu.map((sub) => (
                        <NavLink
                            key={sub.path}
                            to={sub.path}
                            className={() => `sap-submenu-item ${currentPath === sub.path ? 'active' : ''}`}
                        >
                            <span className="sap-sub-icon">{ICONS.dot}</span>
                            <span className="sap-submenu-label">{sub.label}</span>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
});

/* =========================================================================
 * COMPONENTE PRINCIPAL
 * ===================================================================== */
const SidebarComponent = ({
    user,
    handleLogout,
    collapsed: collapsedProp,
    setCollapsed: setCollapsedProp,
    permissions, // opcional: array/Set de ids visibles. undefined = mostrar todo.
}) => {
    const location = useLocation();
    const { company } = useCompany();

    // ---- Estado colapsado: controlado (props) o autónomo (localStorage) ----
    const isControlled = collapsedProp !== undefined && typeof setCollapsedProp === 'function';

    const [internalCollapsed, setInternalCollapsed] = useState(() => {
        if (isControlled) return collapsedProp;
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : false;
        } catch {
            return false;
        }
    });

    const collapsed = isControlled ? collapsedProp : internalCollapsed;

    const setCollapsed = useCallback(
        (value) => {
            const next = typeof value === 'function' ? value(collapsed) : value;
            if (isControlled) {
                setCollapsedProp(next);
            } else {
                setInternalCollapsed(next);
                try {
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                    /* localStorage no disponible: se ignora silenciosamente */
                }
            }
        },
        [collapsed, isControlled, setCollapsedProp]
    );

    // ---- Módulos visibles según permisos (memoizado) ----
    const visibleGroups = useMemo(() => {
        if (!permissions) return MODULE_GROUPS;
        const allowed = permissions instanceof Set ? permissions : new Set(permissions);
        return MODULE_GROUPS.map((group) => ({
            ...group,
            items: group.items.filter((item) => allowed.has(item.id)),
        })).filter((group) => group.items.length > 0);
    }, [permissions]);

    // ---- Submenú activo según ruta actual ----
    const activeParentId = useMemo(() => {
        for (const group of visibleGroups) {
            for (const item of group.items) {
                if (item.submenu?.some((sub) => sub.path === location.pathname)) {
                    return item.id;
                }
            }
        }
        return null;
    }, [visibleGroups, location.pathname]);

    const [openSubmenus, setOpenSubmenus] = useState({ inventario: true });

    // Se abre automáticamente el acordeón padre de la ruta activa (una sola escritura de estado)
    useEffect(() => {
        if (activeParentId) {
            setOpenSubmenus((prev) => (prev[activeParentId] ? prev : { ...prev, [activeParentId]: true }));
        }
    }, [activeParentId]);

    const toggleSubmenu = useCallback(
        (id) => {
            if (collapsed) {
                setCollapsed(false);
                setOpenSubmenus((prev) => ({ ...prev, [id]: true }));
                return;
            }
            setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
        },
        [collapsed, setCollapsed]
    );

    const isSubmenuActive = useCallback(
        (submenu) => submenu?.some((sub) => location.pathname === sub.path),
        [location.pathname]
    );

    const sidebarStyle = useMemo(
        () => ({ '--sidebar-primary-color': company?.color_primario || '#1B2A52' }),
        [company?.color_primario]
    );

    const displayName = user?.nombre || company?.usuario_defecto || 'Edgar Barajas';
    const displayRole = user?.puesto || 'Analista de Manufactura';
    const companyLabel = company?.nombre_comercial || 'Sistema ERP';

    return (
        <aside
            className={`sap-sidebar ${collapsed ? 'collapsed' : ''}`}
            aria-label="Navegación principal ERP"
            style={sidebarStyle}
        >
            {/* CABECERA / BRANDING DINÁMICO */}
            <div className="sap-sidebar-header">
                <div className="sap-brand" title={companyLabel}>
                    <div className="sap-brand-logo">
                        {company?.logo ? (
                            <img src={company.logo} alt={`Logo de ${companyLabel}`} className="sap-logo-img" />
                        ) : (
                            <span>{companyLabel ? companyLabel[0] : 'S'}</span>
                        )}
                    </div>
                    {!collapsed && (
                        <div className="sap-brand-info">
                            <span className="sap-brand-name">{companyLabel}</span>
                            <span className="sap-brand-system">{company?.subtitulo || 'ENTERPRISE ERP'}</span>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="sap-toggle-btn"
                    onClick={() => setCollapsed((prev) => !prev)}
                    title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                    aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                    aria-pressed={collapsed}
                >
                    {collapsed ? ICONS.expand : ICONS.collapse}
                </button>
            </div>

            {/* ÁREA DE NAVEGACIÓN */}
            <nav className="sap-sidebar-nav">
                {visibleGroups.map((group) => (
                    <div key={group.category} className="sap-nav-group">
                        {!collapsed && <div className="sap-group-title">{group.category}</div>}
                        {group.items.map((item) =>
                            item.submenu ? (
                                <MenuAccordion
                                    key={item.id}
                                    item={item}
                                    collapsed={collapsed}
                                    isOpen={Boolean(openSubmenus[item.id])}
                                    isChildActive={isSubmenuActive(item.submenu)}
                                    onToggle={toggleSubmenu}
                                    currentPath={location.pathname}
                                />
                            ) : (
                                <MenuLink key={item.id} item={item} collapsed={collapsed} />
                            )
                        )}
                    </div>
                ))}
            </nav>

            {/* PIE DE PÁGINA / USUARIO */}
            <div className="sap-sidebar-footer">
                <div className="sap-user-card" title={collapsed ? displayName : undefined}>
                    <div className="sap-avatar">{getUserInitials(displayName)}</div>
                    {!collapsed && (
                        <div className="sap-user-details">
                            <span className="sap-user-name">{displayName}</span>
                            <span className="sap-user-role">{displayRole}</span>
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

export const Sidebar = React.memo(SidebarComponent);