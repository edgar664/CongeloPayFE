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
import StraightenIcon from '@mui/icons-material/Straighten';
import { ENDPOINTS } from '../api';

const INITIAL_FORM_STATE = {
    codigo: '',
    nombre: '',
    es_unidad_peso: false
};

export default function FormUnidadMedida({ open, onClose, unidadToEdit = null, onSuccess }) {
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        if (open) {
            if (unidadToEdit) {
                setForm({
                    codigo: unidadToEdit.codigo || unidadToEdit.clave || unidadToEdit.simbolo || '',
                    nombre: unidadToEdit.nombre || '',
                    es_unidad_peso: Boolean(unidadToEdit.es_unidad_peso)
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setMensaje(null);
        }
    }, [open, unidadToEdit]);

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
            setMensaje({ type: 'warning', text: 'El código / símbolo es obligatorio.' });
            return;
        }

        if (!form.nombre.trim()) {
            setMensaje({ type: 'warning', text: 'El nombre de la unidad de medida es obligatorio.' });
            return;
        }

        const isEditing = Boolean(unidadToEdit?.id);
        const baseUrl = ENDPOINTS.unidadesMedida || ENDPOINTS.UNIDADES_MEDIDA || ENDPOINTS.CREATE_UNIDAD_MEDIDA;

        if (!baseUrl) {
            setMensaje({ type: 'error', text: 'Error de configuración: El endpoint de unidades de medida no está definido en api.js.' });
            return;
        }

        const endpoint = isEditing
            ? (typeof ENDPOINTS.UPDATE_UNIDAD_MEDIDA === 'function' 
                ? ENDPOINTS.UPDATE_UNIDAD_MEDIDA(unidadToEdit.id) 
                : `${baseUrl}${unidadToEdit.id}/`)
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
                    codigo: form.codigo.trim().toUpperCase(),
                    nombre: form.nombre.trim(),
                    es_unidad_peso: form.es_unidad_peso
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok || res.status === 201) {
                setMensaje({
                    type: 'success',
                    text: `Unidad de medida ${isEditing ? 'actualizada' : 'registrada'} correctamente.`
                });

                if (onSuccess) onSuccess(data);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                setMensaje({
                    type: 'error',
                    text: data.detail || data.error || (typeof data === 'object' ? JSON.stringify(data) : 'Error al guardar la unidad de medida.')
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
                    <StraightenIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {unidadToEdit ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
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
                        {/* Código / Símbolo */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                required
                                name="codigo"
                                label="Código / Símbolo"
                                placeholder="Ej: KG, LBS, CJ"
                                value={form.codigo}
                                onChange={handleChange}
                                slotProps={{
                                    htmlInput: {
                                        maxLength: 10,
                                        style: { textTransform: 'uppercase' }
                                    }
                                }}
                            />
                        </Grid>

                        {/* Nombre */}
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                                fullWidth
                                required
                                name="nombre"
                                label="Nombre de la Unidad"
                                placeholder="Ej: Kilogramo, Libra, Caja"
                                value={form.nombre}
                                onChange={handleChange}
                                slotProps={{
                                    htmlInput: {
                                        maxLength: 50
                                    }
                                }}
                            />
                        </Grid>

                        {/* Switch para es_unidad_peso */}
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.es_unidad_peso}
                                        onChange={handleChange}
                                        name="es_unidad_peso"
                                        color="primary"
                                    />
                                }
                                label="¿Es unidad de peso?"
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
                        {loadingSubmit ? 'Guardando...' : (unidadToEdit ? 'Actualizar Unidad' : 'Guardar Unidad')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}