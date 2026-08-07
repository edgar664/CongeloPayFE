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
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import { ENDPOINTS } from '../api';

const INITIAL_FORM_STATE = {
    codigo_lote: '',
    producto: '',
    variedad: '',
    proveedor: '',
    fecha_proceso: '',
    fecha_caducidad: '',
    estado_calidad: 'CUARENTENA',
    observaciones: ''
};

export default function FormLote({ open, onClose, loteToEdit = null, onSuccess }) {
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);

    const fetchCatalogos = useCallback(async () => {
        setLoadingCatalogs(true);
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        try {
            const [resProductos, resProveedores] = await Promise.all([
                fetch(ENDPOINTS.productos || '/api/productos/', { headers }).catch(() => null),
                fetch(ENDPOINTS.proveedores || '/api/proveedores/', { headers }).catch(() => null)
            ]);

            if (resProductos && resProductos.ok) {
                const dataProd = await resProductos.json();
                setProductos(Array.isArray(dataProd) ? dataProd : (dataProd.results || []));
            }

            if (resProveedores && resProveedores.ok) {
                const dataProv = await resProveedores.json();
                setProveedores(Array.isArray(dataProv) ? dataProv : (dataProv.results || []));
            }
        } catch (err) {
            console.error('Error al cargar catálogos auxiliares:', err);
        } finally {
            setLoadingCatalogs(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchCatalogos();

            if (loteToEdit) {
                setForm({
                    codigo_lote: loteToEdit.codigo_lote || '',
                    producto: typeof loteToEdit.producto === 'object' ? (loteToEdit.producto?.id || '') : (loteToEdit.producto || ''),
                    variedad: loteToEdit.variedad || '',
                    proveedor: typeof loteToEdit.proveedor === 'object' ? (loteToEdit.proveedor?.id || '') : (loteToEdit.proveedor || ''),
                    fecha_proceso: loteToEdit.fecha_proceso || '',
                    fecha_caducidad: loteToEdit.fecha_caducidad || '',
                    estado_calidad: loteToEdit.estado_calidad || 'CUARENTENA',
                    observaciones: loteToEdit.observaciones || ''
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setMensaje(null);
        }
    }, [open, loteToEdit, fetchCatalogos]);

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

        if (!form.codigo_lote.trim()) {
            setMensaje({ type: 'warning', text: 'El código de lote es obligatorio.' });
            return;
        }

        if (!form.producto) {
            setMensaje({ type: 'warning', text: 'Debe seleccionar un producto.' });
            return;
        }

        const isEditing = Boolean(loteToEdit?.id);
        const baseUrl = ENDPOINTS.CREATE_LOTE || ENDPOINTS.lotes || '/api/lotes/';

        if (!baseUrl) {
            setMensaje({ type: 'error', text: 'Error de configuración: El endpoint de lotes no está definido.' });
            return;
        }

        const endpoint = isEditing
            ? (typeof ENDPOINTS.UPDATE_LOTE === 'function'
                ? ENDPOINTS.UPDATE_LOTE(loteToEdit.id)
                : `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${loteToEdit.id}/`)
            : baseUrl;

        const method = isEditing ? 'PUT' : 'POST';

        setLoadingSubmit(true);
        setMensaje(null);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                codigo_lote: form.codigo_lote.trim(),
                producto: form.producto,
                variedad: form.variedad.trim() || null,
                proveedor: form.proveedor || null,
                fecha_proceso: form.fecha_proceso || null,
                fecha_caducidad: form.fecha_caducidad || null,
                estado_calidad: form.estado_calidad,
                observaciones: form.observaciones.trim() || null
            };

            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok || res.status === 201) {
                setMensaje({
                    type: 'success',
                    text: `Lote ${isEditing ? 'actualizado' : 'registrado'} correctamente.`
                });

                if (onSuccess) onSuccess(data);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                setMensaje({
                    type: 'error',
                    text: data.detail || data.error || (typeof data === 'object' ? JSON.stringify(data) : 'Error al guardar el lote.')
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
            slotProps={{ paper: { sx: { borderRadius: 2 } } }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {loteToEdit ? 'Editar Lote (Trazabilidad)' : 'Nuevo Lote (Trazabilidad)'}
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

                    {loadingCatalogs ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : (
                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    name="codigo_lote"
                                    label="Código de Lote"
                                    placeholder="Ej: LOT-2026-F01"
                                    value={form.codigo_lote}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel id="select-producto-label">Producto</InputLabel>
                                    <Select
                                        labelId="select-producto-label"
                                        name="producto"
                                        value={form.producto}
                                        label="Producto"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value=""><em>-- Seleccionar Producto --</em></MenuItem>
                                        {productos.map((prod) => (
                                            <MenuItem key={prod.id} value={prod.id}>
                                                {prod.nombre || prod.descripcion}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    name="variedad"
                                    label="Variedad"
                                    placeholder="Ej: Fresa Fortuna, Zarzamora Tupi"
                                    value={form.variedad}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="select-proveedor-label">Proveedor</InputLabel>
                                    <Select
                                        labelId="select-proveedor-label"
                                        name="proveedor"
                                        value={form.proveedor}
                                        label="Proveedor"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value=""><em>-- Sin Proveedor / Interno --</em></MenuItem>
                                        {proveedores.map((prov) => (
                                            <MenuItem key={prov.id} value={prov.id}>
                                                {prov.nombre || prov.razon_social}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    name="fecha_proceso"
                                    label="Fecha de Proceso / Cosecha"
                                    value={form.fecha_proceso}
                                    onChange={handleChange}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    name="fecha_caducidad"
                                    label="Fecha de Caducidad"
                                    value={form.fecha_caducidad}
                                    onChange={handleChange}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    name="observaciones"
                                    label="Observaciones de Trazabilidad"
                                    placeholder="Notas sobre campo, folio de cosecha, auditoría de calidad..."
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
                        disabled={loadingSubmit || loadingCatalogs}
                        startIcon={loadingSubmit && <CircularProgress size={18} color="inherit" />}
                    >
                        {loadingSubmit ? 'Guardando...' : (loteToEdit ? 'Actualizar Lote' : 'Guardar Lote')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}