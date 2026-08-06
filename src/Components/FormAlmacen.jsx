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
    Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { ENDPOINTS } from '../api';

const INITIAL_FORM_STATE = {
    codigo: '',
    nombre: '',
    direccion: '',
    activo: true
};

export default function FormAlmacen({ open, onClose, almacenToEdit = null, onSuccess }) {
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        if (open) {
            if (almacenToEdit) {
                setForm({
                    codigo: almacenToEdit.codigo || '',
                    nombre: almacenToEdit.nombre || '',
                    direccion: almacenToEdit.direccion || '',
                    activo: almacenToEdit.activo ?? almacenToEdit.is_active ?? true
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setMensaje(null);
        }
    }, [open, almacenToEdit]);

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

        if (!form.codigo.trim()) {
            setMensaje({ type: 'warning', text: 'El código del almacén es obligatorio.' });
            return;
        }

        if (!form.nombre.trim()) {
            setMensaje({ type: 'warning', text: 'El nombre del almacén es obligatorio.' });
            return;
        }

        // Determinación del endpoint
        const isEditing = Boolean(almacenToEdit?.id);
        const baseUrl = ENDPOINTS.CREATE_ALMACEN || ENDPOINTS.almacenes;

        if (!baseUrl) {
            setMensaje({ type: 'error', text: 'Error de configuración: El endpoint de almacenes no está definido en api.js.' });
            return;
        }

        const endpoint = isEditing
            ? (typeof ENDPOINTS.UPDATE_ALMACEN === 'function' 
                ? ENDPOINTS.UPDATE_ALMACEN(almacenToEdit.id) 
                : `${baseUrl}${almacenToEdit.id}/`)
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
                    codigo: form.codigo.trim(),
                    nombre: form.nombre.trim(),
                    direccion: form.direccion.trim() || null,
                    activo: form.activo
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok || res.status === 201) {
                setMensaje({
                    type: 'success',
                    text: `Almacén ${isEditing ? 'actualizado' : 'registrado'} correctamente.`
                });

                if (onSuccess) onSuccess(data);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                setMensaje({
                    type: 'error',
                    text: data.detail || data.error || (typeof data === 'object' ? JSON.stringify(data) : 'Error al guardar el almacén.')
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
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: { sx: { borderRadius: 2 } }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarehouseIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {almacenToEdit ? 'Editar Almacén' : 'Nuevo Almacén'}
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
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                required
                                name="codigo"
                                label="Código"
                                placeholder="Ej: ALM-01"
                                value={form.codigo}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                                fullWidth
                                required
                                name="nombre"
                                label="Nombre del Almacén"
                                placeholder="Ej: Almacén Central, Cámara 1"
                                value={form.nombre}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                name="direccion"
                                label="Dirección Física"
                                placeholder="Ej: Av. Central #123, Zamora, Michoacán"
                                value={form.direccion}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.activo}
                                        onChange={handleChange}
                                        name="activo"
                                        color="primary"
                                    />
                                }
                                label={form.activo ? "Almacén Activo / Operativo" : "Almacén Inactivo"}
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
                        {loadingSubmit ? 'Guardando...' : (almacenToEdit ? 'Actualizar Almacén' : 'Guardar Almacén')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}