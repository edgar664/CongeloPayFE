import React, { useState, useEffect } from 'react';
import { Sidebar, Icon as SidebarIcon } from '../Components/Sidebar';
import { ENDPOINTS } from '../api'; // Importamos las rutas dinámicas
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    Typography, Box, Card, CardContent, Grid, TextField, InputAdornment 
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import SearchIcon from '@mui/icons-material/Search';
import './verRegistro.css';

export default function VerRegistro() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cargar registros de la fecha seleccionada
    useEffect(() => {
        fetchRegistros();
    }, [fecha]);

    const fetchRegistros = async () => {
        setLoading(true);
        try {
            // Suponiendo que filtramos por fecha en el backend
            const response = await fetch(`${ENDPOINTS.registros}?fecha=${fecha}`);
            const data = await response.json();
            setRegistros(data);
        } catch (error) {
            console.error("Error al cargar registros:", error);
        } finally {
            setLoading(false);
        }
    };

    // Preparar datos para las gráficas
    const dataGraficaBarras = registros.map(reg => ({
        nombre: reg.empleado_nombre.split(' ')[0], // Solo primer nombre
        cajas: reg.cajas_hechas,
        procesos: reg.procesos_hechos
    }));

    const asistencias = registros.filter(r => r.asistencia).length;
    const faltas = registros.length - asistencias;

    return (
        <div className={`pro-dashboard ${isCollapsed ? 'collapsed' : ''}`}>
            <Sidebar collapsed={isCollapsed} />
            <main className="pro-main">
                <header className="pro-top-nav">
                    <div className="header-left">
                        <button className="menu-hamburger" onClick={() => setIsCollapsed(!isCollapsed)}>
                            <SidebarIcon name="menu" />
                        </button>
                        <h1>Visualización de Nómina</h1>
                    </div>
                </header>

                <div className="pro-content-scroll">
                    <Box sx={{ p: 3 }}>
                        {/* HEADER DE FILTROS */}
                        <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h4" fontWeight="bold" color="#1e293b">
                                    Resumen Diario de Nómina
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Análisis de productividad, asistencia y esquemas de pago
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <TextField
                                    type="date"
                                    label="Filtrar por Fecha"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                />
                            </Grid>
                        </Grid>

                        {/* SECCIÓN DE GRÁFICAS */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} md={8}>
                                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Productividad por Empleado</Typography>
                                        <Box sx={{ width: '100%', height: 300 }}>
                                            <BarChart
                                                dataset={dataGraficaBarras}
                                                xAxis={[{ scaleType: 'band', dataKey: 'nombre' }]}
                                                series={[
                                                    { dataKey: 'cajas', label: 'Cajas', color: '#2563eb' },
                                                    { dataKey: 'procesos', label: 'Procesos', color: '#15803d' }
                                                ]}
                                                height={300}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Asistencia</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                            <PieChart
                                                series={[{
                                                    data: [
                                                        { id: 0, value: asistencias, label: 'Presentes', color: '#15803d' },
                                                        { id: 1, value: faltas, label: 'Faltas', color: '#dc2626' },
                                                    ],
                                                    innerRadius: 30,
                                                    paddingAngle: 5,
                                                    cornerRadius: 5,
                                                }]}
                                                width={300}
                                                height={200}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* TABLA MATERIAL UI */}
                        <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Empleado</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Asistencia</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cajas Hechas</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Procesos</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Horas Extra</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {registros.map((row) => (
                                        <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{ width: 32, height: 32, bgcolor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
                                                        {row.empleado_nombre.charAt(0)}
                                                    </Box>
                                                    {row.empleado_nombre}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <span className={`status-pill ${row.asistencia ? 'activo' : 'permiso'}`}>
                                                    {row.asistencia ? 'Presente' : 'Falta'}
                                                </span>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600 }}>{row.cajas_hechas}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600 }}>{row.procesos_hechos}</TableCell>
                                            <TableCell align="center">{row.horas_extra} hrs</TableCell>
                                        </TableRow>
                                    ))}
                                    {registros.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                                No hay registros para la fecha seleccionada.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </div>
            </main>
        </div>
    );
}