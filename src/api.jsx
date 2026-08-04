// src/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
    login: `${BASE_URL}auth/login/`,
    empresa: `${BASE_URL}empresa/`,
   
};