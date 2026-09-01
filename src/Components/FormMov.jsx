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
    Autocomplete,
    Chip,
    Checkbox
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScaleIcon from '@mui/icons-material/Scale';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { ENDPOINTS } from '../api';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const TIPOS_MOVIMIENTO = [
    { value: 'TODOS', label: 'Todos los Tipos' },
    { value: 'ENTRADA_RECEPCION', label: 'Entrada por Recepción' },
    { value: 'ENTRADA_PRODUCCION', label: 'Entrada Producto IQF' },
    { value: 'SALIDA_PRODUCCION', label: 'Salida a Proceso' },
    { value: 'SALIDA_EMBARQUE', label: 'Salida por Embarque' },
    { value: 'TRASPASO', label: 'Traspaso / Reubicación' },
    { value: 'AJUSTE_MERMA', label: 'Ajuste por Merma' }
];

const INITIAL_FORM_STATE = {
    tipo_movimiento: 'ENTRADA_RECEPCION',
    lote: '',
    ubicacion_origen: '',
    ubicacion_destino: '',
    tarimas_seleccionadas: [], // <-- Nuevo campo para IDs de tarimas a mover
    empaque_tarima: '',
    empaque_caja: '',
    empaque_bolsa: '',
    unidades: 0,
    peso_bruto_kg: '',
    observaciones: '',
};

