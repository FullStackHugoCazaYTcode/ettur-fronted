/**
 * =====================================================
 * ETTUR - ADMIN REPORTES
 * Archivo: js/pages/admin-reportes.js
 * =====================================================
 * ACTUALIZADO: Morosos inteligentes con días restantes
 * =====================================================
 */

const AdminReportes = {
    mesActual: new Date().getMonth() + 1,
    anioActual: new Date().getFullYear(),
    
    async init() {
        this.setupFiltros();
        await this.loadReporteMensual();
        await this.loadMorosos();
    },
    
    setupFiltros() {
        const selectPeriodo = document.getElementById('reporte-periodo');
        if (selectPeriodo) {
            selectPeriodo.value = 'mensual';
        }
        
        this.setupSelectorMes();
        
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        const fechaInicio = document.getElementById('fecha-inicio');
        const fechaFin = document.getElementById('fecha-fin');
        
        if (fechaInicio) fechaInicio.value = this.formatDateInput(primerDiaMes);
        if (fechaFin) fechaFin.value = this.formatDateInput(hoy);
    },
    
    setupSelectorMes() {
        const container = document.getElementById('filtro-mes-container');
        if (!container) return;
        
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        let html = `
            <div class="form-group mb-3">
                <label class="form-label">Mes</label>
                <select id="select-mes" class="form-input" onchange="AdminReportes.cambiarMes()">
                    ${meses.map((m, i) => `
                        <option value="${i + 1}" ${i + 1 === this.mesActual ? 'selected' : ''}>${m}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group mb-3">
                <label class="form-label">Año</label>
                <select id="select-anio" class="form-input" onchange="AdminReportes.cambiarMes()">
                    <option value="2026" ${this.anioActual === 2026 ? 'selected' : ''}>2026</option>
                    <option value="2025" ${this.anioActual === 2025 ? 'selected' : ''}>2025</option>
                </select>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    formatDateDisplay(dateString) {
        const parts = dateString.split('-');
        const day = parseInt(parts[2], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[0], 10);
        return `${day}/${month}/${year}`;
    },
    
    async cambiarPeriodo(periodo) {
        const mesContainer = document.getElementById('filtro-mes-container');
        const fechasContainer = document.getElementById('filtro-fechas-container');
        
        if (fechasContainer) fechasContainer.style.display = 'block';
        
        if (periodo === 'mensual') {
            if (mesContainer) mesContainer.style.display = 'block';
            await this.loadReporteMensual();
        } else if (periodo === 'anual') {
            if (mesContainer) mesContainer.style.display = 'none';
            await this.loadReporteAnual();
        } else if (periodo === 'semanal') {
            if (mesContainer) mesContainer.style.display = 'none';
            await this.loadReporteSemanal();
        }
    },
    
    async cambiarMes() {
        const selectMes = document.getElementById('select-mes');
        const selectAnio = document.getElementById('select-anio');
        
        if (selectMes) this.mesActual = parseInt(selectMes.value);
        if (selectAnio) this.anioActual = parseInt(selectAnio.value);
        
        await this.loadReporteMensual();
    },
    
    async filtrarPorFechas() {
        const fechaInicio = document.getElementById('fecha-inicio')?.value;
        const fechaFin = document.getElementById('fecha-fin')?.value;
        
        if (!fechaInicio || !fechaFin) {
            UI.toast('Selecciona ambas fechas', 'error');
            return;
        }
        
        await this.loadReportePorFechas(fechaInicio, fechaFin);
    },
    
    // =====================================================
    // CARGAR REPORTE MENSUAL
    // =====================================================
    async loadReporteMensual() {
        const resumenContainer = document.getElementById('reporte-resumen');
        
        try {
            UI.showLoading('Cargando reporte...');
            
            const response = await Api.get(`/reportes/mensual?mes=${this.mesActual}&anio=${this.anioActual}`);
            const data = response.data || {};
            
            UI.hideLoading();
            
            this.updateStat('reporte-recaudado', Utils.formatMoney(data.resumen?.total_recaudado || 0));
            this.updateStat('reporte-pagos', data.resumen?.total_pagos || 0);
            
            if (resumenContainer) {
                resumenContainer.innerHTML = this.renderResumenMensual(data);
            }
            
        } catch (error) {
            UI.hideLoading();
            console.error('Error:', error);
            if (resumenContainer) {
                resumenContainer.innerHTML = '<p class="text-muted text-center">Error al cargar reporte</p>';
            }
        }
    },
    
    renderResumenMensual(data) {
        const pagos = data.pagos || [];
        const resumenAnual = data.resumen_anual || {};
        const meses = resumenAnual.meses || [];
        
        return `
            <div style="background: linear-gradient(135deg, var(--primary) 0%, #2d5a8a 100%); color: white; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; opacity: 0.9;">${data.mes_nombre} ${data.anio}</h4>
                <div style="font-size: 2rem; font-weight: 700;">${Utils.formatMoney(data.resumen?.total_recaudado || 0)}</div>
                <div style="opacity: 0.8; font-size: 14px; margin-top: 4px;">${data.resumen?.total_pagos || 0} pagos de ${data.resumen?.trabajadores_pagaron || 0} trabajadores</div>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600;">📅 Total ${data.anio}</span>
                    <span style="font-size: 1.25rem; font-weight: 700; color: var(--success);">${Utils.formatMoney(resumenAnual.total_recaudado || 0)}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <h4 style="font-size: 14px; margin-bottom: 12px;">📊 Recaudado por Mes</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                    ${meses.map(m => `
                        <div style="background: ${m.mes === this.mesActual ? 'var(--primary)' : '#f0f0f0'}; 
                                    color: ${m.mes === this.mesActual ? 'white' : 'inherit'};
                                    border-radius: 8px; padding: 8px; text-align: center; cursor: pointer;"
                             onclick="AdminReportes.seleccionarMes(${m.mes})">
                            <div style="font-size: 11px; opacity: 0.8;">${m.mes_nombre.substring(0, 3)}</div>
                            <div style="font-weight: 600; font-size: 13px;">${Utils.formatMoney(m.recaudado)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${pagos.length > 0 ? `
                <div>
                    <h4 style="font-size: 14px; margin-bottom: 12px;">📝 Pagos de ${data.mes_nombre}</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${pagos.map(p => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                                <div>
                                    <div style="font-weight: 500;">${p.trabajador}</div>
                                    <div style="font-size: 12px; color: var(--gray-500);">${p.placa} • ${p.semana} • ${p.metodo}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 600; color: var(--success);">${Utils.formatMoney(p.monto)}</div>
                                    <div style="font-size: 11px; color: var(--gray-500);">${this.formatDateDisplay(p.fecha.split(' ')[0])}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="text-center text-muted" style="padding: 20px;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
                    <p>No hay pagos en ${data.mes_nombre}</p>
                </div>
            `}
        `;
    },
    
    seleccionarMes(mes) {
        this.mesActual = mes;
        const selectMes = document.getElementById('select-mes');
        if (selectMes) selectMes.value = mes;
        this.loadReporteMensual();
    },
    
    // =====================================================
    // CARGAR REPORTE ANUAL
    // =====================================================
    async loadReporteAnual() {
        const resumenContainer = document.getElementById('reporte-resumen');
        
        try {
            UI.showLoading('Cargando reporte anual...');
            
            const response = await Api.get(`/reportes/anual?anio=${this.anioActual}`);
            const data = response.data || {};
            
            UI.hideLoading();
            
            this.updateStat('reporte-recaudado', Utils.formatMoney(data.resumen?.total_recaudado || 0));
            this.updateStat('reporte-pagos', data.resumen?.total_pagos || 0);
            
            if (resumenContainer) {
                resumenContainer.innerHTML = this.renderResumenAnual(data);
            }
            
        } catch (error) {
            UI.hideLoading();
            console.error('Error:', error);
        }
    },
    
    renderResumenAnual(data) {
        const meses = data.meses || [];
        const comparativa = data.comparativa || {};
        
        return `
            <div style="background: linear-gradient(135deg, var(--success) 0%, #059669 100%); color: white; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; opacity: 0.9;">Total ${data.anio}</h4>
                <div style="font-size: 2.5rem; font-weight: 700;">${Utils.formatMoney(data.resumen?.total_recaudado || 0)}</div>
                <div style="opacity: 0.8; font-size: 14px; margin-top: 4px;">${data.resumen?.total_pagos || 0} pagos • Promedio ${Utils.formatMoney(data.resumen?.promedio_mensual || 0)}/mes</div>
            </div>
            
            ${comparativa.recaudado_anterior > 0 ? `
                <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>vs ${comparativa.anio_anterior}</span>
                        <span style="color: ${comparativa.diferencia >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                            ${comparativa.diferencia >= 0 ? '↑' : '↓'} ${Math.abs(comparativa.porcentaje)}%
                        </span>
                    </div>
                </div>
            ` : ''}
            
            <div style="margin-bottom: 16px;">
                <h4 style="font-size: 14px; margin-bottom: 12px;">📊 Recaudado por Mes</h4>
                ${meses.map(m => {
                    const maxRecaudado = Math.max(...meses.map(x => x.recaudado || 0), 1);
                    const porcentaje = ((m.recaudado || 0) / maxRecaudado) * 100;
                    
                    return `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <div style="width: 40px; font-size: 12px; color: var(--gray-500);">${m.mes_nombre.substring(0, 3)}</div>
                            <div style="flex: 1; background: #eee; height: 24px; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${porcentaje}%; height: 100%; background: var(--primary); display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                                    ${porcentaje > 30 ? `<span style="color: white; font-size: 11px; font-weight: 600;">${Utils.formatMoney(m.recaudado)}</span>` : ''}
                                </div>
                            </div>
                            ${porcentaje <= 30 ? `<span style="font-size: 11px; font-weight: 600;">${Utils.formatMoney(m.recaudado)}</span>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    // =====================================================
    // CARGAR REPORTE POR FECHAS
    // =====================================================
    async loadReportePorFechas(fechaInicio, fechaFin) {
        const resumenContainer = document.getElementById('reporte-resumen');
        
        try {
            UI.showLoading('Cargando reporte...');
            
            const response = await Api.get(`/reportes/por-fechas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
            const data = response.data || {};
            
            UI.hideLoading();
            
            this.updateStat('reporte-recaudado', Utils.formatMoney(data.resumen?.total_recaudado || 0));
            this.updateStat('reporte-pagos', data.resumen?.total_pagos || 0);
            
            if (resumenContainer) {
                resumenContainer.innerHTML = this.renderResumenPorFechas(data, fechaInicio, fechaFin);
            }
            
        } catch (error) {
            UI.hideLoading();
            console.error('Error:', error);
        }
    },
    
    renderResumenPorFechas(data, fechaInicio, fechaFin) {
        const pagos = data.pagos || [];
        
        const fechaInicioDisplay = this.formatDateDisplay(fechaInicio);
        const fechaFinDisplay = this.formatDateDisplay(fechaFin);
        
        return `
            <div style="background: linear-gradient(135deg, #6B2D83 0%, #9333ea 100%); color: white; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; opacity: 0.9;">
                    ${fechaInicioDisplay} - ${fechaFinDisplay}
                </h4>
                <div style="font-size: 2rem; font-weight: 700;">${Utils.formatMoney(data.resumen?.total_recaudado || 0)}</div>
                <div style="opacity: 0.8; font-size: 14px; margin-top: 4px;">${data.resumen?.total_pagos || 0} pagos</div>
            </div>
            
            ${pagos.length > 0 ? `
                <div style="max-height: 400px; overflow-y: auto;">
                    ${pagos.map(p => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                            <div>
                                <div style="font-weight: 500;">${p.trabajador}</div>
                                <div style="font-size: 12px; color: var(--gray-500);">${p.placa} • ${p.semana}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; color: var(--success);">${Utils.formatMoney(p.monto)}</div>
                                <div style="font-size: 11px; color: var(--gray-500);">${this.formatDateDisplay(p.fecha.split(' ')[0])}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center text-muted" style="padding: 20px;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
                    <p>No hay pagos en este período</p>
                </div>
            `}
        `;
    },
    
    // =====================================================
    // CARGAR REPORTE SEMANAL
    // =====================================================
    async loadReporteSemanal() {
        const resumenContainer = document.getElementById('reporte-resumen');
        
        try {
            UI.showLoading('Cargando reporte semanal...');
            
            const response = await Api.get('/reportes/semanal');
            const data = response.data || {};
            
            UI.hideLoading();
            
            this.updateStat('reporte-recaudado', Utils.formatMoney(data.resumen?.total_recaudado || 0));
            this.updateStat('reporte-pagos', data.resumen?.pagados || 0);
            
            if (resumenContainer) {
                resumenContainer.innerHTML = this.renderResumenSemanal(data);
            }
            
        } catch (error) {
            UI.hideLoading();
            console.error('Error:', error);
        }
    },
    
    renderResumenSemanal(data) {
        const semana = data.semana || {};
        const resumen = data.resumen || {};
        
        return `
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; opacity: 0.9;">Semana ${semana.numero} - ${semana.mes_nombre}</h4>
                <div style="font-size: 2rem; font-weight: 700;">${Utils.formatMoney(resumen.total_recaudado || 0)}</div>
                <div style="opacity: 0.8; font-size: 14px; margin-top: 4px;">${resumen.pagados || 0} de ${resumen.total_trabajadores || 0} trabajadores (${resumen.porcentaje_cobrado || 0}%)</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div style="background: #dcfce7; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${resumen.pagados || 0}</div>
                    <div style="font-size: 12px; color: var(--gray-600);">Pagados</div>
                </div>
                <div style="background: #fef3c7; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #d97706;">${resumen.pendientes || 0}</div>
                    <div style="font-size: 12px; color: var(--gray-600);">Pendientes</div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Esperado:</span>
                    <span style="font-weight: 600;">${Utils.formatMoney(resumen.total_esperado || 0)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Por cobrar:</span>
                    <span style="font-weight: 600; color: var(--danger);">${Utils.formatMoney(resumen.pendiente_cobrar || 0)}</span>
                </div>
            </div>
        `;
    },
    
    // =====================================================
    // CARGAR MOROSOS (ACTUALIZADO CON DÍAS RESTANTES)
    // =====================================================
    async loadMorosos() {
        const container = document.getElementById('lista-morosos');
        const badge = document.getElementById('badge-morosos');
        
        if (!container) return;
        
        try {
            const response = await Api.get(`/reportes/morosos?anio=${this.anioActual}`);
            const data = response.data || {};
            const morosos = data.morosos || [];
            
            if (badge) badge.textContent = morosos.length;
            
            if (morosos.length === 0) {
                container.innerHTML = `
                    <div style="padding: 40px; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 8px;">🎉</div>
                        <h3 style="margin: 10px 0;">¡Sin morosos!</h3>
                        <p class="text-muted">Todos los trabajadores están al día</p>
                    </div>
                `;
                return;
            }
            
            // Header con info del período actual
            let html = `
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <span style="font-size: 12px; color: var(--gray-500);">Semana actual:</span>
                            <strong style="margin-left: 4px;">Sem ${data.semana_actual?.numero || '-'}</strong>
                            <span style="font-size: 11px; color: var(--info); margin-left: 8px;">
                                ⏰ ${data.semana_actual?.dias_restantes || 0} días
                            </span>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: var(--gray-500);">Mes actual:</span>
                            <strong style="margin-left: 4px;">${data.mes_actual?.nombre || '-'}</strong>
                            <span style="font-size: 11px; color: var(--info); margin-left: 8px;">
                                ⏰ ${data.mes_actual?.dias_restantes || 0} días
                            </span>
                        </div>
                    </div>
                </div>
            `;
            
            // Lista de morosos
            html += morosos.map(m => {
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
                
                // Color de fondo según gravedad
                let bgColor = '#fff';
                if (m.deuda >= 3) {
                    bgColor = '#fff5f5';
                } else if (m.deuda >= 2) {
                    bgColor = '#fffbeb';
                }
                
                const badgeTipo = m.es_semanal 
                    ? '<span class="badge badge-info">Semanal</span>'
                    : '<span class="badge badge-warning">Mensual</span>';
                
                // Formatear fecha límite
                const fechaLimite = m.fecha_limite ? this.formatDateDisplay(m.fecha_limite) : '-';
                
                return `
                    <div class="card mb-3" style="background: ${bgColor}; border-left: 4px solid ${m.deuda >= 3 ? 'var(--danger)' : 'var(--warning)'};">
                        <div class="card-body" style="padding: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div class="avatar" style="width: 45px; height: 45px; background: ${m.deuda >= 3 ? 'var(--danger)' : 'var(--warning)'};">
                                        ${m.nombre.charAt(0)}${m.apellido.charAt(0)}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600;">${m.nombre_completo}</div>
                                        <div style="font-size: 12px; color: var(--gray-500);">
                                            ${m.placa} • ${m.dni || 'Sin DNI'}
                                        </div>
                                        <div style="margin-top: 4px;">
                                            ${badgeTipo}
                                            ${m.telefono ? `<a href="tel:${m.telefono}" class="badge badge-outline" style="margin-left: 4px; text-decoration: none;">📞 Llamar</a>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--danger);">
                                        ${m.texto_deuda}
                                    </div>
                                    <div style="font-size: 12px; color: ${colorTiempo}; margin-top: 4px;">
                                        ${iconoTiempo} ${m.texto_tiempo}
                                    </div>
                                    <div style="font-size: 11px; color: var(--gray-400); margin-top: 2px;">
                                        Límite: ${fechaLimite}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = '<p class="text-muted text-center">Error al cargar</p>';
        }
    },
    
    updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
};

window.AdminReportes = AdminReportes;
