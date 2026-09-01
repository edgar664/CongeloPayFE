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
    FormControlLabel,
    Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { ENDPOINTS } from '../api';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const ESTADOS_LIBERACION = [
    { value: 'LIBERADO', label: 'Liberado (Aprobado Quality)' },
    { value: 'RETENIDO', label: 'Retenido / En Cuarentena' },
    { value: 'RECHAZADO', label: 'Rechazado / Desecho' },
    { value: 'LIBERADO_CONDICIONAL', label: 'Liberado Condicional (Proceso Especial)' }
];

const INITIAL_FORM_STATE = {
    lote: '',
    estado_liberacion: 'LIBERADO',
    liberar_todo_el_lote: true,
    tarimas_seleccionadas: [],
    motivo_retencion: '',
    observaciones: '',
    inspector_calidad: ''
};

export default function FormLiberacion({ open, onClose, onSuccess }) {
    const [lotes, setLotes] = useState([]);
    const [tarimasDisponibles, setTarimasDisponibles] = useState([]);
    const [fetchingLotes, setFetchingLotes] = useState(false);
    const [fetchingTarimas, setFetchingTarimas] = useState(false);

    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const handleClose = useCallback(() => {
        if (loadingSubmit) return;
        setForm(INITIAL_FORM_STATE);
        setTarimasDisponibles([]);
        setMensaje(null);
        onClose();
    }, [loadingSubmit, onClose]);

    // 1. Carga inicial de Lotes pendientes o activos
    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const fetchLotes = async () => {
            setFetchingLotes(true);
            setMensaje(null);

            try {
                const res = await fetch(ENDPOINTS.lotes || '/api/lotes/', { headers, signal: controller.signal });
                if (!res.ok) throw new Error('Error al consultar el catálogo de lotes.');

                const data = await res.json();
                setLotes(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setMensaje({ type: 'error', text: err.message || 'Error de conexión al cargar lotes.' });
                }
            } finally {
                setFetchingLotes(false);
            }
        };

        fetchLotes();

        return () => controller.abort();
    }, [open]);

    // 2. Carga dinámica de tarimas cuando NO se libera todo el lote y hay un lote seleccionado
    useEffect(() => {
        if (!form.lote || form.liberar_todo_el_lote) {
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

        // Reemplaza tu fetchTarimas por esto:
        const fetchTarimas = async () => {
            setFetchingTarimas(true);
            try {
                const url = `${ENDPOINTS.tarimas || '/api/tarimas/'}?lote_id=${form.lote}`;
                const res = await fetch(url, { headers, signal: controller.signal });

                if (!res.ok) {
                    throw new Error(`Error en el servidor: ${res.status} ${res.statusText}`);
                }

                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('La respuesta del servidor no es un JSON válido.');
                }

                const data = await res.json();
                setTarimasDisponibles(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error al obtener tarimas asociadas:', err.message);
                }
            } finally {
                setFetchingTarimas(false);
            }
        };
        fetchTarimas();

        return () => controller.abort();
    }, [form.lote, form.liberar_todo_el_lote]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleTarimasChange = (event, newValue) => {
        setForm(prev => ({
            ...prev,
            tarimas_seleccionadas: newValue
        }));
    };

    // Resumen dinámico del lote seleccionado
    const loteSeleccionadoInfo = useMemo(() => {
        if (!form.lote) return null;
        return lotes.find(l => String(l.id) === String(form.lote));
    }, [form.lote, lotes]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.lote) {
            setMensaje({ type: 'warning', text: 'Debe seleccionar un Lote para procesar.' });
            return;
        }

        if (!form.liberar_todo_el_lote && form.tarimas_seleccionadas.length === 0) {
            setMensaje({ type: 'warning', text: 'Seleccione al menos una tarima o active la liberación completa del lote.' });
            return;
        }

        if ((form.estado_liberacion === 'RETENIDO' || form.estado_liberacion === 'RECHAZADO') && !form.motivo_retencion.trim()) {
            setMensaje({ type: 'warning', text: 'Es obligatorio especificar el motivo de retención o rechazo.' });
            return;
        }

        setLoadingSubmit(true);
        setMensaje(null);

        try {
            const token = localStorage.getItem('token');
            const endpointTarget = ENDPOINTS.registrarLiberacion || '/api/liberaciones-calidad/';

            const payload = {
                lote_id: parseInt(form.lote, 10),
                estado_liberacion: form.estado_liberacion,
                liberar_todo_el_lote: form.liberar_todo_el_lote,
                tarimas_ids: form.liberar_todo_el_lote ? [] : form.tarimas_seleccionadas.map(t => t.id),
                motivo_retencion: form.motivo_retencion || null,
                observaciones: form.observaciones || '',
                inspector_calidad: form.inspector_calidad || ''
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
                setMensaje({ type: 'success', text: data.mensaje || 'Dictamen de calidad registrado correctamente.' });
                setTimeout(() => {
                    handleClose();
                    if (onSuccess) onSuccess();
                }, 800);
            } else {
                const errorText = data.error || data.detail || (typeof data === 'object' ? JSON.stringify(data) : 'Error al procesar la liberación.');
                setMensaje({ type: 'error', text: errorText });
            }
        } catch (err) {
            setMensaje({ type: 'error', text: 'Error de comunicación con el servidor de Calidad.' });
        } finally {
            setLoadingSubmit(false);
        }
    };

    const requiereMotivo = form.estado_liberacion === 'RETENIDO' || form.estado_liberacion === 'RECHAZADO';

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
                    <VerifiedIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        Dictamen y Liberación de Calidad (QA)
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

                    {fetchingLotes ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, gap: 2 }}>
                            <CircularProgress size={30} />
                            <Typography color="text.secondary">Cargando lotes para evaluación...</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2.5}>
                            {/* SELECCIÓN DE LOTE */}
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="lote"
                                    label="Lote a Evaluar"
                                    value={form.lote}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="" disabled><em>Seleccione un Lote</em></MenuItem>
                                    {lotes.map(l => (
                                        <MenuItem key={l.id} value={l.id}>
                                            {l.codigo_lote} - {l.producto?.nombre || 'Producto sin Nombre'}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* DICTAMEN / ESTADO */}
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="estado_liberacion"
                                    label="Dictamen de Calidad"
                                    value={form.estado_liberacion}
                                    onChange={handleChange}
                                >
                                    {ESTADOS_LIBERACION.map(est => (
                                        <MenuItem key={est.value} value={est.value}>
                                            {est.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* INFORMACIÓN DEL LOTE SELECCIONADO */}
                            {loteSeleccionadoInfo && (
                                <Grid size={{ xs: 12 }}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">Producto</Typography>
                                                <Typography variant="body2" fontWeight="bold">{loteSeleccionadoInfo.producto?.nombre || 'N/A'}</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">Estado Actual Lote</Typography>
                                                <Chip
                                                    label={loteSeleccionadoInfo.estado || 'PENDIENTE'}
                                                    size="small"
                                                    color={loteSeleccionadoInfo.estado === 'LIBERADO' ? 'success' : 'warning'}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">Total Tarimas Lote</Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {loteSeleccionadoInfo.total_tarimas || loteSeleccionadoInfo.tarimas_count || 'N/D'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            )}

                            {/* SWITCH: LIBERAR TODO EL LOTE O PARCIAL */}
                            <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.liberar_todo_el_lote}
                                            onChange={handleChange}
                                            name="liberar_todo_el_lote"
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography variant="subtitle2" fontWeight="medium">
                                            Aplicar dictamen a TODO el lote completo
                                        </Typography>
                                    }
                                />
                            </Grid>

                            {/* SELECCIÓN MÚLTIPLE DE TARIMAS (SI NO ES TODO EL LOTE) */}
                            {!form.liberar_todo_el_lote && (
                                <Grid size={{ xs: 12 }}>
                                    <Autocomplete
                                        multiple
                                        options={tarimasDisponibles}
                                        disableCloseOnSelect
                                        getOptionLabel={(option) => option.label || option.folio_tarima || `Tarima #${option.id}`}
                                        value={form.tarimas_seleccionadas}
                                        onChange={handleTarimasChange}
                                        renderOption={(props, option, { selected }) => {
                                            const { key, ...optionProps } = props;
                                            return (
                                                <li key={key || option.id} {...optionProps}>
                                                    <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                                        {selected ? checkedIcon : icon}
                                                    </Box>
                                                    {option.label || `${option.folio_tarima || 'Tarima ' + option.id} - ${option.peso_bruto_kg || option.peso_kg || 0} kg`}
                                                </li>
                                            );
                                        }}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip
                                                    label={option.label || option.folio_tarima || `Tarima #${option.id}`}
                                                    {...getTagProps({ index })}
                                                    key={option.id || index}
                                                    size="small"
                                                />
                                            ))
                                        }
                                        renderInput={(params) => {
                                            const { InputProps, ...restParams } = params;
                                            return (
                                                <TextField
                                                    {...restParams}
                                                    label="Tarimas Especificas a Liberar / Retener"
                                                    placeholder="Seleccione tarimas"
                                                    InputProps={{
                                                        ...InputProps,
                                                        endAdornment: (
                                                            <React.Fragment>
                                                                {fetchingTarimas ? <CircularProgress color="inherit" size={20} /> : null}
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

                            {/* MOTIVO DE RETENCIÓN O RECHAZO */}
                            {requiereMotivo && (
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        required={requiereMotivo}
                                        name="motivo_retencion"
                                        label="Motivo de Retención o Rechazo"
                                        placeholder="Ej. Parámetros microbiológicos fuera de norma, defecto físico en empaque..."
                                        value={form.motivo_retencion}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            )}

                            {/* INSPECTOR DE CALIDAD */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    name="inspector_calidad"
                                    label="Inspector / Auditor QA"
                                    value={form.inspector_calidad}
                                    onChange={handleChange}
                                    placeholder="Nombre de quien valida"
                                />
                            </Grid>

                            {/* OBSERVACIONES GENERALES */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    name="observaciones"
                                    label="Observaciones o Notas del Dictamen"
                                    value={form.observaciones}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} disabled={loadingSubmit} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color={form.estado_liberacion === 'RECHAZADO' ? 'error' : form.estado_liberacion === 'RETENIDO' ? 'warning' : 'primary'}
                        disabled={loadingSubmit || fetchingLotes}
                        startIcon={loadingSubmit ? <CircularProgress size={20} color="inherit" /> : <VerifiedIcon />}
                    >
                        {loadingSubmit ? 'Guardando...' : 'Confirmar Dictamen'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}