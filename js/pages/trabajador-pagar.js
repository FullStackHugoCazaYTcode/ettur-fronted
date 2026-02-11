/**
 * =====================================================
 * ETTUR - TRABAJADOR PAGAR
 * Archivo: js/pages/trabajador-pagar.js
 * =====================================================
 * CORREGIDO: Maneja tanto semanales como mensuales
 * =====================================================
 */

const TrabajadorPagar = {
    semanaSeleccionada: null,
    mesSeleccionado: null,
    esMensual: false,
    comprobanteFile: null,
    comprobanteBase64: null,
    
    async init() {
        this.semanaSeleccionada = null;
        this.mesSeleccionado = null;
        this.esMensual = false;
        this.comprobanteFile = null;
        this.comprobanteBase64 = null;
        this.showStep('select');
        await this.loadPendientes();
        this.setupEvents();
    },
    
    setupEvents() {
        const btnConfirm = document.getElementById('btn-confirm-payment');
        if (btnConfirm) {
            btnConfirm.onclick = () => this.confirmarPago();
        }
        
        const inputComprobante = document.getElementById('input-comprobante');
        if (inputComprobante) {
            inputComprobante.onchange = (e) => this.handleComprobanteSelect(e);
        }
    },
    
    showStep(step) {
        document.getElementById('step-select-semana')?.classList.toggle('hidden', step !== 'select');
        document.getElementById('step-confirm-payment')?.classList.toggle('hidden', step !== 'confirm');
        document.getElementById('step-success')?.classList.toggle('hidden', step !== 'success');
    },
    
    // =====================================================
    // CARGAR PENDIENTES (SEMANAS O MESES)
    // =====================================================
    async loadPendientes() {
        const container = document.getElementById('semanas-list');
        if (!container) return;
        
        try {
            UI.showLoading('Cargando...');
            
            // Intentar cargar semanas pendientes
            const response = await Api.pagos.semanasPendientes();
            const data = response.data || {};
            
            UI.hideLoading();
            
            // Verificar si es trabajador mensual (el backend devuelve meses en vez de semanas)
            if (data.meses && data.meses.length > 0) {
                this.esMensual = true;
                this.renderMesesPendientes(container, data.meses);
            } else if (data.semanas && data.semanas.length > 0) {
                this.esMensual = false;
                this.renderSemanasPendientes(container, data.semanas);
            } else if (data.cantidad_meses_pendientes === 0 || data.cantidad_pendientes === 0) {
                // Está al día
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">✅</div>
                        <h3 class="empty-title">¡Estás al día!</h3>
                        <p class="empty-text">No tienes ${this.esMensual ? 'meses' : 'semanas'} pendientes</p>
                        <button class="btn btn-primary mt-4" onclick="App.navigateTo('trabajador-dashboard')">Volver</button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">✅</div>
                        <h3 class="empty-title">¡Estás al día!</h3>
                        <p class="empty-text">No tienes pagos pendientes</p>
                        <button class="btn btn-primary mt-4" onclick="App.navigateTo('trabajador-dashboard')">Volver</button>
                    </div>
                `;
            }
            
        } catch (error) {
            UI.hideLoading();
            console.error('Error:', error);
            container.innerHTML = UI.renderEmpty('❌', 'Error al cargar', 'Intenta de nuevo');
        }
    },
    
    // =====================================================
    // RENDERIZAR SEMANAS (TRABAJADORES SEMANALES)
    // =====================================================
    renderSemanasPendientes(container, semanas) {
        // Actualizar título
        const titulo = document.querySelector('#step-select-semana .text-muted');
        if (titulo) titulo.textContent = 'Selecciona la semana a pagar:';
        
        container.innerHTML = semanas.map((s, index) => {
            const esActual = s.es_semana_actual;
            const puedePagar = s.puede_pagar;
            
            let badge = '';
            if (puedePagar && esActual) {
                badge = '<span class="badge badge-primary">Semana actual</span>';
            } else if (puedePagar && !esActual) {
                badge = '<span class="badge badge-success">Pagar ahora</span>';
            } else if (!puedePagar) {
                badge = '<span class="badge badge-warning" style="font-size: 10px;">Paga las anteriores</span>';
            }
            
            return `
                <div class="card mb-3" 
                     style="cursor: ${puedePagar ? 'pointer' : 'not-allowed'}; opacity: ${puedePagar ? 1 : 0.5}; ${esActual && puedePagar ? 'border: 2px solid var(--primary); background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);' : ''}"
                     onclick="${puedePagar ? `TrabajadorPagar.selectSemana(${JSON.stringify(s).replace(/"/g, '&quot;')})` : ''}">
                    <div class="card-body">
                        <div class="flex justify-between items-center">
                            <div>
                                <div style="font-weight: 600; ${esActual ? 'color: var(--primary);' : ''}">
                                    Semana ${s.numero_semana}
                                    ${esActual ? '<span style="font-size: 12px; margin-left: 4px;">📍</span>' : ''}
                                </div>
                                <div class="text-muted" style="font-size: 13px;">
                                    ${s.mes_nombre || ''} • ${s.fecha_inicio || ''}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${Utils.formatMoney(s.precio)}</div>
                                ${badge}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // =====================================================
    // RENDERIZAR MESES (TRABAJADORES MENSUALES)
    // =====================================================
    renderMesesPendientes(container, meses) {
        // Actualizar título
        const titulo = document.querySelector('#step-select-semana .text-muted');
        if (titulo) titulo.textContent = 'Selecciona el mes a pagar:';
        
        container.innerHTML = meses.map((m, index) => {
            const esActual = m.es_mes_actual;
            const puedePagar = m.puede_pagar;
            
            let badge = '';
            if (puedePagar && esActual) {
                badge = '<span class="badge badge-primary">Mes actual</span>';
            } else if (puedePagar && !esActual) {
                badge = '<span class="badge badge-success">Pagar ahora</span>';
            } else if (!puedePagar) {
                badge = '<span class="badge badge-warning" style="font-size: 10px;">Paga los anteriores</span>';
            }
            
            // Indicador de temporada baja
            const tempBaja = m.es_temporada_baja ? '<span style="font-size: 11px; color: var(--info);">🌴 Temporada baja</span>' : '';
            
            return `
                <div class="card mb-3" 
                     style="cursor: ${puedePagar ? 'pointer' : 'not-allowed'}; opacity: ${puedePagar ? 1 : 0.5}; ${esActual && puedePagar ? 'border: 2px solid var(--primary); background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);' : ''}"
                     onclick="${puedePagar ? `TrabajadorPagar.selectMes(${JSON.stringify(m).replace(/"/g, '&quot;')})` : ''}">
                    <div class="card-body">
                        <div class="flex justify-between items-center">
                            <div>
                                <div style="font-weight: 600; ${esActual ? 'color: var(--primary);' : ''}">
                                    ${m.mes_nombre} ${m.anio}
                                    ${esActual ? '<span style="font-size: 12px; margin-left: 4px;">📍</span>' : ''}
                                </div>
                                <div class="text-muted" style="font-size: 13px;">
                                    Pago mensual ${tempBaja}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${Utils.formatMoney(m.precio)}</div>
                                ${badge}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // =====================================================
    // SELECCIONAR SEMANA (SEMANAL)
    // =====================================================
    selectSemana(semana) {
        this.semanaSeleccionada = semana;
        this.mesSeleccionado = null;
        this.esMensual = false;
        this.comprobanteFile = null;
        this.comprobanteBase64 = null;
        
        const amountEl = document.getElementById('payment-amount');
        const detailEl = document.getElementById('payment-detail');
        const codeEl = document.getElementById('reference-code');
        
        if (amountEl) amountEl.textContent = Utils.formatMoney(semana.precio);
        
        if (detailEl) {
            let detail = `Semana ${semana.numero_semana} - ${semana.mes_nombre || ''}`;
            if (semana.es_semana_actual) {
                detail += ' (Semana actual)';
            }
            detailEl.textContent = detail;
        }
        
        if (codeEl) codeEl.textContent = `ETT-S${semana.numero_semana}-${Date.now().toString().slice(-6)}`;
        
        this.resetComprobantePreview();
        this.showStep('confirm');
    },
    
    // =====================================================
    // SELECCIONAR MES (MENSUAL)
    // =====================================================
    selectMes(mes) {
        this.mesSeleccionado = mes;
        this.semanaSeleccionada = null;
        this.esMensual = true;
        this.comprobanteFile = null;
        this.comprobanteBase64 = null;
        
        const amountEl = document.getElementById('payment-amount');
        const detailEl = document.getElementById('payment-detail');
        const codeEl = document.getElementById('reference-code');
        
        if (amountEl) amountEl.textContent = Utils.formatMoney(mes.precio);
        
        if (detailEl) {
            let detail = `${mes.mes_nombre} ${mes.anio} - Pago mensual`;
            if (mes.es_mes_actual) {
                detail += ' (Mes actual)';
            }
            if (mes.es_temporada_baja) {
                detail += ' 🌴';
            }
            detailEl.textContent = detail;
        }
        
        if (codeEl) codeEl.textContent = `ETT-M${mes.mes}-${Date.now().toString().slice(-6)}`;
        
        this.resetComprobantePreview();
        this.showStep('confirm');
    },
    
    cancelar() {
        this.semanaSeleccionada = null;
        this.mesSeleccionado = null;
        this.comprobanteFile = null;
        this.comprobanteBase64 = null;
        this.showStep('select');
    },
    
    // =====================================================
    // MANEJO DE COMPROBANTE
    // =====================================================
    
    selectComprobante() {
        document.getElementById('input-comprobante')?.click();
    },
    
    handleComprobanteSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            UI.toast('Solo se permiten imágenes (JPG, PNG)', 'error');
            return;
        }
        
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            UI.toast('La imagen no debe superar 5MB', 'error');
            return;
        }
        
        this.comprobanteFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.comprobanteBase64 = e.target.result;
            this.showComprobantePreview(e.target.result, file.name);
        };
        reader.readAsDataURL(file);
    },
    
    showComprobantePreview(base64, fileName) {
        const container = document.getElementById('comprobante-preview');
        const placeholder = document.getElementById('comprobante-placeholder');
        const btnText = document.getElementById('btn-comprobante-text');
        
        if (container) {
            container.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${base64}" alt="Comprobante" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid var(--success);">
                    <button type="button" onclick="TrabajadorPagar.removeComprobante()" 
                        style="position: absolute; top: -8px; right: -8px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;">
                        ✕
                    </button>
                </div>
                <p style="margin-top: 8px; font-size: 12px; color: var(--success);">✅ ${fileName}</p>
            `;
            container.classList.remove('hidden');
        }
        
        if (placeholder) placeholder.classList.add('hidden');
        if (btnText) btnText.textContent = 'Cambiar imagen';
        
        this.updateConfirmButton();
    },
    
    resetComprobantePreview() {
        const container = document.getElementById('comprobante-preview');
        const placeholder = document.getElementById('comprobante-placeholder');
        const btnText = document.getElementById('btn-comprobante-text');
        const input = document.getElementById('input-comprobante');
        
        if (container) {
            container.innerHTML = '';
            container.classList.add('hidden');
        }
        if (placeholder) placeholder.classList.remove('hidden');
        if (btnText) btnText.textContent = 'Subir comprobante';
        if (input) input.value = '';
        
        this.updateConfirmButton();
    },
    
    removeComprobante() {
        this.comprobanteFile = null;
        this.comprobanteBase64 = null;
        this.resetComprobantePreview();
    },
    
    updateConfirmButton() {
        const btn = document.getElementById('btn-confirm-payment');
        if (btn) {
            if (this.comprobanteBase64) {
                btn.disabled = false;
                btn.classList.remove('btn-disabled');
            } else {
                btn.disabled = true;
                btn.classList.add('btn-disabled');
            }
        }
    },
    
    // =====================================================
    // CONFIRMAR PAGO
    // =====================================================
    
    async confirmarPago() {
        if (!this.comprobanteBase64) {
            UI.toast('Debes subir el comprobante de Yape', 'error');
            return;
        }
        
        try {
            UI.showLoading('Registrando pago...');
            
            let payload = {
                metodo_pago: 'yape',
                comprobante_base64: this.comprobanteBase64
            };
            
            // Agregar semana_id o mes_pago según el tipo
            if (this.esMensual && this.mesSeleccionado) {
                payload.mes_pago = this.mesSeleccionado.mes;
            } else if (this.semanaSeleccionada) {
                payload.semana_id = this.semanaSeleccionada.id;
            } else {
                UI.hideLoading();
                UI.toast('Selecciona un período a pagar', 'error');
                return;
            }
            
            await Api.pagos.registrar(payload);
            
            UI.hideLoading();
            UI.toast('¡Pago registrado!', 'success');
            this.showStep('success');
            
        } catch (error) {
            UI.hideLoading();
            UI.toast(error.message || 'Error al registrar pago', 'error');
        }
    }
};

window.TrabajadorPagar = TrabajadorPagar;
