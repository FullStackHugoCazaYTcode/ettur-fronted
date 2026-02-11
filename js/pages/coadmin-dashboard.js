/**
 * =====================================================
 * ETTUR - COADMIN DASHBOARD
 * Archivo: js/pages/coadmin-dashboard.js
 * =====================================================
 * ACTUALIZADO: Navegación correcta entre modales
 * =====================================================
 */

const CoadminDashboard = {
    pagosCache: [], // Guardar pagos para acceso rápido
    
    async init() {
        this.renderWelcome();
        this.applyPermisos();
        await this.loadPagosPendientes();
    },
    
    renderWelcome() {
        const user = Auth.getUser();
        const welcomeEl = document.getElementById('coadmin-welcome');
        if (welcomeEl) welcomeEl.textContent = `¡Hola, ${user?.nombre || 'Coadmin'}!`;
        
        // Mostrar permisos activos
        const permisosEl = document.getElementById('coadmin-permisos');
        if (permisosEl) {
            const permisos = Auth.getPermisos();
            let permisosTexto = [];
            if (permisos.puede_registrar_trabajadores) permisosTexto.push('Registrar');
            if (permisos.puede_aprobar_pagos) permisosTexto.push('Aprobar pagos');
            if (permisos.puede_ver_reportes) permisosTexto.push('Ver reportes');
            if (permisos.puede_eliminar_trabajadores) permisosTexto.push('Eliminar');
            
            permisosEl.innerHTML = permisosTexto.length > 0 
                ? `<small class="text-muted">Permisos: ${permisosTexto.join(' • ')}</small>`
                : '<small class="text-muted">Sin permisos especiales</small>';
        }
    },
    
    // Aplicar permisos - Ocultar/mostrar elementos según permisos
    applyPermisos() {
        // Botón ver usuarios (solo si puede registrar o eliminar)
        const btnUsuarios = document.getElementById('btn-coadmin-usuarios');
        if (btnUsuarios) {
            if (Auth.canRegistrarTrabajadores() || Auth.canEliminarTrabajadores()) {
                btnUsuarios.style.display = 'block';
            } else {
                btnUsuarios.style.display = 'none';
            }
        }
        
        // Botón reportes
        const btnReportes = document.getElementById('btn-coadmin-reportes');
        if (btnReportes) {
            btnReportes.style.display = Auth.canVerReportes() ? 'block' : 'none';
        }
        
        // Sección de pagos pendientes
        const seccionPagos = document.getElementById('seccion-pagos-pendientes');
        if (seccionPagos) {
            seccionPagos.style.display = Auth.canAprobarPagos() ? 'block' : 'none';
        }
        
        // Actualizar navegación inferior
        this.updateNavigation();
    },
    
    // Actualizar navegación según permisos
    updateNavigation() {
        // Ocultar/mostrar TODOS los nav items de usuarios en TODOS los navbars
        document.querySelectorAll('.nav-item[data-page="admin-usuarios"]').forEach(navItem => {
            if (Auth.canRegistrarTrabajadores() || Auth.canEliminarTrabajadores()) {
                navItem.style.display = 'flex';
            } else {
                navItem.style.display = 'none';
            }
        });
        
        // Ocultar/mostrar TODOS los nav items de reportes en TODOS los navbars
        document.querySelectorAll('.nav-item[data-page="admin-reportes"]').forEach(navItem => {
            navItem.style.display = Auth.canVerReportes() ? 'flex' : 'none';
        });
    },
    
    async loadPagosPendientes() {
        // Solo cargar si tiene permiso
        if (!Auth.canAprobarPagos()) {
            return;
        }
        
        const container = document.getElementById('coadmin-pagos');
        const badge = document.getElementById('coadmin-badge');
        if (!container) return;
        
        try {
            const response = await Api.pagos.pendientes();
            const pagos = response.data?.pagos || [];
            
            // Guardar en cache para acceso rápido
            this.pagosCache = pagos;
            
            if (badge) badge.textContent = pagos.length;
            
            if (pagos.length === 0) {
                container.innerHTML = UI.renderEmpty('✅', 'No hay pagos pendientes');
                return;
            }
            
            // Renderizar con onclick para ver detalles
            container.innerHTML = pagos.map(pago => `
                <div class="validate-card" data-id="${pago.id}" onclick="CoadminDashboard.verDetallePago(${pago.id})" style="cursor: pointer;">
                    <div class="validate-header">
                        <div class="avatar">${Utils.getInitials(pago.usuario?.nombre, pago.usuario?.apellido)}</div>
                        <div class="validate-info">
                            <div class="validate-name">${pago.usuario?.nombre || ''} ${pago.usuario?.apellido || ''}</div>
                            <div class="validate-meta">${pago.usuario?.placa || ''} • Sem ${pago.numero_semana || pago.semana?.numero || '-'}</div>
                        </div>
                        <div class="validate-amount">${Utils.formatMoney(pago.monto)}</div>
                    </div>
                    <div class="validate-actions" onclick="event.stopPropagation();">
                        <button class="btn btn-success btn-sm" onclick="CoadminDashboard.validar(${pago.id})">✅ Validar</button>
                        <button class="btn btn-danger btn-sm" onclick="CoadminDashboard.rechazar(${pago.id})">❌ Rechazar</button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = '<p class="text-muted text-center">Error al cargar</p>';
        }
    },
    
    // =====================================================
    // Ver detalle del pago con comprobante
    // =====================================================
    verDetallePago(id) {
        // Buscar el pago en cache
        const pago = this.pagosCache.find(p => p.id === id);
        if (!pago) {
            UI.toast('No se encontró el pago', 'error');
            return;
        }
        
        // Construir URL del comprobante
        const apiUrl = Config.API_URL.replace('/api', '');
        const comprobanteUrl = pago.comprobante_url ? `${apiUrl}${pago.comprobante_url}` : null;
        
        // Crear contenido del modal
        const content = `
            <div class="pago-detalle">
                <!-- Datos del trabajador -->
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eee;">
                    <div class="avatar" style="width: 50px; height: 50px; font-size: 1.2rem;">
                        ${Utils.getInitials(pago.usuario?.nombre, pago.usuario?.apellido)}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 1.1rem;">${pago.usuario?.nombre || ''} ${pago.usuario?.apellido || ''}</div>
                        <div style="color: var(--gray-500); font-size: 0.9rem;">DNI: ${pago.usuario?.dni || '-'} • Placa: ${pago.usuario?.placa || '-'}</div>
                    </div>
                </div>
                
                <!-- Detalles del pago -->
                <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--gray-500);">Semana:</span>
                        <span style="font-weight: 600;">Semana ${pago.numero_semana || '-'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--gray-500);">Monto:</span>
                        <span style="font-weight: 700; color: var(--primary); font-size: 1.2rem;">${Utils.formatMoney(pago.monto)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--gray-500);">Método:</span>
                        <span style="font-weight: 500;">${pago.metodo_pago?.toUpperCase() || 'YAPE'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--gray-500);">Código:</span>
                        <span style="font-family: monospace;">${pago.codigo_pago || '-'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--gray-500);">Fecha:</span>
                        <span>${pago.created_at ? new Date(pago.created_at).toLocaleString('es-PE') : '-'}</span>
                    </div>
                </div>
                
                <!-- Comprobante -->
                <div style="margin-bottom: 16px;">
                    <p style="font-weight: 600; margin-bottom: 8px;">📸 Comprobante de Yape:</p>
                    ${comprobanteUrl ? `
                        <div style="text-align: center; background: #f0f0f0; border-radius: 8px; padding: 12px;">
                            <img src="${comprobanteUrl}" alt="Comprobante" 
                                style="max-width: 100%; max-height: 300px; border-radius: 8px; cursor: pointer;"
                                onclick="CoadminDashboard.verComprobanteGrande('${comprobanteUrl}', ${id})"
                            >
                            <p style="margin-top: 8px; font-size: 12px; color: var(--gray-500);">Toca la imagen para ampliar</p>
                        </div>
                    ` : `
                        <div style="text-align: center; background: #fff3cd; border-radius: 8px; padding: 20px; color: #856404;">
                            <div style="font-size: 2rem; margin-bottom: 8px;">⚠️</div>
                            <p>No se adjuntó comprobante</p>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        // Mostrar modal
        UI.showModal({
            title: '📋 Detalle del Pago',
            content: content,
            buttons: [
                {
                    text: '❌ Rechazar',
                    class: 'btn-danger',
                    action: () => {
                        UI.closeModal();
                        this.rechazar(id);
                    }
                },
                {
                    text: '✅ Validar',
                    class: 'btn-success',
                    action: () => {
                        UI.closeModal();
                        this.validar(id);
                    }
                }
            ]
        });
    },
    
    // Ver comprobante en grande (CORREGIDO: vuelve al detalle)
    verComprobanteGrande(url, pagoId) {
        UI.showModal({
            title: '📸 Comprobante',
            content: `
                <div style="text-align: center;">
                    <img src="${url}" alt="Comprobante" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
                </div>
            `,
            buttons: [
                {
                    text: '← Volver',
                    class: 'btn-primary',
                    action: () => {
                        UI.closeModal();
                        // Volver al detalle del pago
                        this.verDetallePago(pagoId);
                    }
                }
            ]
        });
    },
    
    async validar(id) {
        if (!Auth.canAprobarPagos()) {
            UI.toast('No tienes permiso para aprobar pagos', 'error');
            return;
        }
        
        const confirmed = await UI.confirm('¿Validar este pago?', 'Confirmar');
        if (!confirmed) return;
        
        try {
            UI.showLoading('Validando...');
            await Api.pagos.validar(id);
            UI.hideLoading();
            UI.toast('Pago validado', 'success');
            await this.loadPagosPendientes();
        } catch (error) {
            UI.hideLoading();
            UI.toast(error.message || 'Error al validar', 'error');
        }
    },
    
    async rechazar(id) {
        if (!Auth.canAprobarPagos()) {
            UI.toast('No tienes permiso para rechazar pagos', 'error');
            return;
        }
        
        const motivo = prompt('Motivo del rechazo:');
        if (!motivo) return;
        
        try {
            UI.showLoading('Rechazando...');
            await Api.pagos.rechazar(id, motivo);
            UI.hideLoading();
            UI.toast('Pago rechazado', 'success');
            await this.loadPagosPendientes();
        } catch (error) {
            UI.hideLoading();
            UI.toast(error.message || 'Error al rechazar', 'error');
        }
    }
};

window.CoadminDashboard = CoadminDashboard;
