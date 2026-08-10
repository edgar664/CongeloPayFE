const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
    login: `${BASE_URL}auth/login/`,
    empresa: `${BASE_URL}empresa/`,

    // Catálogos
    productos: `${BASE_URL}almacen/productos/`,
    almacenes: `${BASE_URL}almacenes/`,
    ubicaciones: `${BASE_URL}ubicaciones/`,
    lotes: `${BASE_URL}lotes/`,

    // Operaciones
    stockActual: `${BASE_URL}stock/actual/`,
    kardexLote: (id) => `${BASE_URL}kardex/lote/${id}/`,
    registrarEntrada: `${BASE_URL}operaciones/entrada/`,
    registrarTraspaso: `${BASE_URL}operaciones/traspaso/`,

    //almacen
    categoriasProducto: `${BASE_URL}almacen/categoriasProducto/`,
    unidadesMedida: `${BASE_URL}almacen/unidadesMedida/`,
    empaques: `${BASE_URL}almacen/empaques/`,
    almacenes: `${BASE_URL}almacen/almacenes/`,
    ubicaciones: `${BASE_URL}almacen/ubicaciones/`,
    movimientosInventario: `${BASE_URL}almacen/movimientos-inventario/`,
    tarimas: `${BASE_URL}almacen/movimientos-inventario/lote/<int:lote_id>/`,
    lotes: `${BASE_URL}almacen/lotes/`,
    getTarimasPorLote: (loteId) => `${BASE_URL}almacen/movimientos-inventario/lote/${loteId}/`,
    existencias: `${BASE_URL}almacen/stock-actual/`,
    registrarEntrada: `${BASE_URL}almacen/operaciones/entrada/`,
    traspasos: `${BASE_URL}almacen/operaciones/traspaso/`,


    //proveedores
    proveedores: `${BASE_URL}proveedores/proveedores/`,

};