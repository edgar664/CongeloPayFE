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
import BusinessIcon from '@mui/icons-material/Business';
import { ENDPOINTS } from '../api';

const INITIAL_FORM_STATE = {
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    rfc: ''
};

export default function FormProveedor({ open, onClose, proveedorToEdit = null, onSuccess }) {
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        if (open) {
            if (proveedorToEdit) {
                setForm({
                    nombre: proveedorToEdit.nombre || '',
                    direccion: proveedorToEdit.direccion || '',
                    telefono: proveedorToEdit.telefono || '',
                    email: proveedorToEdit.email || '',
                    rfc: proveedorToEdit.rfc || ''
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setMensaje(null);
        }
    }, [open, proveedorToEdit]);

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
            [name]: name === 'rfc' ? value.toUpperCase() : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación de campos obligatorios según el modelo Django
        if (
            !form.nombre.trim() ||
            !form.direccion.trim() ||
            !form.telefono.trim() ||
            !form.email.trim() ||
            !form.rfc.trim()
        ) {
            setMensaje({ type: 'warning', text: 'Todos los campos son obligatorios.' });
            return;
        }

        // Determinación segura del endpoint
        const isEditing = Boolean(proveedorToEdit?.id);
        const baseUrl = ENDPOINTS.CREATE_PROVEEDOR || ENDPOINTS.proveedores;

        if (!baseUrl) {
            setMensaje({ 
                type: 'error', 
                text: 'Error de configuración: El endpoint de proveedores no está definido en api.js.' 
            });
            return;
        }

        const endpoint = isEditing
            ? (typeof ENDPOINTS.UPDATE_PROVEEDOR === 'function' 
                ? ENDPOINTS.UPDATE_PROVEEDOR(proveedorToEdit.id) 
                : `${baseUrl}${proveedorToEdit.id}/`)
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
                    direccion: form.direccion.trim(),
                    telefono: form.telefono.trim(),
                    email: form.email.trim().toLowerCase(),
                    rfc: form.rfc.trim().toUpperCase()
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok || res.status === 201) {
                setMensaje({
                    type: 'success',
                    text: `Proveedor ${isEditing ? 'actualizado' : 'registrado'} correctamente.`
                });

                if (onSuccess) onSuccess(data);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                setMensaje({
                    type: 'error',
                    text: data.detail || data.error || (typeof data === 'object' ? JSON.stringify(data) : 'Error al guardar el proveedor.')
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
                    <BusinessIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {proveedorToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                        {/* Nombre / Razón Social */}
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                                fullWidth
                                required
                                name="nombre"
                                label="Nombre / Razón Social"
                                placeholder="Ej: Agroservicios Zamora S.A. de C.V."
                                value={form.nombre}
                                onChange={handleChange}
                                inputProps={{ maxLength: 100 }}
                            />
                        </Grid>

                        {/* RFC */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                required
                                name="rfc"
                                label="RFC"
                                placeholder="Ej: AZA120315XXX"
                                value={form.rfc}
                                onChange={handleChange}
                                inputProps={{ maxLength: 13, style: { textTransform: 'uppercase' } }}
                            />
                        </Grid>

                        {/* Teléfono */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                name="telefono"
                                label="Teléfono de Contacto"
                                placeholder="Ej: 3511234567"
                                value={form.telefono}
                                onChange={handleChange}
                                inputProps={{ maxLength: 15 }}
                            />
                        </Grid>

                        {/* Correo Electrónico */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                type="email"
                                name="email"
                                label="Correo Electrónico"
                                placeholder="contacto@proveedor.com"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* Dirección */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                required
                                name="direccion"
                                label="Dirección Fiscal / Física"
                                placeholder="Ej: Av. Juárez #123, Col. Centro, Zamora, Michoacán"
                                value={form.direccion}
                                onChange={handleChange}
                                inputProps={{ maxLength: 200 }}
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
                        {loadingSubmit ? 'Guardando...' : (proveedorToEdit ? 'Actualizar Proveedor' : 'Guardar Proveedor')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}