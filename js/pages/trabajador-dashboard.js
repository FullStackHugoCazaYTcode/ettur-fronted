/**
 * =====================================================
 * ETTUR - TRABAJADOR DASHBOARD
 * Archivo: js/pages/trabajador-dashboard.js
 * =====================================================
 * CORREGIDO: IDs coinciden con index.html
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
        
        // IDs correctos según index.html
        const nameEl = document.getElementById('trabajador-welcome');
        const placaEl = document.getElementById('trabajador-placa');
        const tipoEl = document.getElementById('trabajador-tipo');
        
        // Nombre del usuario
        if (nameEl) {
            const nombre = user.nombre || 'Usuario';
            nameEl.textContent = `¡Hola, ${nombre}!`;
        }
        
        // Placa
        if (placaEl) {
            placaEl.textContent = `Placa: ${user.placa || '-'}`;
        }
        
        // Tipo de trabajador - maneja string u objeto
        if (tipoEl) {
            let tipoTexto = 'Trabajador';
            let esSemanal = true;
            let precio = 0;
            
            if (user.tipo_trabajador) {
                if (typeof user.tipo_trabajador === 'string') {
                    tipoTexto = user.tipo_trabajador;
                } else if (typeof user.tipo_trabajador === 'object') {
                    tipoTexto = user.tipo_trabajador.nombre || 'Trabajador';
                    esSemanal = user.tipo_trabajador.es_semanal !== false;
                }
            }
            
            // Obtener precio
            precio = user.precio || user.precio_personalizado || user.precio_default || 0;
            esSemanal = user.es_semanal !== false && user.es_semanal !== 0;
            const periodo = esSemanal ? 'semana' : 'mes';
            
            tipoEl.innerHTML = `
                <span style="background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">
                    ${tipoTexto}
                </span>
                <span style="color: #666; font-size: 13px; margin-left: 8px;">
                    ${Utils.formatMoney(precio)} / ${periodo}
                </span>
            `;
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
            
            // Total pagado - ID correcto
            const totalEl = document.getElementById('total-pagado');
            if (totalEl) totalEl.textContent = Utils.formatMoney(totalPagado);
            
            // Progreso
            const semanasPagadas = esMensual ? (data.meses_pagados || 0) : (data.semanas_pagadas || 0);
            const totalPeriodos = esMensual ? 12 : 52;
            const periodoTexto = esMensual ? 'meses' : 'semanas';
            
            // Barra de progreso - ID correcto
            const progressEl = document.getElementById('progress-bar');
            if (progressEl) {
                const porcentaje = (semanasPagadas / totalPeriodos) * 100;
                progressEl.style.width = `${porcentaje}%`;
            }
            
            // Texto de períodos - IDs correctos
            const periodosEl = document.getElementById('periodos-pagados');
            const totalEl2 = document.getElementById('periodos-total');
            
            if (periodosEl) periodosEl.textContent = `${semanasPagadas} ${periodoTexto}`;
            if (totalEl2) totalEl2.textContent = `de ${totalPeriodos}`;
            
        } catch (error) {
            console.error('Error cargando resumen:', error);
        }
    },
    
    // =====================================================
    // CARGAR PRÓXIMO PAGO (CON DÍAS RESTANTES)
    // =====================================================
    async loadProximoPago() {
        // ID correcto según index.html
        const container = document.getElementById('proximo-pago-info');
        const card = document.getElementById('card-proximo-pago');
        
        if (!container) {
            console.error('No se encontró proximo-pago-info');
            return;
        }
        
        try {
            const response = await Api.pagos.semanasPendientes();
            const data = response.data || {};
            
            // Verificar si es mensual o semanal
            const esMensual = data.meses !== undefined;
            const pendientes = esMensual ? (data.meses || []) : (data.semanas || []);
            const cantidadPendientes = esMensual ? (data.cantidad_meses_pendientes || 0) : (data.cantidad_pendientes || 0);
            
            // Si no hay pendientes, está completamente al día
            if (!pendientes || pendientes.length === 0) {
                if (card) {
                    card.className = 'card mb-4';
                    card.style.borderLeft = '4px solid #22c55e';
                    card.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
                }
                container.innerHTML = this.renderAlDia();
                
                // Ocultar botón de pagar
                const btnPagar = document.getElementById('btn-pagar-ahora');
                if (btnPagar) btnPagar.style.display = 'none';
                return;
            }
            
            // El primer pendiente es el que puede pagar
            const proximo = pendientes[0];
            
            // Calcular cuántas están ATRASADAS (períodos pasados, no el actual)
            let atrasadas = 0;
            let periodoActual = null;
            
            if (esMensual) {
                atrasadas = pendientes.filter(p => !p.es_mes_actual).length;
                periodoActual = pendientes.find(p => p.es_mes_actual);
            } else {
                atrasadas = pendientes.filter(p => !p.es_semana_actual).length;
                periodoActual = pendientes.find(p => p.es_semana_actual);
            }
            
            // Determinar si está al día (solo debe el período actual)
            const estaAlDia = atrasadas === 0 && periodoActual;
            
            if (estaAlDia) {
                // Solo debe el período actual - mostrar días restantes
                if (card) {
                    card.className = 'card mb-4';
                    card.style.borderLeft = '4px solid #22c55e';
                    card.style.background = '#fff';
                }
                // Actualizar badge
                const badge = card?.querySelector('.badge');
                if (badge) {
                    badge.className = 'badge badge-success';
                    badge.textContent = 'Al día';
                }
                // Actualizar icono
                const iconSpan = card?.querySelector('span[style*="font-weight"]');
                if (iconSpan) iconSpan.innerHTML = '✅ Próximo Pago';
                
                container.innerHTML = this.renderPeriodoActual(periodoActual, esMensual);
            } else {
                // Tiene deudas atrasadas
                if (card) {
                    card.className = 'card card-warning mb-4';
                    card.style.borderLeft = '4px solid #dc2626';
                    card.style.background = '#fff';
                }
                container.innerHTML = this.renderConDeuda(proximo, atrasadas, esMensual, cantidadPendientes);
            }
            
        } catch (error) {
            console.error('Error cargando próximo pago:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 12px; color: #666;">
                    <span>⚠️</span> No se pudo cargar
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
        let colorDias = '#22c55e'; // verde
        let bgColor = '#f0fdf4';
        let icono = '🟢';
        let mensaje = '¡Estás al día!';
        
        if (diasRestantes <= 1) {
            colorDias = '#dc2626'; // rojo
            bgColor = '#fef2f2';
            icono = '🔴';
            mensaje = '¡Último día para pagar!';
        } else if (diasRestantes <= 3) {
            colorDias = '#f59e0b'; // amarillo
            bgColor = '#fffbeb';
            icono = '🟡';
            mensaje = 'Quedan pocos días';
        }
        
        const titulo = esMensual 
            ? `${periodo.mes_nombre} ${periodo.anio}` 
            : `Semana ${periodo.numero_semana}`;
        
        const subtitulo = esMensual ? 'Pago mensual' : (periodo.mes_nombre || '');
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <div style="font-weight: 600; font-size: 1.1rem;">
                        ${titulo}
                        <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 6px;">📍 Actual</span>
                    </div>
                    <div style="font-size: 13px; color: #666; margin-top: 2px;">${subtitulo}</div>
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${Utils.formatMoney(periodo.precio)}</div>
            </div>
            
            <!-- Días restantes destacado -->
            <div style="background: ${bgColor}; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">${icono}</div>
                <div style="font-size: 1.75rem; font-weight: 700; color: ${colorDias};">
                    ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}
                </div>
                <div style="font-size: 14px; color: #666; margin-top: 4px;">
                    ${mensaje}
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 8px;">
                    para pagar ${titulo}
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
        
        const subtitulo = esMensual ? 'Pago mensual' : (proximo.mes_nombre || '');
        const fechas = !esMensual && proximo.fecha_inicio ? `${proximo.fecha_inicio} - ${proximo.fecha_fin}` : '';
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                    <div style="font-weight: 600; font-size: 1.1rem;">${titulo} - ${subtitulo}</div>
                    ${fechas ? `<div style="font-size: 12px; color: #666; margin-top: 2px;">${fechas}</div>` : ''}
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${Utils.formatMoney(proximo.precio)}</div>
            </div>
            
            <!-- Alerta de deuda -->
            <div style="background: #fef2f2; border-radius: 8px; padding: 12px; margin-top: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #dc2626;">
                    <span style="font-size: 1.25rem;">⚠️</span>
                    <div>
                        <div style="font-weight: 600; font-size: 14px;">
                            Tienes ${atrasadas} ${atrasadas === 1 ? tipoTexto + ' atrasada' : tipoTextoPlural + ' atrasadas'}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">
                            Total pendiente: ${totalPendientes} ${totalPendientes === 1 ? tipoTexto : tipoTextoPlural}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // =====================================================
    // RENDER: COMPLETAMENTE AL DÍA (sin deudas)
    // =====================================================
    renderAlDia() {
        return `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3.5rem; margin-bottom: 12px;">🎉</div>
                <h3 style="color: #166534; margin: 0 0 8px 0; font-size: 1.25rem;">¡Estás al día!</h3>
                <p style="color: #22c55e; margin: 0; font-size: 14px;">No tienes pagos pendientes</p>
            </div>
        `;
    },
    
    // =====================================================
    // CALCULAR DÍAS RESTANTES
    // =====================================================
    calcularDiasRestantes(periodo, esMensual) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        let fechaFin;
        
        if (esMensual) {
            const anio = periodo.anio || hoy.getFullYear();
            const mes = periodo.mes;
            fechaFin = new Date(anio, mes, 0); // Último día del mes
        } else {
            if (periodo.fecha_fin) {
                const partes = periodo.fecha_fin.split('-');
                fechaFin = new Date(partes[0], partes[1] - 1, partes[2]);
            } else {
                return 0;
            }
        }
        
        fechaFin.setHours(23, 59, 59, 999);
        
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
                    <div style="text-align: center; padding: 24px; color: #666;">
                        <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
                        <p style="margin: 0;">No hay pagos registrados</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = pagos.slice(0, 5).map(pago => {
                const esMensual = pago.mes_pago && !pago.semana_id;
                const periodo = esMensual 
                    ? this.getNombreMes(pago.mes_pago)
                    : `Semana ${pago.numero_semana || '-'}`;
                
                let estadoBadge = '';
                let estadoColor = '';
                let bgColor = '';
                
                switch (pago.estado) {
                    case 'pagado':
                        estadoBadge = '✓ Pagado';
                        estadoColor = '#22c55e';
                        bgColor = '#f0fdf4';
                        break;
                    case 'pendiente_validacion':
                        estadoBadge = '⏳ Validando';
                        estadoColor = '#f59e0b';
                        bgColor = '#fffbeb';
                        break;
                    case 'rechazado':
                        estadoBadge = '✗ Rechazado';
                        estadoColor = '#dc2626';
                        bgColor = '#fef2f2';
                        break;
                    default:
                        estadoBadge = pago.estado;
                        estadoColor = '#666';
                        bgColor = '#f5f5f5';
                }
                
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f0f0f0;">
                        <div>
                            <div style="font-weight: 600; font-size: 14px;">${periodo}</div>
                            <div style="font-size: 12px; color: #888; margin-top: 2px;">
                                ${pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-PE') : '-'}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: ${estadoColor}; font-size: 15px;">${Utils.formatMoney(pago.monto)}</div>
                            <div style="font-size: 11px; color: ${estadoColor}; background: ${bgColor}; padding: 2px 8px; border-radius: 4px; margin-top: 4px; display: inline-block;">${estadoBadge}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error cargando últimos pagos:', error);
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Error al cargar</p>';
        }
    },
    
    getNombreMes(mes) {
        const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[mes] || mes;
    }
};

window.TrabajadorDashboard = TrabajadorDashboard;
