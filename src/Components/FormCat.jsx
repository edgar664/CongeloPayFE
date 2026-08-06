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
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import { ENDPOINTS } from '../api';

const INITIAL_FORM_STATE = {
    nombre: '',
    descripcion: ''
};

export default function CategoriaModal({ open, onClose, categoriaToEdit = null, onSuccess }) {
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        if (open) {
            if (categoriaToEdit) {
                setForm({
                    nombre: categoriaToEdit.nombre || '',
                    descripcion: categoriaToEdit.descripcion || ''
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setMensaje(null);
        }
    }, [open, categoriaToEdit]);

    const handleClose = useCallback(() => {
        if (loadingSubmit) return;
        setForm(INITIAL_FORM_STATE);
        setMensaje(null);
        onClose();
    }, [loadingSubmit, onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nombre.trim()) {
            setMensaje({ type: 'warning', text: 'El nombre de la categoría es obligatorio.' });
            return;
        }

        // Determinación segura del endpoint
        const isEditing = Boolean(categoriaToEdit?.id);
        const baseUrl = ENDPOINTS.CREATE_CATEGORIA || ENDPOINTS.categoriasProducto;

        if (!baseUrl) {
            setMensaje({ type: 'error', text: 'Error de configuración: El endpoint de categorías no está definido en api.js.' });
            return;
        }

        const endpoint = isEditing
            ? (typeof ENDPOINTS.UPDATE_CATEGORIA === 'function' 
                ? ENDPOINTS.UPDATE_CATEGORIA(categoriaToEdit.id) 
                : `${baseUrl}${categoriaToEdit.id}/`)
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
                    nombre: form.nombre.trim(),
                    descripcion: form.descripcion.trim() || null
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok || res.status === 201) {
                setMensaje({
                    type: 'success',
                    text: `Categoría ${isEditing ? 'actualizada' : 'registrada'} correctamente.`
                });

                if (onSuccess) onSuccess(data);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                setMensaje({
                    type: 'error',
                    text: data.detail || data.error || (typeof data === 'object' ? JSON.stringify(data) : 'Error al guardar la categoría.')
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
                    <CategoryIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {categoriaToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
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
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                required
                                name="nombre"
                                label="Nombre de la Categoría"
                                placeholder="Ej: Fruta Fresca, IQF, Empaque"
                                value={form.nombre}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                name="descripcion"
                                label="Descripción"
                                placeholder="Detalles o notas sobre la categoría..."
                                value={form.descripcion}
                                onChange={handleChange}
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
                        {loadingSubmit ? 'Guardando...' : (categoriaToEdit ? 'Actualizar Categoría' : 'Guardar Categoría')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}