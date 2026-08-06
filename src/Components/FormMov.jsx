import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    Alert,
    CircularProgress,
    Typography,
    Box,
    Paper,
    IconButton,
    InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScaleIcon from '@mui/icons-material/Scale';
import { ENDPOINTS } from '../api';

// Tipos de movimiento alineados con TipoMovimiento (TextChoices de Django)
const TIPOS_MOVIMIENTO = [
    { value: 'ENTRADA_RECEPCION', label: 'Entrada por Recepción de Fruta' },
    { value: 'ENTRADA_PRODUCCION', label: 'Entrada de Producto Terminado IQF' },
    { value: 'SALIDA_PRODUCCION', label: 'Salida a Proceso / Descongelado' },
    { value: 'SALIDA_EMBARQUE', label: 'Salida por Venta / Embarque' },
    { value: 'TRASPASO', label: 'Reubicación / Traspaso entre Cámaras' },
    { value: 'AJUSTE_MERMA', label: 'Ajuste por Merma / Desecho' }
];

const INITIAL_FORM_STATE = {
    tipo_movimiento: 'ENTRADA_RECEPCION',
    lote: '',
    ubicacion_origen: '',
    ubicacion_destino: '',
    empaque_tarima: '',
    empaque_caja: '',
    empaque_bolsa: '',
    cantidad_cajas: 0,
    peso_bruto_kg: '',
    observaciones: ''
};

