/**
 * =====================================================
 * ETTUR - ADMIN DASHBOARD
 * Archivo: js/pages/admin-dashboard.js
 * =====================================================
 * ACTUALIZADO: Morosos inteligentes con días restantes
 * =====================================================
 */

const AdminDashboard = {
    pagosCache: [],
    
    async init() {
        this.renderWelcome();
        await this.loadStats();
        await this.loadPagosPendientes();
        await this.loadMorososDashboard();
    },
    
    renderWelcome() {
        const user = Auth.getUser();
        const welcomeEl = document.getElementById('admin-welcome');
        const dateEl = document.getElementById('admin-date');
        
        if (welcomeEl) {
            welcomeEl.textContent = `¡Hola, ${user?.nombre || 'Admin'}!`;
        }
        
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('es-PE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
    
    // Cargar estadísticas
    async loadStats() {
        try {
            const response = await Api.reportes.dashboard();
            const data = response.data || {};
            
            // Actualizar stats básicos
            this.updateStat('stat-trabajadores', data.resumen?.total_trabajadores || 0);
            this.updateStat('stat-pendientes', data.resumen?.pendientes_validacion || 0);
            this.updateStat('stat-morosos', data.resumen?.morosos || 0);
            
            // Mostrar recaudado del mes
            const recaudadoMes = data.mes_actual?.recaudado || 0;
            this.updateStat('stat-recaudado', Utils.formatMoney(recaudadoMes));
            
            // Si existe el elemento para el año, actualizarlo
            const recaudadoAnio = data.anio_actual?.recaudado || 0;
            const statAnio = document.getElementById('stat-recaudado-anio');
            if (statAnio) {
                statAnio.textContent = Utils.formatMoney(recaudadoAnio);
            }
            
            // Actualizar label del mes
            const labelMes = document.getElementById('label-mes-actual');
            if (labelMes && data.mes_actual?.mes_nombre) {
                labelMes.textContent = `Recaudado ${data.mes_actual.mes_nombre}`;
            }
            
            // Badge de pendientes
            const badge = document.getElementById('badge-pendientes');
            if (badge) badge.textContent = data.resumen?.pendientes_validacion || 0;
            
        } catch (error) {
            console.error('Error cargando stats:', error);
        }
    },
    
    updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },
    
    // =====================================================
    // CARGAR MOROSOS EN DASHBOARD (NUEVO)
    // =====================================================
    async loadMorososDashboard() {
        const container = document.getElementById('dashboard-morosos-list');
        if (!container) return;
        
        try {
            const response = await Api.get('/reportes/morosos?anio=' + new Date().getFullYear());
            const data = response.data || {};
            const morosos = data.morosos || [];
            
            // Actualizar badge de morosos
            const badgeMorosos = document.getElementById('badge-morosos');
            if (badgeMorosos) badgeMorosos.textContent = morosos.length;
            
            // Actualizar stat
            this.updateStat('stat-morosos', morosos.length);
            
            if (morosos.length === 0) {
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 2rem;">🎉</div>
                        <p class="text-muted">¡Sin morosos!</p>
                    </div>
                `;
                return;
            }
            
            // Renderizar morosos con días restantes
            container.innerHTML = morosos.slice(0, 5).map(m => {
                // Color según urgencia
                let colorTiempo = 'var(--success)';
                let iconoTiempo = '🟢';
                if (m.dias_restantes <= 1) {
                    colorTiempo = 'var(--danger)';
                    iconoTiempo = '🔴';
                } else if (m.dias_restantes <= 3) {
                    colorTiempo = 'var(--warning)';
                    iconoTiempo = '🟡';
                }
                
                // Badge de tipo
                const badgeTipo = m.es_semanal 
                    ? '<span class="badge badge-info" style="font-size: 9px;">Semanal</span>'
                    : '<span class="badge badge-warning" style="font-size: 9px;">Mensual</span>';
                
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="avatar" style="width: 36px; height: 36px; font-size: 12px; background: ${m.deuda > 2 ? 'var(--danger)' : 'var(--warning)'};">
                                ${m.nombre.charAt(0)}${m.apellido.charAt(0)}
                            </div>
                            <div>
                                <div style="font-weight: 500; font-size: 13px;">${m.nombre_completo}</div>
                                <div style="font-size: 11px; color: var(--gray-500);">
                                    ${m.placa} ${badgeTipo}
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: var(--danger); font-size: 13px;">
                                ${m.texto_deuda}
                            </div>
                            <div style="font-size: 10px; color: ${colorTiempo};">
                                ${iconoTiempo} ${m.texto_tiempo}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Si hay más de 5, mostrar enlace
            if (morosos.length > 5) {
                container.innerHTML += `
                    <div style="padding: 10px; text-align: center;">
                        <a href="#" onclick="App.navigateTo('admin-reportes')" style="font-size: 12px; color: var(--primary);">
                            Ver todos (${morosos.length})
                        </a>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error cargando morosos:', error);
            container.innerHTML = '<p class="text-muted text-center" style="padding: 20px;">Error al cargar</p>';
        }
    },
    
    // Cargar pagos pendientes
    async loadPagosPendientes() {
        const container = document.getElementById('admin-pagos-pendientes');
        if (!container) return;
        
        try {
            const response = await Api.pagos.pendientes();
            const pagos = response.data?.pagos || [];
            
            this.pagosCache = pagos;
            
            if (pagos.length === 0) {
                container.innerHTML = UI.renderEmpty('✅', 'No hay pagos pendientes');
                return;
            }
            
            container.innerHTML = pagos.slice(0, 5).map(pago => this.renderPagoPendiente(pago)).join('');
            
        } catch (error) {
            console.error('Error cargando pagos:', error);
            container.innerHTML = '<p class="text-muted text-center">Error al cargar</p>';
        }
    },
    
    renderPagoPendiente(pago) {
        // Determinar si es pago mensual o semanal
        const tipoPago = pago.mes_pago ? `Mes ${pago.mes_pago}` : `Sem ${pago.numero_semana || pago.semana?.numero || '-'}`;
        
        return `
            <div class="validate-card" data-id="${pago.id}" onclick="AdminDashboard.verDetallePago(${pago.id})" style="cursor: pointer;">
                <div class="validate-header">
                    <div class="avatar">${Utils.getInitials(pago.usuario?.nombre, pago.usuario?.apellido)}</div>
                    <div class="validate-info">
                        <div class="validate-name">${pago.usuario?.nombre || ''} ${pago.usuario?.apellido || ''}</div>
                        <div class="validate-meta">${pago.usuario?.placa || ''} • ${tipoPago}</div>
                    </div>
                    <div class="validate-amount">${Utils.formatMoney(pago.monto)}</div>
                </div>
                <div class="validate-actions" onclick="event.stopPropagation();">
                    <button class="btn btn-success btn-sm" onclick="AdminDashboard.validarPago(${pago.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Validar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="AdminDashboard.rechazarPago(${pago.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Rechazar
                    </button>
                </div>
            </div>
        `;
    },
    
    // Ver detalle del pago con comprobante
    verDetallePago(id) {
        const pago = this.pagosCache.find(p => p.id === id);
        if (!pago) {
            UI.toast('No se encontró el pago', 'error');
            return;
        }
        
        const apiUrl = Config.API_URL.replace('/api', '');
        const comprobanteUrl = pago.comprobante_url ? `${apiUrl}${pago.comprobante_url}` : null;
        
        // Determinar tipo de pago
        const tipoPago = pago.mes_pago 
            ? `Mes: ${this.getNombreMes(pago.mes_pago)}` 
            : `Semana ${pago.numero_semana || '-'}`;
        
        const content = `
            <div class="pago-detalle">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eee;">
                    <div class="avatar" style="width: 50px; height: 50px; font-size: 1.2rem;">
                        ${Utils.getInitials(pago.usuario?.nombre, pago.usuario?.apellido)}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 1.1rem;">${pago.usuario?.nombre || ''} ${pago.usuario?.apellido || ''}</div>
                        <div style="color: var(--gray-500); font-size: 0.9rem;">DNI: ${pago.usuario?.dni || '-'} • Placa: ${pago.usuario?.placa || '-'}</div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--gray-500);">Período:</span>
                        <span style="font-weight: 600;">${tipoPago}</span>
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
                
                <div style="margin-bottom: 16px;">
                    <p style="font-weight: 600; margin-bottom: 8px;">📸 Comprobante de Yape:</p>
                    ${comprobanteUrl ? `
                        <div style="text-align: center; background: #f0f0f0; border-radius: 8px; padding: 12px;">
                            <img src="${comprobanteUrl}" alt="Comprobante" 
                                style="max-width: 100%; max-height: 300px; border-radius: 8px; cursor: pointer;"
                                onclick="AdminDashboard.verComprobanteGrande('${comprobanteUrl}', ${id})"
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
        
        UI.showModal({
            title: '📋 Detalle del Pago',
            content: content,
            buttons: [
                {
                    text: '❌ Rechazar',
                    class: 'btn-danger',
                    action: () => {
                        UI.closeModal();
                        this.rechazarPago(id);
                    }
                },
                {
                    text: '✅ Validar',
                    class: 'btn-success',
                    action: () => {
                        UI.closeModal();
                        this.validarPago(id);
                    }
                }
            ]
        });
    },
    
    getNombreMes(mes) {
        const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[mes] || mes;
    },
    
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
                        this.verDetallePago(pagoId);
                    }
                }
            ]
        });
    },
    
    async validarPago(id) {
        const confirmed = await UI.confirm('¿Confirmas que este pago es válido?', 'Validar Pago');
        if (!confirmed) return;
        
        try {
            UI.showLoading('Validando...');
            await Api.pagos.validar(id);
            UI.hideLoading();
            UI.toast('Pago validado correctamente', 'success');
            
            await this.loadPagosPendientes();
            await this.loadStats();
            await this.loadMorososDashboard();
        } catch (error) {
            UI.hideLoading();
            UI.toast('Error al validar pago', 'error');
        }
    },
    
    async rechazarPago(id) {
        const motivo = prompt('Ingresa el motivo del rechazo:');
        if (!motivo) return;
        
        try {
            UI.showLoading('Rechazando...');
            await Api.pagos.rechazar(id, motivo);
            UI.hideLoading();
            UI.toast('Pago rechazado', 'success');
            
            await this.loadPagosPendientes();
            await this.loadStats();
        } catch (error) {
            UI.hideLoading();
            UI.toast('Error al rechazar pago', 'error');
        }
    }
};

window.AdminDashboard = AdminDashboard;
