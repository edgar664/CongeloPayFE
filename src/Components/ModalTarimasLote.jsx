import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../api';

export default function ModalTarimasLote({ lote, onClose }) {
    const [tarimas, setTarimas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTarimas = async () => {
            if (!lote) return;
            
            const token = localStorage.getItem('token');
            setLoading(true);
            setError(null);

            try {
                // Si la ruta con /lote/1/ da 500, llamamos a la ruta base pasando el lote como query string
                const url = `${ENDPOINTS?.movimientosInventario || '/almacen/movimientos-inventario/'}?lote=${lote.id}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    let items = Array.isArray(data) ? data : (data.results || []);
                    
                    // Filtrado de respaldo en cliente por si la API no filtra por ?lote=
                    items = items.filter(item => 
                        item.lote === lote.id || 
                        item.lote_id === lote.id || 
                        item.lote?.id === lote.id
                    );

                    setTarimas(items);
                } else {
                    const errRes = await response.json().catch(() => ({}));
                    setError(errRes.detail || 'Error al obtener las tarimas.');
                }
            } catch (err) {
                setError('Error de conexión con el servidor.');
            } finally {
                setLoading(false);
            }
        };

        fetchTarimas();
    }, [lote]);

    if (!lote) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="modal-content" style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '900px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa'
                }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#1B2A52' }}>
                            Tarimas del Lote: <span style={{ color: '#2E7D32' }}>{lote.codigo_lote}</span>
                        </h3>
                        <small style={{ color: '#666' }}>
                            Producto: {typeof lote.producto === 'object' ? lote.producto?.nombre : (lote.producto_nombre || 'N/A')}
                        </small>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
                    >
                        &times;
                    </button>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#666' }}>Cargando tarimas del lote...</p>
                    ) : error ? (
                        <div style={{ padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                            ⚠️ {error}
                        </div>
                    ) : tarimas.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>
                            No se encontraron tarimas registradas para este lote.
                        </p>
                    ) : (
                        <table className="pro-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Código Tarima</th>
                                    <th>Ubicación</th>
                                    <th>Cajas / Unidades</th>
                                    <th>Peso Bruto (kg)</th>
                                    <th>Peso Neto (kg)</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tarimas.map((item, idx) => (
                                    <tr key={item.id || idx}>
                                        <td className="code-cell">
                                            {item.codigo_tarima || item.tarima_codigo || item.folio || `TAR-${item.id || idx + 1}`}
                                        </td>
                                        <td>
                                            {item.ubicacion_nombre || item.ubicacion?.nombre || 'Sin Ubicación'}
                                        </td>
                                        <td>{item.cantidad_cajas ?? item.cajas ?? item.unidades ?? 0}</td>
                                        <td>{item.peso_bruto_kg ?? item.peso_bruto ?? '0.00'} kg</td>
                                        <td>{item.peso_neto_kg ?? item.peso_neto ?? '0.00'} kg</td>
                                        <td>
                                            <span className={`st-badge ${item.activa !== false ? 'active' : 'neutral'}`}>
                                                {item.tipo_movimiento || (item.activa !== false ? 'DISPONIBLE' : 'VACÍA')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ padding: '12px 24px', borderTop: '1px solid #e0e0e0', textAlign: 'right', backgroundColor: '#f8f9fa' }}>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '8px 18px',
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}