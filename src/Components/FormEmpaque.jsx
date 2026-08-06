import React, { useState, useEffect, useCallback } from 'react';
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
    IconButton,
    FormControlLabel,
    Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import { ENDPOINTS } from '../api';

// Opciones sincronizadas con TipoEmpaque TextChoices del modelo Django
const TIPOS_EMPAQUE = [
    { value: 'TARIMA', label: 'Tarima / Pallet' },
    { value: 'CAJA', label: 'Caja de Cartón / Plástico' },
    { value: 'BOLSA', label: 'Bolsa / Liner Poly' },
    { value: 'TOTE', label: 'Tote / Macroplástico' },
    { value: 'CLAMSHELL', label: 'Clamshell' },
    { value: 'OTRO', label: 'Otros Insumos' },
];

const INITIAL_FORM_STATE = {
    nombre: '',
    tipo: '',
    peso_tara_kg: '0.000',
    producto_insumo_id: '',
    activo: true
};

export default function EmpaqueModal({ open, onClose, empaqueToEdit = null, onSuccess }) {
    const [productosInsumo, setProductosInsumo] = useState([]);

    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [fetchingCatalogos, setFetchingCatalogos] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    // Cargar o limpiar datos del formulario cuando cambia `empaqueToEdit` o `open`
    useEffect(() => {
        if (open) {
            if (empaqueToEdit) {
                setForm({
                    nombre: empaqueToEdit.nombre || '',
                    tipo: empaqueToEdit.tipo || '',
                    peso_tara_kg: empaqueToEdit.peso_tara_kg ?? '0.000',
                    producto_insumo_id: empaqueToEdit.producto_insumo?.id || empaqueToEdit.producto_insumo || '',
                    activo: empaqueToEdit.activo ?? true
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setMensaje(null);
        }
    }, [open, empaqueToEdit]);

    // Reiniciar estado y cerrar diálogo
    const handleClose = useCallback(() => {
        if (loadingSubmit) return;
        setForm(INITIAL_FORM_STATE);
        setMensaje(null);
        onClose();
    }, [loadingSubmit, onClose]);

    // Cargar catálogo auxiliar de Productos / Insumos
    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();
        const token = localStorage.getItem('token');
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        };

        const fetchProductos = async () => {
            setFetchingCatalogos(true);
            setMensaje(null);

            try {
                const res = await fetch(ENDPOINTS.productos, { headers, signal: controller.signal });

                if (!res.ok) {
                    throw new Error('Error al cargar el catálogo de productos/insumos.');
                }

                const data = await res.json();
                setProductosInsumo(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setMensaje({ type: 'error', text: err.message || 'Error al conectar con los productos.' });
                }
            } finally {
                setFetchingCatalogos(false);
            }
        };

        fetchProductos();

        return () => controller.abort();
    }, [open]);

    // Manejador de cambios en inputs y switches
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Envío del formulario (POST para crear / PUT para editar)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (parseFloat(form.peso_tara_kg) < 0) {
            setMensaje({ type: 'warning', text: 'El peso tara no puede ser un valor negativo.' });
            return;
        }

        setLoadingSubmit(true);
        setMensaje(null);

        const isEditing = Boolean(empaqueToEdit?.id);
        const endpoint = isEditing 
            ? `${ENDPOINTS.empaques}${empaqueToEdit.id}/` 
            : ENDPOINTS.empaques;
        const method = isEditing ? 'PUT' : 'POST';

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
                    tipo: form.tipo,
                    peso_tara_kg: parseFloat(form.peso_tara_kg).toFixed(3),
                    producto_insumo: form.producto_insumo_id || null,
                    activo: form.activo
                })
            });

            const data = await res.json();

            if (res.ok || res.status === 201) {
                setMensaje({ 
                    type: 'success', 
                    text: `Empaque ${isEditing ? 'actualizado' : 'registrado'} correctamente.` 
                });
                
                if (onSuccess) onSuccess(data);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                let errorText = 'Error al guardar el empaque.';
                if (data.detail) {
                    errorText = data.detail;
                } else if (typeof data === 'object') {
                    errorText = Object.entries(data)
                        .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join(' | ');
                }

                setMensaje({ type: 'error', text: errorText });
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
                    <InventoryIcon color="primary" />
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {empaqueToEdit ? 'Editar Empaque / Envase' : 'Nuevo Empaque / Envase'}
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
                            <Typography color="text.secondary">Cargando datos del sistema...</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2.5}>
                            {/* Nombre del Envase / Empaque */}
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    fullWidth
                                    required
                                    name="nombre"
                                    label="Nombre del Envase / Empaque"
                                    placeholder="Ej: Tarima Chep, Caja IFCO 6411"
                                    value={form.nombre}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Tipo de Empaque */}
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="tipo"
                                    label="Tipo de Empaque"
                                    value={form.tipo}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="" disabled><em>Seleccione un tipo</em></MenuItem>
                                    {TIPOS_EMPAQUE.map(opcion => (
                                        <MenuItem key={opcion.value} value={opcion.value}>
                                            {opcion.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Peso Tara (Kg) */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    name="peso_tara_kg"
                                    label="Peso Tara (Kg)"
                                    placeholder="0.000"
                                    slotProps={{
                                        htmlInput: { step: "0.001", min: "0" }
                                    }}
                                    value={form.peso_tara_kg}
                                    onChange={handleChange}
                                    helperText="Peso unitario del contenedor en Kilogramos"
                                />
                            </Grid>

                            {/* Producto Insumo Asociado (Opcional) */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    name="producto_insumo_id"
                                    label="Producto Insumo Asociado (Opcional)"
                                    value={form.producto_insumo_id}
                                    onChange={handleChange}
                                    helperText="Descuenta inventario de insumos al ser utilizado"
                                >
                                    <MenuItem value=""><em>Ninguno (Sin vínculo)</em></MenuItem>
                                    {productosInsumo.map(p => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.nombre} {p.codigo_sku ? `(${p.codigo_sku})` : ''}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Estatus Activo */}
                            <Grid size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.activo}
                                            onChange={handleChange}
                                            name="activo"
                                            color="primary"
                                        />
                                    }
                                    label="Empaque Activo"
                                />
                            </Grid>
                        </Grid>
                    )}
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
                        disabled={loadingSubmit || fetchingCatalogos}
                        startIcon={loadingSubmit && <CircularProgress size={18} color="inherit" />}
                    >
                        {loadingSubmit ? 'Guardando...' : (empaqueToEdit ? 'Actualizar Empaque' : 'Guardar Empaque')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}