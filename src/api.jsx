// src/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
    login: `${BASE_URL}/usuarios/login/`,
    empleados: `${BASE_URL}/apiEmp/empleados/`,
    entradas: `${BASE_URL}/apiInv/entradas/`,
    productos: `${BASE_URL}/apiInv/productos/`, 
    embaces: `${BASE_URL}/apiInv/embaces/`, 
    almacenes: `${BASE_URL}/apiInv/almacenes/`, 
    movimientos: `${BASE_URL}/apiInv/movimientos/`, 
    proveedores: `${BASE_URL}/apiProv/proveedores/`, 
    facturas: `${BASE_URL}/apiProv/facturas/`, 
    facturasCli: `${BASE_URL}/apiCli/facturas/`, 
    pagos: `${BASE_URL}/apiProv/pagos/`, 
    clientes: `${BASE_URL}apiCli/clientes/`, 
    conceptos: `${BASE_URL}/apiInv/conceptos/`, // NUEVO ENDPOINT PARA CONCEPTOS DE MOVIMIENTO
    
    // CORRECCIÓN AQUÍ: Cambia 'sincronizar-reloj/' por 'sincronizar/'
    sincronizarReloj: `${BASE_URL}/apiNom/reloj/sincronizar/`, 


};