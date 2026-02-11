/**
 * =====================================================
 * ETTUR - TRABAJADOR DASHBOARD
 * Archivo: js/pages/trabajador-dashboard.js
 * =====================================================
 * ACTUALIZADO: Muestra días restantes si está al día
 * =====================================================
 */

const TrabajadorDashboard = {
    userData: null,
    
    async init() {
        this.userData = Auth.getUser();
        this.renderUserInfo();
        await this.loadResumen();
        await this.loadProximoPago();
        await this.loadUltimosPagos();
    },
    
    renderUserInfo() {
        const user = this.userData;
        if (!user) return;
        
        const nameEl = document.getElementById('trabajador-name');
        const placaEl = document.getElementById('trabajador-placa');
        const tipoEl = document.getElementById('trabajador-tipo');
        const precioEl = document.getElementById('trabajador-precio');
        
        if (nameEl) nameEl.textContent = `¡Hola, ${user.nombre}!`;
        if (placaEl) placaEl.textContent = `Placa: ${user.placa || '-'}`;
        if (tipoEl) tipoEl.textContent = user.tipo_trabajador || 'Trabajador';
        if (precioEl) {
            const esMensual = user.es_mensual || !user.es_semanal;
            const periodo = esMensual ? 'mes' : 'semana';
            precioEl.textContent = `${Utils.formatMoney(user.precio || 0)} / ${periodo}`;
        }
    },
    
    // =====================================================
    // CARGAR RESUMEN DE PAGOS
    // =====================================================
    async loadResumen() {
        try {
            const response = await Api.pagos.misPagos();
            const data = response.data || {};
            
            const totalPagado = data.total_pagado || 0;
            const esMensual = data.es_mensual;
            
            // Actualizar total pagado
            const totalEl = document.getElementById('total-pagado');
            if (totalEl) totalEl.textContent = Utils.formatMoney(totalPagado);
            
            // Actualizar progreso
            const semanasPagadas = esMensual ? data.meses_pagados : data.semanas_pagadas;
            const totalPeriodos = esMensual ? 12 : 52;
            const periodo = esMensual ? 'meses' : 'semanas';
            
            const progressEl = document.getElementById('pagos-progress');
            const progressText = document.getElementById('pagos-progress-text');
            
            if (progressEl) {
                const porcentaje = (semanasPagadas / totalPeriodos) * 100;
                progressEl.style.width = `${porcentaje}%`;
            }
            
            if (progressText) {
                progressText.textContent = `${semanasPagadas} ${periodo} de ${totalPeriodos}`;
            }
            
        } catch (error) {
            console.error('Error cargando resumen:', error);
        }
    },
    
    // =====================================================
    // CARGAR PRÓXIMO PAGO (CON DÍAS RESTANTES)
    // =====================================================
    async loadProximoPago() {
        const container = document.getElementById('proximo-pago');
        if (!container) return;
        
        try {
            const response = await Api.pagos.semanasPendientes();
            const data = response.data || {};
            
            // Verificar si es mensual o semanal
            const esMensual = data.meses && data.meses.length >= 0;
            const pendientes = esMensual ? data.meses : data.semanas;
            const cantidadPendientes = esMensual ? data.cantidad_meses_pendientes : data.cantidad_pendientes;
            
            if (!pendientes || pendientes.length === 0) {
                container.innerHTML = this.renderAlDia();
                return;
            }
            
            // El primer pendiente es el que puede pagar
            const proximo = pendientes[0];
            
            // Calcular cuántas están ATRASADAS (no incluye la actual)
            let atrasadas = 0;
            let periodoActual = null;
            
            if (esMensual) {
                // Para mensuales
                atrasadas = pendientes.filter(p => !p.es_mes_actual).length;
                periodoActual = pendientes.find(p => p.es_mes_actual);
            } else {
                // Para semanales
                atrasadas = pendientes.filter(p => !p.es_semana_actual).length;
                periodoActual = pendientes.find(p => p.es_semana_actual);
            }
            
            // Determinar si está al día (solo debe el período actual)
            const estaAlDia = atrasadas === 0 && periodoActual;
            
            if (estaAlDia) {
                // Solo debe el período actual - mostrar días restantes
                container.innerHTML = this.renderPeriodoActual(periodoActual, esMensual);
            } else {
                // Tiene deudas atrasadas
                container.innerHTML = this.renderConDeuda(proximo, atrasadas, esMensual, cantidadPendientes);
            }
            
        } catch (error) {
            console.error('Error cargando próximo pago:', error);
            container.innerHTML = `
                <div class="alert alert-warning">
                    <span>⚠️</span>
                    <span>No se pudo cargar</span>
                </div>
            `;
        }
    },
    
    // =====================================================
    // RENDER: ESTÁ AL DÍA (solo debe período actual)
    // =====================================================
    renderPeriodoActual(periodo, esMensual) {
        const diasRestantes = periodo.dias_restantes || this.calcularDiasRestantes(periodo, esMensual);
        
        // Color según urgencia
        let colorDias = 'var(--success)';
        let icono = '🟢';
        let mensaje = '¡Estás al día!';
        
        if (diasRestantes <= 1) {
            colorDias = 'var(--danger)';
            icono = '🔴';
            mensaje = '¡Último día para pagar!';
        } else if (diasRestantes <= 3) {
            colorDias = 'var(--warning)';
            icono = '🟡';
            mensaje = 'Quedan pocos días';
        }
        
        const titulo = esMensual 
            ? `${periodo.mes_nombre} ${periodo.anio}` 
            : `Semana ${periodo.numero_semana}`;
        
        const subtitulo = esMensual ? 'Pago mensual' : periodo.mes_nombre || '';
        
        return `
            <div class="proximo-pago-card" style="border-left: 4px solid var(--success);">
                <div class="proximo-pago-header">
                    <div>
                        <span class="proximo-pago-icon">✅</span>
                        <span class="proximo-pago-title">Próximo Pago</span>
                    </div>
                    <span class="badge badge-success">Al día</span>
                </div>
                <div class="proximo-pago-body">
                    <div class="proximo-pago-info">
                        <div class="proximo-pago-periodo">
                            ${titulo}
                            <span style="font-size: 12px; margin-left: 4px;">📍 Actual</span>
                        </div>
                        <div class="proximo-pago-meta">${subtitulo}</div>
                    </div>
                    <div class="proximo-pago-monto">${Utils.formatMoney(periodo.precio)}</div>
                </div>
                
                <!-- Días restantes -->
                <div style="background: #f0fdf4; border-radius: 8px; padding: 12px; margin-top: 12px; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 4px;">${icono}</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${colorDias};">
                        ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}
                    </div>
                    <div style="font-size: 13px; color: var(--gray-600); margin-top: 4px;">
                        ${mensaje}
                    </div>
                </div>
            </div>
        `;
    },
    
    // =====================================================
    // RENDER: TIENE DEUDA (semanas/meses atrasados)
    // =====================================================
    renderConDeuda(proximo, atrasadas, esMensual, totalPendientes) {
        const tipoTexto = esMensual ? 'mes' : 'semana';
        const tipoTextoPlural = esMensual ? 'meses' : 'semanas';
        
        const titulo = esMensual 
            ? `${proximo.mes_nombre} ${proximo.anio}` 
            : `Semana ${proximo.numero_semana}`;
        
        const subtitulo = esMensual ? 'Pago mensual' : proximo.mes_nombre || '';
        
        return `
            <div class="proximo-pago-card" style="border-left: 4px solid var(--danger);">
                <div class="proximo-pago-header">
                    <div>
                        <span class="proximo-pago-icon">⏳</span>
                        <span class="proximo-pago-title">Próximo Pago</span>
                    </div>
                    <span class="badge badge-danger">Pendiente</span>
                </div>
                <div class="proximo-pago-body">
                    <div class="proximo-pago-info">
                        <div class="proximo-pago-periodo">${titulo}</div>
                        <div class="proximo-pago-meta">${subtitulo}</div>
                    </div>
                    <div class="proximo-pago-monto">${Utils.formatMoney(proximo.precio)}</div>
                </div>
                
                <!-- Alerta de deuda -->
                <div style="background: #fef2f2; border-radius: 8px; padding: 12px; margin-top: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--danger);">
                        <span style="font-size: 1.25rem;">⚠️</span>
                        <div>
                            <div style="font-weight: 600;">
                                Tienes ${atrasadas} ${atrasadas === 1 ? tipoTexto + ' atrasado' : tipoTextoPlural + ' atrasadas'}
                            </div>
                            <div style="font-size: 12px; opacity: 0.8;">
                                Total pendiente: ${totalPendientes} ${totalPendientes === 1 ? tipoTexto : tipoTextoPlural}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // =====================================================
    // RENDER: COMPLETAMENTE AL DÍA
    // =====================================================
    renderAlDia() {
        return `
            <div class="proximo-pago-card" style="border-left: 4px solid var(--success); background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 8px;">🎉</div>
                    <h3 style="color: var(--success); margin: 0 0 8px 0;">¡Estás al día!</h3>
                    <p style="color: var(--gray-500); margin: 0;">No tienes pagos pendientes</p>
                </div>
            </div>
        `;
    },
    
    // =====================================================
    // CALCULAR DÍAS RESTANTES
    // =====================================================
    calcularDiasRestantes(periodo, esMensual) {
        const hoy = new Date();
        let fechaFin;
        
        if (esMensual) {
            // Último día del mes
            const anio = periodo.anio || hoy.getFullYear();
            const mes = periodo.mes;
            fechaFin = new Date(anio, mes, 0); // Día 0 del siguiente mes = último día de este mes
        } else {
            // Fecha fin de la semana
            if (periodo.fecha_fin) {
                fechaFin = new Date(periodo.fecha_fin + 'T23:59:59');
            } else {
                return 0;
            }
        }
        
        const diffTime = fechaFin.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    },
    
    // =====================================================
    // CARGAR ÚLTIMOS PAGOS
    // =====================================================
    async loadUltimosPagos() {
        const container = document.getElementById('ultimos-pagos');
        if (!container) return;
        
        try {
            const response = await Api.pagos.misPagos();
            const pagos = response.data?.pagos || [];
            
            if (pagos.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--gray-500);">
                        <p>No hay pagos registrados</p>
                    </div>
                `;
                return;
            }
            
            // Mostrar últimos 5 pagos
            container.innerHTML = pagos.slice(0, 5).map(pago => {
                const esMensual = pago.mes_pago && !pago.semana_id;
                const periodo = esMensual 
                    ? this.getNombreMes(pago.mes_pago)
                    : `Semana ${pago.numero_semana || '-'}`;
                
                let estadoBadge = '';
                let estadoColor = '';
                
                switch (pago.estado) {
                    case 'pagado':
                        estadoBadge = '✓ Pagado';
                        estadoColor = 'var(--success)';
                        break;
                    case 'pendiente_validacion':
                        estadoBadge = '⏳ Validando';
                        estadoColor = 'var(--warning)';
                        break;
                    case 'rechazado':
                        estadoBadge = '✗ Rechazado';
                        estadoColor = 'var(--danger)';
                        break;
                    default:
                        estadoBadge = pago.estado;
                        estadoColor = 'var(--gray-500)';
                }
                
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                        <div>
                            <div style="font-weight: 500;">${periodo}</div>
                            <div style="font-size: 12px; color: var(--gray-500);">
                                ${pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-PE') : '-'}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: ${estadoColor};">${Utils.formatMoney(pago.monto)}</div>
                            <div style="font-size: 11px; color: ${estadoColor};">${estadoBadge}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error cargando últimos pagos:', error);
            container.innerHTML = '<p class="text-muted text-center">Error al cargar</p>';
        }
    },
    
    getNombreMes(mes) {
        const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[mes] || mes;
    }
};

window.TrabajadorDashboard = TrabajadorDashboard;