export default function RecepcionBascula({ open, onClose, onSuccess }) {
    const [lotes, setLotes] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [empaques, setEmpaques] = useState([]);

    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [fetchingCatalogos, setFetchingCatalogos] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const handleClose = useCallback(() => {
        if (loadingSubmit) return;
        setForm(INITIAL_FORM_STATE);
        setMensaje(null);
        onClose();
    }, [loadingSubmit, onClose]);

    // Cargar catálogos dinámicos
    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();
        const token = localStorage.getItem('token');
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        };

        const fetchCatalogos = async () => {
            setFetchingCatalogos(true);
            setMensaje(null);

            try {
                const [resLotes, resUbic, resEmp] = await Promise.all([
                    fetch(ENDPOINTS.lotes || '/api/lotes/', { headers, signal: controller.signal }),
                    fetch(ENDPOINTS.ubicaciones || '/api/ubicaciones/', { headers, signal: controller.signal }),
                    fetch(ENDPOINTS.empaques || '/api/empaques/', { headers, signal: controller.signal })
                ]);

                if (!resLotes.ok || !resUbic.ok || !resEmp.ok) {
                    throw new Error('Error al cargar alguno de los catálogos.');
                }

                const [lotesData, ubicData, empData] = await Promise.all([
                    resLotes.json(),
                    resUbic.json(),
                    resEmp.json()
                ]);

                setLotes(Array.isArray(lotesData) ? lotesData : lotesData.results || []);
                setUbicaciones(Array.isArray(ubicData) ? ubicData : ubicData.results || []);
                setEmpaques(Array.isArray(empData) ? empData : empData.results || []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setMensaje({ type: 'error', text: err.message || 'Error al conectar con los catálogos.' });
                }
            } finally {
                setFetchingCatalogos(false);
            }
        };

        fetchCatalogos();

        return () => controller.abort();
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Cálculos dinámicos de tara y pesos netos
    const calculosDestare = useMemo(() => {
        const pesoBruto = parseFloat(form.peso_bruto_kg) || 0;
        const cantCajas = parseInt(form.cantidad_cajas, 10) || 0;

        const tarimaSeleccionada = empaques.find(e => String(e.id) === String(form.empaque_tarima));
        const cajaSeleccionada = empaques.find(e => String(e.id) === String(form.empaque_caja));
        const bolsaSeleccionada = empaques.find(e => String(e.id) === String(form.empaque_bolsa));

        const taraTarima = tarimaSeleccionada ? (parseFloat(tarimaSeleccionada.peso_tara_kg || tarimaSeleccionada.tara_kg) || 0) : 0;
        const taraCajaUnitaria = cajaSeleccionada ? (parseFloat(cajaSeleccionada.peso_tara_kg || cajaSeleccionada.tara_kg) || 0) : 0;
        const taraBolsaUnitaria = bolsaSeleccionada ? (parseFloat(bolsaSeleccionada.peso_tara_kg || bolsaSeleccionada.tara_kg) || 0) : 0;
        
        const taraTotalCajas = taraCajaUnitaria * cantCajas;
        const taraTotalBolsas = taraBolsaUnitaria * cantCajas;
        
        const taraTotal = taraTarima + taraTotalCajas + taraTotalBolsas;
        const pesoNetoKg = Math.max(0, pesoBruto - taraTotal);
        const pesoNetoLbs = pesoNetoKg * 2.20462;

        return {
            taraTarima,
            taraTotal,
            pesoNetoKg,
            pesoNetoLbs
        };
    }, [
        form.peso_bruto_kg, 
        form.cantidad_cajas, 
        form.empaque_tarima, 
        form.empaque_caja, 
        form.empaque_bolsa, 
        empaques
    ]);

    // Envío del registro del movimiento de inventario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.lote) {
            setMensaje({ type: 'warning', text: 'Debe seleccionar un Lote.' });
            return;
        }

        if (parseFloat(form.peso_bruto_kg) <= 0) {
            setMensaje({ type: 'warning', text: 'El peso bruto debe ser mayor a 0 kg.' });
            return;
        }

        setLoadingSubmit(true);
        setMensaje(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(ENDPOINTS.movimientosInventario || '/api/movimientos-inventario/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    tipo_movimiento: form.tipo_movimiento,
                    lote: form.lote,
                    ubicacion_origen: form.ubicacion_origen || null,
                    ubicacion_destino: form.ubicacion_destino || null,
                    empaque_tarima: form.empaque_tarima || null,
                    empaque_caja: form.empaque_caja || null,
                    empaque_bolsa: form.empaque_bolsa || null,
                    cantidad_cajas: parseInt(form.cantidad_cajas, 10) || 0,
                    peso_bruto_kg: parseFloat(form.peso_bruto_kg).toFixed(3),
                    tara_total_kg: calculosDestare.taraTotal.toFixed(3),
                    peso_neto_kg: calculosDestare.pesoNetoKg.toFixed(3),
                    peso_neto_lbs: calculosDestare.pesoNetoLbs.toFixed(3),
                    observaciones: form.observaciones || ''
                })
            });

            const data = await res.json();

            if (res.ok || res.status === 201) {
                setMensaje({ type: 'success', text: 'Movimiento de inventario registrado correctamente.' });
                setTimeout(() => {
                    handleClose();
                    if (onSuccess) onSuccess();
                }, 800);
            } else {
                const errDetail = data.detail || (typeof data === 'object' ? JSON.stringify(data) : 'Error al registrar la operación.');
                setMensaje({ type: 'error', text: errDetail });
            }
        } catch (err) {
            setMensaje({ type: 'error', text: 'Error de red o conexión con el servidor.' });
        } finally {
            setLoadingSubmit(false);
        }
    };

    const esTraspaso = form.tipo_movimiento === 'TRASPASO';
    const esSalida = form.tipo_movimiento.startsWith('SALIDA');
    const esEntrada = form.tipo_movimiento.startsWith('ENTRADA');

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 2 } } }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScaleIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        Captura de Pesaje / Movimiento de Inventario
                    </Typography>
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    disabled={loadingSubmit}
                    sx={{ color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {mensaje && (
                        <Alert severity={mensaje.type} sx={{ mb: 3 }} onClose={() => setMensaje(null)}>
                            {mensaje.text}
                        </Alert>
                    )}

                    {fetchingCatalogos ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, gap: 2 }}>
                            <CircularProgress size={30} />
                            <Typography color="text.secondary">Cargando catálogos del sistema...</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2.5}>
                            {/* Tipo Movimiento y Lote */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="tipo_movimiento"
                                    label="Tipo de Movimiento"
                                    value={form.tipo_movimiento}
                                    onChange={handleChange}
                                >
                                    {TIPOS_MOVIMIENTO.map(tm => (
                                        <MenuItem key={tm.value} value={tm.value}>
                                            {tm.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="lote"
                                    label="Lote"
                                    value={form.lote}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="" disabled><em>Seleccione un Lote</em></MenuItem>
                                    {lotes.map(l => (
                                        <MenuItem key={l.id} value={l.id}>
                                            {l.codigo_lote || l.lote_codigo} - {l.producto?.nombre || l.producto_nombre || 'Producto'}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Origen y Destino */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    name="ubicacion_origen"
                                    label="Ubicación Origen"
                                    value={form.ubicacion_origen}
                                    onChange={handleChange}
                                    required={esTraspaso || esSalida}
                                >
                                    <MenuItem value=""><em>Origen Externo / Ninguno</em></MenuItem>
                                    {ubicaciones.map(u => (
                                        <MenuItem key={u.id} value={u.id} disabled={u.bloqueada}>
                                            {u.nombre || u.codigo_ubicacion || u.codigo} {u.bloqueada ? '(BLOQUEADA)' : ''}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    name="ubicacion_destino"
                                    label="Ubicación Destino"
                                    value={form.ubicacion_destino}
                                    onChange={handleChange}
                                    required={esTraspaso || esEntrada}
                                >
                                    <MenuItem value=""><em>Destino Externo / Ninguno</em></MenuItem>
                                    {ubicaciones.map(u => (
                                        <MenuItem key={u.id} value={u.id} disabled={u.bloqueada}>
                                            {u.nombre || u.codigo_ubicacion || u.codigo} {u.bloqueada ? '(BLOQUEADA)' : ''}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Empaques */}
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    fullWidth
                                    name="empaque_tarima"
                                    label="Tarima"
                                    value={form.empaque_tarima}
                                    onChange={handleChange}
                                >
                                    <MenuItem value=""><em>Sin Tarima</em></MenuItem>
                                    {empaques.map(e => (
                                        <MenuItem key={e.id} value={e.id}>
                                            {e.nombre || e.tipo} ({parseFloat(e.peso_tara_kg || e.tara_kg || 0).toFixed(2)} kg)
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    fullWidth
                                    name="empaque_caja"
                                    label="Caja / Contenedor"
                                    value={form.empaque_caja}
                                    onChange={handleChange}
                                >
                                    <MenuItem value=""><em>Sin Caja</em></MenuItem>
                                    {empaques.map(e => (
                                        <MenuItem key={e.id} value={e.id}>
                                            {e.nombre || e.tipo} ({parseFloat(e.peso_tara_kg || e.tara_kg || 0).toFixed(2)} kg)
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    fullWidth
                                    name="empaque_bolsa"
                                    label="Bolsa Insumo"
                                    value={form.empaque_bolsa}
                                    onChange={handleChange}
                                >
                                    <MenuItem value=""><em>Sin Bolsa</em></MenuItem>
                                    {empaques.map(e => (
                                        <MenuItem key={e.id} value={e.id}>
                                            {e.nombre || e.tipo} ({parseFloat(e.peso_tara_kg || e.tara_kg || 0).toFixed(2)} kg)
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Cantidades y Pesos */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    type="number"
                                    fullWidth
                                    required
                                    name="cantidad_cajas"
                                    label="Cantidad Cajas / Bultos"
                                    value={form.cantidad_cajas}
                                    onChange={handleChange}
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    type="number"
                                    fullWidth
                                    required
                                    name="peso_bruto_kg"
                                    label="Peso Bruto Bascula (Kg)"
                                    value={form.peso_bruto_kg}
                                    onChange={handleChange}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                                    }}
                                    inputProps={{ step: "0.001", min: "0" }}
                                />
                            </Grid>

                            {/* Resumen de Destare Calculado */}
                            <Grid item xs={12}>
                                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" color="text.secondary">Tara Total</Typography>
                                            <Typography variant="h6">{calculosDestare.taraTotal.toFixed(3)} kg</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" color="text.secondary">Peso Neto (Kg)</Typography>
                                            <Typography variant="h6" color="primary.main">{calculosDestare.pesoNetoKg.toFixed(3)} kg</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" color="text.secondary">Peso Neto (Lbs)</Typography>
                                            <Typography variant="h6" color="secondary.main">{calculosDestare.pesoNetoLbs.toFixed(3)} lbs</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Observaciones */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    name="observaciones"
                                    label="Observaciones"
                                    value={form.observaciones}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} disabled={loadingSubmit}>
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loadingSubmit || fetchingCatalogos}
                    >
                        {loadingSubmit ? <CircularProgress size={24} /> : 'Guardar Movimiento'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}