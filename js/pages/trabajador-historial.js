/**
 * =====================================================
 * ETTUR - TRABAJADOR HISTORIAL
 * Archivo: js/pages/trabajador-historial.js
 * =====================================================
 */

const TrabajadorHistorial = {
    anioActual: new Date().getFullYear(),
    
    async init() {
        await this.loadHistorial(this.anioActual);
    },
    
    async cambiarAnio(anio) {
        this.anioActual = parseInt(anio);
        await this.loadHistorial(this.anioActual);
    },
    
    async loadHistorial(anio) {
        try {
            UI.showLoading('Cargando historial...');
            const response = await Api.pagos.misPagos(anio);
            UI.hideLoading();
            
            const data = response.data || {};
            const pagos = data.pagos || [];
            
            const totalEl = document.getElementById('historial-total');
            const semanasEl = document.getElementById('historial-semanas');
            const listaEl = document.getElementById('historial-lista');
            
            if (totalEl) totalEl.textContent = Utils.formatMoney(data.total_pagado || 0);
            if (semanasEl) semanasEl.textContent = data.semanas_pagadas || 0;
            
            if (listaEl) {
                if (pagos.length === 0) {
                    listaEl.innerHTML = '<p class="text-muted text-center py-4">Sin pagos este año</p>';
                } else {
                    listaEl.innerHTML = pagos.map(p => this.renderPagoItem(p)).join('');
                }
            }
            
        } catch (error) {
            UI.hideLoading();
            console.error('Error:', error);
        }
    },
    
    renderPagoItem(pago) {
        const status = Utils.getPaymentStatus(pago.estado);
        const bgColor = status.color === 'success' ? '#E8F5E9' : 
                       status.color === 'danger' ? '#FFEBEE' : '#FFF3E0';
        
        return `
            <div style="display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eee;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${bgColor}; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    ${status.icon}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">Semana ${pago.numero_semana || '-'}</div>
                    <div class="text-muted" style="font-size: 12px;">${Utils.formatDate(pago.created_at)}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600;">${Utils.formatMoney(pago.monto)}</div>
                    <span class="badge badge-${status.color}" style="font-size: 10px;">${status.label}</span>
                </div>
            </div>
        `;
    }
};

window.TrabajadorHistorial = TrabajadorHistorial;
