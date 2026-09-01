const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
    // Auth & Empresa
    login: `${BASE_URL}auth/login/`,
    empresa: `${BASE_URL}empresa/`,

    // Almacén / Catálogos
    productos: `${BASE_URL}almacen/productos/`,
    categoriasProducto: `${BASE_URL}almacen/categoriasProducto/`,
    unidadesMedida: `${BASE_URL}almacen/unidadesMedida/`,
    empaques: `${BASE_URL}almacen/empaques/`,
    almacenes: `${BASE_URL}almacen/almacenes/`,
    ubicaciones: `${BASE_URL}almacen/ubicaciones/`,
    lotes: `${BASE_URL}almacen/lotes/`,

    // Movimientos / Tarimas
    movimientosInventario: `${BASE_URL}almacen/movimientos-inventario/`,
    // Se usa como función para inyectar el ID dinámicamente:
    tarimasPorLote: (loteId) => `${BASE_URL}almacen/movimientos-inventario/lote/${loteId}/`,
    getTarimasPorLote: (loteId) => `${BASE_URL}almacen/movimientos-inventario/lote/${loteId}/`,

    // Inventario y Operaciones
    existencias: `${BASE_URL}almacen/stock-actual/`,
    stockActual: `${BASE_URL}almacen/stock-actual/`,
    registrarEntrada: `${BASE_URL}almacen/operaciones/entrada/`,
    traspasos: `${BASE_URL}almacen/operaciones/traspaso/`,
    registrarTraspaso: `${BASE_URL}almacen/operaciones/traspaso/`,
    salidasProduccion: `${BASE_URL}almacen/registrar-salida-proceso/`,

    // Proveedores
    proveedores: `${BASE_URL}proveedores/proveedores/`,

    //calidad
    muestreo: `${BASE_URL}calidad/muestreos/`,
};