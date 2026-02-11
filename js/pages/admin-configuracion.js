/**
 * =====================================================
 * ETTUR - ADMIN CONFIGURACIÓN
 * Archivo: js/pages/admin-configuracion.js
 * ACTUALIZADO: Con configuración de temporadas
 * =====================================================
 */

const AdminConfiguracion = {
    tiposTrabajador: [],
    configuracion: {},
    mesesSeleccionados: [],
    
    // Nombres de los meses
    nombresMeses: [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ],
    
    async init() {
        // Solo admin general puede acceder
        if (!Auth.isAdminGeneral()) {
            UI.toast('Solo el administrador general puede acceder', 'error');
            App.navigateTo('admin-dashboard');
            return;
        }
        
        await this.loadTiposTrabajador();
        await this.loadConfiguracion();
        await this.loadConfigTemporadas();
    },
    
    // =====================================================
    // TIPOS DE TRABAJADOR Y PRECIOS
    // =====================================================
    
    async loadTiposTrabajador() {
        const container = document.getElementById('lista-precios');
        if (!container) return;
        
        try {
            UI.showLoading('Cargando precios...');
            
            try {
                const response = await Api.configuracion.tiposTrabajador();
                this.tiposTrabajador = response.data?.tipos || [];
            } catch (e) {
                this.tiposTrabajador = [
                    { id: 1, nombre: 'Normal Semanal', descripcion: 'Trabajador regular que paga semanalmente', es_semanal: true, precio_default: 12.50 },
                    { id: 2, nombre: 'Especial Semanal', descripcion: 'Trabajador con descuento semanal', es_semanal: true, precio_default: 10.00 },
                    { id: 3, nombre: 'Mensual', descripcion: 'Trabajador que paga una vez al mes', es_semanal: false, precio_default: 30.00 },
                    { id: 4, nombre: 'Especial Personalizado', descripcion: 'Precio personalizado por trabajador', es_semanal: true, precio_default: 0 }
                ];
            }
            
            UI.hideLoading();
            this.renderPrecios();
            
        } catch (error) {
            UI.hideLoading();
            console.error('Error:', error);
            container.innerHTML = UI.renderEmpty('❌', 'Error al cargar', 'Intenta de nuevo');
        }
    },
    
    renderPrecios() {
        const container = document.getElementById('lista-precios');
        if (!container) return;
        
        container.innerHTML = this.tiposTrabajador.map(tipo => `
            <div class="precio-card" data-id="${tipo.id}">
                <div class="precio-info">
                    <div class="precio-nombre">${tipo.nombre}</div>
                    <div class="precio-descripcion">${tipo.descripcion || ''}</div>
                    <div class="precio-frecuencia">
                        <span class="badge badge-${tipo.es_semanal ? 'info' : 'warning'}">
                            ${tipo.es_semanal ? 'Semanal' : 'Mensual'}
                        </span>
                    </div>
                </div>
                <div class="precio-valor">
                    <span class="precio-monto">${Utils.formatMoney(tipo.precio_default)}</span>
                    ${tipo.id !== 4 ? `
                        <button class="btn btn-sm btn-outline mt-2" onclick="AdminConfiguracion.showEditPrecioModal(${tipo.id})">
                            ✏️ Editar
                        </button>
                    ` : '<small class="text-muted">Variable</small>'}
                </div>
            </div>
        `).join('');
    },
    
    showEditPrecioModal(tipoId) {
        const tipo = this.tiposTrabajador.find(t => t.id === tipoId);
        if (!tipo) return;
        
        UI.showModal({
            title: `Editar Precio: ${tipo.nombre}`,
            content: `
                <form id="form-precio">
                    <input type="hidden" id="precio-tipo-id" value="${tipo.id}">
                    
                    <div class="form-group">
                        <label class="form-label">Precio Actual</label>
                        <div class="text-muted mb-2">${Utils.formatMoney(tipo.precio_default)}</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Nuevo Precio *</label>
                        <div class="input-group">
                            <span class="input-icon">S/</span>
                            <input type="number" id="precio-nuevo" class="form-input" 
                                   value="${tipo.precio_default}" step="0.50" min="0" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Motivo del cambio</label>
                        <input type="text" id="precio-motivo" class="form-input" 
                               placeholder="Ej: Ajuste por temporada alta">
                    </div>
                    
                    <div class="card card-warning mt-3">
                        <div class="card-body" style="padding: 12px;">
                            <small>⚠️ Este cambio afectará a <strong>todos los trabajadores</strong> de tipo "${tipo.nombre}" que no tengan precio personalizado.</small>
                        </div>
                    </div>
                </form>
            `,
            buttons: [
                { text: 'Cancelar', class: 'btn-outline', action: () => UI.closeModal() },
                { text: 'Guardar', class: 'btn-primary', action: () => this.guardarPrecio() }
            ]
        });
    },
    
    async guardarPrecio() {
        const tipoId = document.getElementById('precio-tipo-id').value;
        const nuevoPrecio = parseFloat(document.getElementById('precio-nuevo').value);
        const motivo = document.getElementById('precio-motivo')?.value.trim() || '';
        
        if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
            UI.toast('Ingresa un precio válido', 'error');
            return;
        }
        
        try {
            UI.showLoading('Guardando precio...');
            
            await Api.configuracion.actualizarPrecio(tipoId, {
                precio: nuevoPrecio,
                motivo: motivo
            });
            
            UI.hideLoading();
            UI.closeModal();
            UI.toast('Precio actualizado correctamente', 'success');
            
            await this.loadTiposTrabajador();
            
        } catch (error) {
            UI.hideLoading();
            UI.toast(error.message || 'Error al guardar precio', 'error');
        }
    },
    
    // =====================================================
    // CONFIGURACIÓN GENERAL
    // =====================================================
    
    async loadConfiguracion() {
        try {
            const response = await Api.configuracion.obtener();
            this.configuracion = response.data || {};
            this.renderConfiguracion();
        } catch (error) {
            console.error('Error cargando configuración:', error);
            this.configuracion = {
                yape_numero: '956379525',
                nombre_empresa: 'ETTUR La Universidad'
            };
            this.renderConfiguracion();
        }
    },
    
    renderConfiguracion() {
        const yapeEl = document.getElementById('config-yape');
        const empresaEl = document.getElementById('config-empresa');
        
        if (yapeEl) yapeEl.value = this.configuracion.yape_numero || '956379525';
        if (empresaEl) empresaEl.value = this.configuracion.nombre_empresa || 'ETTUR La Universidad';
    },
    
    async guardarConfiguracion() {
        const yapeNumero = document.getElementById('config-yape')?.value.trim();
        const nombreEmpresa = document.getElementById('config-empresa')?.value.trim();
        
        if (!yapeNumero || yapeNumero.length !== 9) {
            UI.toast('El número de Yape debe tener 9 dígitos', 'error');
            return;
        }
        
        try {
            UI.showLoading('Guardando...');
            
            await Api.configuracion.actualizar({
                yape_numero: yapeNumero,
                nombre_empresa: nombreEmpresa
            });
            
            UI.hideLoading();
            UI.toast('Configuración guardada', 'success');
            
        } catch (error) {
            UI.hideLoading();
            UI.toast(error.message || 'Error al guardar', 'error');
        }
    },
    
    // =====================================================
    // CONFIGURACIÓN DE TEMPORADAS
    // =====================================================
    
    async loadConfigTemporadas() {
        // Renderizar checkboxes de meses
        this.renderMesesCheckboxes();
        
        try {
            const response = await Api.get('/configuracion/temporadas');
            const config = response.data || {};
            
            // Cargar meses seleccionados
            this.mesesSeleccionados = config.meses_temporada_baja || [1, 2, 3];
            this.mesesSeleccionados.forEach(mes => {
                const label = document.getElementById(`mes-${mes}`);
                const checkbox = label?.querySelector('input');
                if (checkbox) {
                    checkbox.checked = true;
                    label?.classList.add('selected');
                }
            });
            
            // Cargar precios
            const precioSemanal = document.getElementById('precio-semanal-baja');
            const precioMensual = document.getElementById('precio-mensual-baja');
            
            if (precioSemanal) precioSemanal.value = config.precio_semanal_baja || 5.00;
            if (precioMensual) precioMensual.value = config.precio_mensual_baja || 20.00;
            
        } catch (error) {
            console.error('Error cargando config temporadas:', error);
            // Valores por defecto
            this.mesesSeleccionados = [1, 2, 3];
            [1, 2, 3].forEach(mes => {
                const label = document.getElementById(`mes-${mes}`);
                const checkbox = label?.querySelector('input');
                if (checkbox) {
                    checkbox.checked = true;
                    label?.classList.add('selected');
                }
            });
            
            const precioSemanal = document.getElementById('precio-semanal-baja');
            const precioMensual = document.getElementById('precio-mensual-baja');
            if (precioSemanal) precioSemanal.value = 5.00;
            if (precioMensual) precioMensual.value = 20.00;
        }
    },
    
    renderMesesCheckboxes() {
        const container = document.getElementById('meses-temporada-baja');
        if (!container) return;
        
        container.innerHTML = this.nombresMeses.map((nombre, i) => {
            const mes = i + 1;
            return `
                <label class="mes-checkbox" id="mes-${mes}">
                    <input type="checkbox" value="${mes}" onchange="AdminConfiguracion.toggleMes(${mes})">
                    <span>${nombre}</span>
                </label>
            `;
        }).join('');
    },
    
    toggleMes(mes) {
        const label = document.getElementById(`mes-${mes}`);
        const checkbox = label?.querySelector('input');
        
        if (checkbox?.checked) {
            if (!this.mesesSeleccionados.includes(mes)) {
                this.mesesSeleccionados.push(mes);
            }
            label?.classList.add('selected');
        } else {
            this.mesesSeleccionados = this.mesesSeleccionados.filter(m => m !== mes);
            label?.classList.remove('selected');
        }
        
        this.mesesSeleccionados.sort((a, b) => a - b);
    },
    
    async guardarTemporadas() {
        const precioSemanal = document.getElementById('precio-semanal-baja')?.value;
        const precioMensual = document.getElementById('precio-mensual-baja')?.value;
        
        if (this.mesesSeleccionados.length === 0) {
            UI.toast('Selecciona al menos un mes para temporada baja', 'error');
            return;
        }
        
        if (!precioSemanal || parseFloat(precioSemanal) < 0) {
            UI.toast('Ingresa un precio semanal válido', 'error');
            return;
        }
        
        if (!precioMensual || parseFloat(precioMensual) < 0) {
            UI.toast('Ingresa un precio mensual válido', 'error');
            return;
        }
        
        try {
            UI.showLoading('Guardando...');
            
            await Api.put('/configuracion/temporadas', {
                meses_temporada_baja: this.mesesSeleccionados,
                precio_semanal_baja: parseFloat(precioSemanal),
                precio_mensual_baja: parseFloat(precioMensual)
            });
            
            UI.hideLoading();
            UI.toast('Configuración de temporadas guardada', 'success');
            
        } catch (error) {
            UI.hideLoading();
            UI.toast('Error al guardar: ' + (error.message || 'Intenta de nuevo'), 'error');
        }
    },
    
    showTemporadasInfo() {
        const mesesBaja = this.mesesSeleccionados.map(m => this.nombresMeses[m-1]).join(', ') || 'Ene, Feb, Mar';
        
        UI.showModal({
            title: 'Información de Temporadas',
            content: `
                <div class="mb-4">
                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">🌴 Temporada Baja</h4>
                    <p class="text-muted" style="font-size: 13px;">${mesesBaja}</p>
                    <p style="font-size: 13px;">En estos meses aplican los precios reducidos configurados.</p>
                </div>
                
                <div class="mb-4">
                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">📚 Temporada Normal</h4>
                    <p class="text-muted" style="font-size: 13px;">Los demás meses del año</p>
                    <p style="font-size: 13px;">Se aplican los precios estándar según tipo de trabajador.</p>
                </div>
                
                <div class="card" style="background: #e3f2fd; border: none;">
                    <div class="card-body" style="padding: 12px;">
                        <small>💡 Los precios de temporada se aplican automáticamente. Los trabajadores con precio personalizado no se ven afectados.</small>
                    </div>
                </div>
            `,
            buttons: [
                { text: 'Entendido', class: 'btn-primary', action: () => UI.closeModal() }
            ]
        });
    }
};

window.AdminConfiguracion = AdminConfiguracion;
