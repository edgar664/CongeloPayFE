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

const INITIAL_FORM_STATE = {
    codigo_sku: '',
    nombre: '',
    categoria_id: '',
    unidad_medida_base_id: '',
    stock_minimo: '0.000',
    activo: true
};

export default function ProductoModal({ open, onClose, productoToEdit = null, onSuccess }) {
    const [categorias, setCategorias] = useState([]);
    const [unidades, setUnidades] = useState([]);

    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [fetchingCatalogos, setFetchingCatalogos] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    // Cargar o limpiar datos del formulario cuando cambia `productoToEdit` o `open`
    useEffect(() => {
        if (open) {
            if (productoToEdit) {
                setForm({
                    codigo_sku: productoToEdit.codigo_sku || '',
                    nombre: productoToEdit.nombre || '',
                    categoria_id: productoToEdit.categoria?.id || productoToEdit.categoria || '',
                    unidad_medida_base_id: productoToEdit.unidad_medida_base?.id || productoToEdit.unidad_medida_base || '',
                    stock_minimo: productoToEdit.stock_minimo ?? '0.000',
                    activo: productoToEdit.activo ?? true
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setMensaje(null);
        }
    }, [open, productoToEdit]);

    // Reiniciar estado y cerrar diálogo
    const handleClose = useCallback(() => {
        if (loadingSubmit) return;
        setForm(INITIAL_FORM_STATE);
        setMensaje(null);
        onClose();
    }, [loadingSubmit, onClose]);

    // Cargar catálogos auxiliares (Categorías y Unidades de Medida) usando ENDPOINTS
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
                // Se consultan los endpoints configurados dinámicamente
                const [resCat, resUnid] = await Promise.all([
                    fetch(ENDPOINTS.categoriasProducto, { headers, signal: controller.signal }),
                    fetch(ENDPOINTS.unidadesMedida, { headers, signal: controller.signal })
                ]);

                if (!resCat.ok || !resUnid.ok) {
                    throw new Error('Error al cargar los catálogos de categorías o unidades de medida.');
                }

                const [catData, unidData] = await Promise.all([
                    resCat.json(),
                    resUnid.json()
                ]);

                setCategorias(Array.isArray(catData) ? catData : catData.results || []);
                setUnidades(Array.isArray(unidData) ? unidData : unidData.results || []);
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

        if (parseFloat(form.stock_minimo) < 0) {
            setMensaje({ type: 'warning', text: 'El stock mínimo no puede ser un valor negativo.' });
            return;
        }

        setLoadingSubmit(true);
        setMensaje(null);

        const isEditing = Boolean(productoToEdit?.id);
        // Construye el endpoint base o específico según edición
        const endpoint = isEditing 
            ? `${ENDPOINTS.productos}${productoToEdit.id}/` 
            : ENDPOINTS.productos;
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
                    codigo_sku: form.codigo_sku.trim(),
                    nombre: form.nombre.trim(),
                    categoria: form.categoria_id,
                    unidad_medida_base: form.unidad_medida_base_id,
                    stock_minimo: parseFloat(form.stock_minimo).toFixed(3),
                    activo: form.activo
                })
            });

            const data = await res.json();

            if (res.ok || res.status === 201) {
                setMensaje({ 
                    type: 'success', 
                    text: `Producto ${isEditing ? 'actualizado' : 'registrado'} correctamente.` 
                });
                
                if (onSuccess) onSuccess(data);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                // Formateador de errores devueltos por Django REST Framework
                let errorText = 'Error al guardar el producto.';
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
                        {productoToEdit ? 'Editar Producto' : 'Nuevo Producto'}
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
                            {/* SKU / Código */}
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    required
                                    name="codigo_sku"
                                    label="Código SKU / Clave"
                                    placeholder="Ej: PRD-001"
                                    value={form.codigo_sku}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Nombre del Producto */}
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    fullWidth
                                    required
                                    name="nombre"
                                    label="Nombre del Producto"
                                    placeholder="Ej: Fresa IQF Grado A Brik"
                                    value={form.nombre}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Categoría */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="categoria_id"
                                    label="Categoría"
                                    value={form.categoria_id}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="" disabled><em>Seleccione una categoría</em></MenuItem>
                                    {categorias.map(cat => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.nombre}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Unidad de Medida Base */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    name="unidad_medida_base_id"
                                    label="Unidad de Medida Base"
                                    value={form.unidad_medida_base_id}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="" disabled><em>Seleccione unidad de medida</em></MenuItem>
                                    {unidades.map(u => (
                                        <MenuItem key={u.id} value={u.id}>
                                            {u.nombre} ({u.codigo || u.simbolo || 'U.M.'})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Stock Mínimo */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    name="stock_minimo"
                                    label="Stock Mínimo"
                                    placeholder="0.000"
                                    slotProps={{
                                        htmlInput: { step: "0.001", min: "0" }
                                    }}
                                    value={form.stock_minimo}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Estatus Activo */}
                            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.activo}
                                            onChange={handleChange}
                                            name="activo"
                                            color="primary"
                                        />
                                    }
                                    label="Producto Activo"
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
                        {loadingSubmit ? 'Guardando...' : (productoToEdit ? 'Actualizar Producto' : 'Guardar Producto')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}