export default function RecepcionBascula({ open, onClose, onSuccess }) {
    const [lotes, setLotes] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [empaques, setEmpaques] = useState([]);

    // Nuevos estados para tarimas
    const [tarimasDisponibles, setTarimasDisponibles] = useState([]);
    const [fetchingTarimas, setFetchingTarimas] = useState(false);

    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [fetchingCatalogos, setFetchingCatalogos] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const handleClose = useCallback(() => {
        if (loadingSubmit) return;
        setForm(INITIAL_FORM_STATE);
        setTarimasDisponibles([]);
        setMensaje(null);
        onClose();
    }, [loadingSubmit, onClose]);

    // Carga inicial de catálogos generales
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
                    throw new Error('Error al cargar uno o varios catálogos del servidor.');
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
                    setMensaje({ type: 'error', text: err.message || 'Error al obtener catálogos.' });
                }
            } finally {
                setFetchingCatalogos(false);
            }
        };

        fetchCatalogos();

        return () => controller.abort();
    }, [open]);

    // Carga dinámica de tarimas al seleccionar un lote y/o ubicación origen
    useEffect(() => {
        if (!form.lote || form.tipo_movimiento !== 'TRASPASO') {
            setTarimasDisponibles([]);
            setForm(prev => ({ ...prev, tarimas_seleccionadas: [] }));
            return;
        }

        const controller = new AbortController();
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const fetchTarimas = async () => {
            setFetchingTarimas(true);
            try {
                // Endpoint configurable según backend (ejemplo: /api/tarimas/?lote_id=12&ubicacion_id=3)
                let url = `${ENDPOINTS.tarimas || '/api/tarimas/'}?lote_id=${form.lote}`;
                if (form.ubicacion_origen) {
                    url += `&ubicacion_id=${form.ubicacion_origen}`;
                }

                const res = await fetch(url, { headers, signal: controller.signal });
                if (res.ok) {
                    const data = await res.json();
                    setTarimasDisponibles(Array.isArray(data) ? data : data.results || []);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error al cargar tarimas del lote:', err);
                }
            } finally {
                setFetchingTarimas(false);
            }
        };

        fetchTarimas();

        return () => controller.abort();
    }, [form.lote, form.ubicacion_origen, form.tipo_movimiento]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Manejador del autocompletado de tarimas
    const handleTarimasChange = (event, newValue) => {
        // Recalcular unidades y peso si los datos vienen en la estructura de la tarima
        const totalCajas = newValue.reduce((acc, t) => acc + (t.num_cajas || t.unidades || 0), 0);
        const totalPeso = newValue.reduce((acc, t) => acc + (parseFloat(t.peso_bruto_kg || t.peso_kg) || 0), 0);

        setForm(prev => ({
            ...prev,
            tarimas_seleccionadas: newValue,
            unidades: totalCajas > 0 ? totalCajas : prev.unidades,
            peso_bruto_kg: totalPeso > 0 ? totalPeso.toFixed(2) : prev.peso_bruto_kg
        }));
    };

    const calculosDestare = useMemo(() => {
        const pesoBruto = parseFloat(form.peso_bruto_kg) || 0;
        const cantUnidades = parseInt(form.unidades, 10) || 0;

        const tarimaSeleccionada = empaques.find(e => String(e.id) === String(form.empaque_tarima));
        const cajaSeleccionada = empaques.find(e => String(e.id) === String(form.empaque_caja));
        const bolsaSeleccionada = empaques.find(e => String(e.id) === String(form.empaque_bolsa));

        const taraTarima = tarimaSeleccionada ? parseFloat(tarimaSeleccionada.peso_tara_kg || tarimaSeleccionada.tara_kg || 0) : 0;
        const taraCajaUnitaria = cajaSeleccionada ? parseFloat(cajaSeleccionada.peso_tara_kg || cajaSeleccionada.tara_kg || 0) : 0;
        const taraBolsaUnitaria = bolsaSeleccionada ? parseFloat(bolsaSeleccionada.peso_tara_kg || bolsaSeleccionada.tara_kg || 0) : 0;

        const taraTotalCajas = taraCajaUnitaria * cantUnidades;
        const taraTotalBolsas = taraBolsaUnitaria * cantUnidades;

        const taraTotal = taraTarima + taraTotalCajas + taraTotalBolsas;
        const pesoNetoKg = Math.max(0, pesoBruto - taraTotal);
        const pesoNetoLbs = pesoNetoKg * 2.20462;

        return {
            taraTotal,
            pesoNetoKg,
            pesoNetoLbs
        };
    }, [form.peso_bruto_kg, form.unidades, form.empaque_tarima, form.empaque_caja, form.empaque_bolsa, empaques]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.lote) {
            setMensaje({ type: 'warning', text: 'Debe seleccionar un Lote.' });
            return;
        }

        if (parseFloat(form.peso_bruto_kg) <= 0) {
            setMensaje({ type: 'warning', text: 'El peso ingresado debe ser mayor a 0 kg.' });
            return;
        }

        setLoadingSubmit(true);
        setMensaje(null);

        try {
            const token = localStorage.getItem('token');
            const isEntrada = form.tipo_movimiento === 'ENTRADA_RECEPCION';

            const endpointTarget = isEntrada
                ? (ENDPOINTS.registrarEntrada || '/api/registrar-entrada/')
                : (ENDPOINTS.registrarTraspaso || '/api/registrar-traspaso/');

            const cantUnidades = parseInt(form.unidades, 10) || 0;

            const payload = isEntrada ? {
                lote_id: parseInt(form.lote, 10),
                ubicacion_destino_id: form.ubicacion_destino ? parseInt(form.ubicacion_destino, 10) : null,
                peso_bruto_kg: parseFloat(form.peso_bruto_kg) || 0,
                empaque_tarima_id: form.empaque_tarima ? parseInt(form.empaque_tarima, 10) : null,
                empaque_caja_id: form.empaque_caja ? parseInt(form.empaque_caja, 10) : null,
                empaque_bolsa_id: form.empaque_bolsa ? parseInt(form.empaque_bolsa, 10) : null,
                unidades: cantUnidades,
                num_cajas: cantUnidades,
                observaciones: form.observaciones || ''
            } : {
                lote_id: parseInt(form.lote, 10),
                ubicacion_origen_id: parseInt(form.ubicacion_origen, 10),
                ubicacion_destino_id: parseInt(form.ubicacion_destino, 10),
                peso_a_mover_kg: parseFloat(form.peso_bruto_kg) || 0,
                unidades: cantUnidades,
                num_cajas: cantUnidades,
                tarimas_ids: form.tarimas_seleccionadas.map(t => t.id), // <-- Envío de IDs de tarimas seleccionadas al backend
                observaciones: form.observaciones || ''
            };

            const res = await fetch(endpointTarget, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setMensaje({ type: 'success', text: data.mensaje || 'Movimiento de inventario guardado correctamente.' });
                setTimeout(() => {
                    handleClose();
                    if (onSuccess) onSuccess();
                }, 800);
            } else {
                const errorText = data.error || data.detail || (typeof data === 'object' ? JSON.stringify(data) : 'Error al procesar la solicitud.');
                setMensaje({ type: 'error', text: errorText });
            }
        } catch (err) {
            setMensaje({ type: 'error', text: 'Error de red o pérdida de comunicación con el servidor.' });
        } finally {
            setLoadingSubmit(false);
        }
    };

    const esTraspaso = form.tipo_movimiento === 'TRASPASO';

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
                        Captura de Báscula / Movimiento Físico
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={loadingSubmit}>
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
                            <Typography color="text.secondary">Cargando catálogos...</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2.5}>
                            {/* TIPO DE OPERACION */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="tipo_movimiento"
                                    label="Tipo de Operación"
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

                            {/* SELECCIÓN DE LOTE */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="lote"
                                    label="Lote de Trazabilidad"
                                    value={form.lote}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="" disabled><em>Seleccione Lote</em></MenuItem>
                                    {lotes.map(l => (
                                        <MenuItem key={l.id} value={l.id}>
                                            {l.codigo_lote} - {l.producto?.nombre || 'Producto'}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* UBICACIÓN ORIGEN (SOLO TRASPASO) */}
                            {esTraspaso && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        required
                                        name="ubicacion_origen"
                                        label="Ubicación Origen"
                                        value={form.ubicacion_origen}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="" disabled><em>Seleccione Origen</em></MenuItem>
                                        {ubicaciones.map(u => (
                                            <MenuItem key={u.id} value={u.id}>
                                                {u.nombre_camara || u.codigo_ubicacion || u.codigo}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            )}

                            {/* UBICACIÓN DESTINO */}
                            <Grid size={{ xs: 12, sm: esTraspaso ? 6 : 12 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="ubicacion_destino"
                                    label="Ubicación Destino"
                                    value={form.ubicacion_destino}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="" disabled><em>Seleccione Destino</em></MenuItem>
                                    {ubicaciones.map(u => (
                                        <MenuItem key={u.id} value={u.id}>
                                            {u.nombre_camara || u.codigo}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* SELECCIÓN MÚLTIPLE DE TARIMAS / PALLETS (SOLO TRASPASO) */}
                            {esTraspaso && (
                                <Grid size={{ xs: 12 }}>
                                    <Autocomplete
                                        multiple
                                        options={tarimasDisponibles}
                                        // 1. renderTags debe ser prop directa de Autocomplete
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip
                                                    label={option.label || option}
                                                    {...getTagProps({ index })}
                                                    key={option.id || index}
                                                />
                                            ))
                                        }
                                        renderInput={(params) => {
                                            // 2. Extraemos InputProps para no duplicarlo ni pasarlo en el spread general
                                            const { InputProps, ...restParams } = params;

                                            return (
                                                <TextField
                                                    {...restParams}
                                                    label="Tarimas a Trasladar"
                                                    // 3. Pasamos InputProps de forma limpia y estructurada
                                                    InputProps={{
                                                        ...InputProps,
                                                        endAdornment: (
                                                            <React.Fragment>
                                                                {fetchingTarimas ? (
                                                                    <CircularProgress color="inherit" size={20} />
                                                                ) : null}
                                                                {InputProps?.endAdornment}
                                                            </React.Fragment>
                                                        ),
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                </Grid>
                            )}

                            {/* TARIMA (ENTRADA) */}
                            {!esTraspaso && (
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        name="empaque_tarima"
                                        label="Tarima / Pallet"
                                        value={form.empaque_tarima}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value=""><em>-- Sin Tarima --</em></MenuItem>
                                        {empaques.filter(e => e.tipo === 'TARIMA').map(e => (
                                            <MenuItem key={e.id} value={e.id}>
                                                {e.nombre} ({e.peso_tara_kg || e.tara_kg} kg)
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            )}

                            {/* CAJA (ENTRADA) */}
                            {!esTraspaso && (
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        name="empaque_caja"
                                        label="Tipo de Caja"
                                        value={form.empaque_caja}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value=""><em>-- Sin Caja --</em></MenuItem>
                                        {empaques.filter(e => e.tipo === 'CAJA').map(e => (
                                            <MenuItem key={e.id} value={e.id}>
                                                {e.nombre} ({e.peso_tara_kg || e.tara_kg} kg)
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            )}

                            {/* BOLSA (ENTRADA) */}
                            {!esTraspaso && (
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        name="empaque_bolsa"
                                        label="Tipo de Bolsa"
                                        value={form.empaque_bolsa}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value=""><em>-- Sin Bolsa --</em></MenuItem>
                                        {empaques.filter(e => e.tipo === 'BOLSA').map(e => (
                                            <MenuItem key={e.id} value={e.id}>
                                                {e.nombre} ({e.peso_tara_kg || e.tara_kg} kg)
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            )}

                            {/* UNIDADES / CAJAS */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="unidades"
                                    label="Número de Cajas / Bultos (Unidades)"
                                    value={form.unidades}
                                    onChange={handleChange}
                                    slotProps={{ htmlInput: { min: 0 } }}
                                />
                            </Grid>

                            {/* PESO BRUTO */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    name="peso_bruto_kg"
                                    label="Peso Bruto Capturado (Kg)"
                                    value={form.peso_bruto_kg}
                                    onChange={handleChange}
                                    slotProps={{ htmlInput: { step: '0.01', min: '0.01' } }}
                                />
                            </Grid>

                            {/* RESUMEN DE DESTARE Y PESO NETO CALCULADO */}
                            {!esTraspaso && (
                                <Grid size={{ xs: 12 }}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                        <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                                            Cálculo Automático de Destare
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Tara Total
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {calculosDestare.taraTotal.toFixed(2)} kg
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Peso Neto (Kg)
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" color="success.main">
                                                    {calculosDestare.pesoNetoKg.toFixed(2)} kg
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Peso Neto (Lbs)
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" color="success.main">
                                                    {calculosDestare.pesoNetoLbs.toFixed(2)} lbs
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            )}

                            {/* OBSERVACIONES */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    name="observaciones"
                                    label="Observaciones del Movimiento"
                                    placeholder="Notas adicionales para el registro de inventario..."
                                    value={form.observaciones}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleClose} color="inherit" disabled={loadingSubmit}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loadingSubmit || fetchingCatalogos}
                        startIcon={loadingSubmit && <CircularProgress size={18} color="inherit" />}
                    >
                        {loadingSubmit ? 'Procesando...' : 'Confirmar Movimiento'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}