import React, { createContext, useContext, useState, useEffect } from 'react';
import { ENDPOINTS } from '../api';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
    const [company, setCompany] = useState({
        nombre_comercial: 'Sano y Nutritivo',
        subtitulo: '',
        logo: '',
        color_primario: '#1B2A52',
        color_secundario: '#4EA93B',
        color_acento: '#C81D31'
    });

    const fetchCompanyData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(ENDPOINTS.empresa, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCompany({
                    nombre_comercial: data.nombre_comercial,
                    subtitulo: data.subtitulo,
                    logo: data.logo, // URL que devuelve Django ImageField
                    color_primario: data.color_primario,
                    color_secundario: data.color_secundario,
                    color_acento: data.color_acento
                });

                // Opcional: Inyectar los colores corporativos como variables CSS globales de golpe
                document.documentElement.style.setProperty('--color-primary', data.color_primario);
                document.documentElement.style.setProperty('--color-secondary', data.color_secundario);
            }
        } catch (error) {
            console.error('Error al sincronizar datos de la empresa:', error);
        }
    };

    useEffect(() => {
        fetchCompanyData();
    }, []);

    return (
        <CompanyContext.Provider value={{ company, fetchCompanyData }}>
            {children}
        </CompanyContext.Provider>
    );
}

export const useCompany = () => useContext(CompanyContext);