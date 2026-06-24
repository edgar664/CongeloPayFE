// src/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
    login: `${BASE_URL}/usuarios/login/`,
    empleados: `${BASE_URL}/apiEmp/empleados/`,
    entradas: `${BASE_URL}/apiInv/entradas/`,
    facturas: `${BASE_URL}/apiProv/facturas/`, 
    facturasCli: `${BASE_URL}/apiCli/facturas/`, 
    pagos: `${BASE_URL}/apiProv/pagos/`, 
    
    // CORRECCIÓN AQUÍ: Cambia 'sincronizar-reloj/' por 'sincronizar/'
    sincronizarReloj: `${BASE_URL}/apiNom/reloj/sincronizar/`, 
    movimientos: `${BASE_URL}/apiInv/movimientos/`,
    productos: `${BASE_URL}apiInv/productos/`,
    almacenes: `${BASE_URL}apiInv/almacenes/`,
    conceptos: `${BASE_URL}apiInv/conceptos/`,
    embaces: `${BASE_URL}apiInv/embaces/`,
    tarimas: `${BASE_URL}apiInv/tarimas/`,
    proveedores: `${BASE_URL}apiInv/proveedores/`,
    clientes: `${BASE_URL}apiInv/clientes/`,
    stock: `${BASE_URL}apiInv/stockActual/`,

};