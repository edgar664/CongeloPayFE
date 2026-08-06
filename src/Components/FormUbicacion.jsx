import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Alert,
    CircularProgress,
    Typography,
    Box,
    IconButton,
    FormControlLabel,
    Switch,
    MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlaceIcon from '@mui/icons-material/Place';
import { ENDPOINTS } from '../api';

const TIPOS_UBICACION = [
    { value: 'PATIO', label: 'Patio / Recepción' },
    { value: 'TUNEL', label: 'Túnel de Congelado (IQF)' },
    { value: 'CAMARA', label: 'Cámara de Conservación' },
    { value: 'CAMARA', label: 'Cámara de Congelación' },
    { value: 'EMBARQUE', label: 'Muelle de Embarque' },
    { value: 'GENERAL', label: 'Almacén General / Secos' },
];

const INITIAL_FORM_STATE = {
    almacen: '',
    codigo_ubicacion: '',
    nombre: '',
    tipo: 'CAMARA',
    temperatura_objetivo: '',
    bloqueada: false
};

export default function FormUbicacion({ open, onClose, ubicacionToEdit = null, onSuccess }) {
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [almacenes, setAlmacenes] = useState([]);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingAlmacenes, setLoadingAlmacenes] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    // Cargar catálogo de almacenes para el select de ForeignKey
    const fetchAlmacenesList = useCallback(async () => {
        setLoadingAlmacenes(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(ENDPOINTS.almacenes, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setAlmacenes(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) {
            console.error('Error al obtener lista de almacenes:', err);
        } finally {
            setLoadingAlmacenes(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchAlmacenesList();
            if (ubicacionToEdit) {
                setForm({
                    almacen: ubicacionToEdit.almacen?.id || ubicacionToEdit.almacen || '',
                    codigo_ubicacion: ubicacionToEdit.codigo_ubicacion || '',
                    nombre: ubicacionToEdit.nombre || '',
                    tipo: ubicacionToEdit.tipo || 'CAMARA',
                    temperatura_objetivo: ubicacionToEdit.temperatura_objetivo ?? '',
                    bloqueada: ubicacionToEdit.bloqueada ?? false
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setMensaje(null);
        }
    }, [open, ubicacionToEdit, fetchAlmacenesList]);

    const handleClose = useCallback(() => {
        if (loadingSubmit) return;
        setForm(INITIAL_FORM_STATE);
        setMensaje(null);
        onClose();
    }, [loadingSubmit, onClose]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.almacen) {
            setMensaje({ type: 'warning', text: 'Debe seleccionar un almacén.' });
            return;
        }

        if (!form.codigo_ubicacion.trim()) {
            setMensaje({ type: 'warning', text: 'El código de ubicación es obligatorio.' });
            return;
        }

        if (!form.nombre.trim()) {
            setMensaje({ type: 'warning', text: 'El nombre o descripción de la ubicación es obligatorio.' });
            return;
        }

        const isEditing = Boolean(ubicacionToEdit?.id);
        const baseUrl = ENDPOINTS.CREATE_UBICACION || ENDPOINTS.ubicaciones;

        if (!baseUrl) {
            setMensaje({ type: 'error', text: 'Error de configuración: El endpoint de ubicaciones no está definido en api.js.' });
            return;
        }

        const endpoint = isEditing
            ? (typeof ENDPOINTS.UPDATE_UBICACION === 'function' 
                ? ENDPOINTS.UPDATE_UBICACION(ubicacionToEdit.id) 
                : `${baseUrl}${ubicacionToEdit.id}/`)
            : baseUrl;

        const method = isEditing ? 'PUT' : 'POST';

        setLoadingSubmit(true);
        setMensaje(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    almacen: form.almacen,
                    codigo_ubicacion: form.codigo_ubicacion.trim(),
                    nombre: form.nombre.trim(),
                    tipo: form.tipo,
                    temperatura_objetivo: form.temperatura_objetivo !== '' ? parseFloat(form.temperatura_objetivo) : null,
                    bloqueada: form.bloqueada
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok || res.status === 201) {
                setMensaje({
                    type: 'success',
                    text: `Ubicación ${isEditing ? 'actualizada' : 'registrada'} correctamente.`
                });

                if (onSuccess) onSuccess(data);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                setMensaje({
                    type: 'error',
                    text: data.detail || data.error || (typeof data === 'object' ? JSON.stringify(data) : 'Error al guardar la ubicación.')
                });
            }
        } catch (err) {
            setMensaje({ type: 'error', text: 'Error de red o conexión con el servidor.' });
        } finally {
            setLoadingSubmit(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: { sx: { borderRadius: 2 } }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlaceIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {ubicacionToEdit ? 'Editar Ubicación' : 'Nueva Ubicación'}
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

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                fullWidth
                                required
                                name="almacen"
                                label="Almacén"
                                value={form.almacen}
                                onChange={handleChange}
                                disabled={loadingAlmacenes}
                            >
                                {loadingAlmacenes ? (
                                    <MenuItem disabled value="">Cargando almacenes...</MenuItem>
                                ) : (
                                    almacenes.map((alm) => (
                                        <MenuItem key={alm.id} value={alm.id}>
                                            {alm.codigo} - {alm.nombre}
                                        </MenuItem>
                                    ))
                                )}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                name="codigo_ubicacion"
                                label="Código de Ubicación"
                                placeholder="Ej: CAM-01-R02-A"
                                value={form.codigo_ubicacion}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                name="nombre"
                                label="Nombre / Descripción"
                                placeholder="Ej: Pasillo A Rack 2 Nivel 1"
                                value={form.nombre}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                fullWidth
                                required
                                name="tipo"
                                label="Tipo de Ubicación"
                                value={form.tipo}
                                onChange={handleChange}
                            >
                                {TIPOS_UBICACION.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                slotProps={{ htmlInput: { step: '0.01' } }}
                                name="temperatura_objetivo"
                                label="Temperatura Objetivo (°C)"
                                placeholder="Ej: -18.00"
                                value={form.temperatura_objetivo}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.bloqueada}
                                        onChange={handleChange}
                                        name="bloqueada"
                                        color="error"
                                    />
                                }
                                label={form.bloqueada ? "Ubicación Bloqueada (No disponible)" : "Ubicación Disponible"}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={handleClose}
                        color="inherit"
                        disabled={loadingSubmit}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loadingSubmit}
                        startIcon={loadingSubmit && <CircularProgress size={18} color="inherit" />}
                    >
                        {loadingSubmit ? 'Guardando...' : (ubicacionToEdit ? 'Actualizar Ubicación' : 'Guardar Ubicación')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}