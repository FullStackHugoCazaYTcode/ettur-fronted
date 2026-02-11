/**
 * =====================================================
 * ETTUR LA UNIVERSIDAD - UI (Interfaz)
 * Archivo: js/ui.js
 * =====================================================
 * ACTUALIZADO: Corregido manejo de botones en modales
 * =====================================================
 */

const UI = {
    toastContainer: null,
    currentModalButtons: [], // Guardar referencia a los botones
    
    // Inicializar
    init() {
        this.createToastContainer();
    },
    
    // Crear contenedor de toasts
    createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        this.toastContainer = container;
    },
    
    // Toast
    toast(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    // Loading
    showLoading(text = 'Cargando...') {
        let overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const textEl = overlay.querySelector('.loading-text');
            if (textEl) textEl.textContent = text;
            overlay.classList.add('active');
        }
    },
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('active');
    },
    
    // Modal (CORREGIDO)
    showModal(options = {}) {
        const { title = '', content = '', buttons = [], size = '' } = options;
        const modalId = 'modal-' + Utils.generateId();
        
        // Guardar botones para referencia
        this.currentModalButtons = buttons;
        
        // Crear HTML de botones con índice
        const buttonsHtml = buttons.map((btn, index) => 
            `<button class="btn ${btn.class || 'btn-secondary'}" data-btn-index="${index}">${btn.text}</button>`
        ).join('');
        
        const html = `
            <div class="modal-overlay active" id="${modalId}">
                <div class="modal ${size}">
                    ${title ? `
                        <div class="modal-header">
                            <h3 class="modal-title">${title}</h3>
                            <button class="modal-close" data-close="true">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                    <div class="modal-body">${content}</div>
                    ${buttons.length ? `<div class="modal-footer">${buttonsHtml}</div>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = html;
        
        const modal = document.getElementById(modalId);
        
        // Event listener para botón X (cerrar)
        const closeBtn = modal.querySelector('[data-close="true"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Event listeners para botones del footer
        modal.querySelectorAll('[data-btn-index]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.btnIndex);
                const buttonConfig = this.currentModalButtons[index];
                
                if (buttonConfig) {
                    // Si tiene función action, ejecutarla
                    if (typeof buttonConfig.action === 'function') {
                        buttonConfig.action();
                    }
                    // Si tiene función onClick, ejecutarla
                    else if (typeof buttonConfig.onClick === 'function') {
                        buttonConfig.onClick();
                    }
                    // Si no tiene función, solo cerrar
                    else {
                        this.closeModal();
                    }
                }
            });
        });
        
        // Cerrar al clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        return modalId;
    },
    
    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) {
            container.innerHTML = '';
        }
        this.currentModalButtons = [];
    },
    
    // Confirm
    confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            this.showModal({
                title,
                content: `<p style="text-align: center; margin: 0;">${message}</p>`,
                buttons: [
                    { 
                        text: 'Cancelar', 
                        class: 'btn-outline', 
                        action: () => { 
                            this.closeModal(); 
                            resolve(false); 
                        } 
                    },
                    { 
                        text: 'Confirmar', 
                        class: 'btn-primary', 
                        action: () => { 
                            this.closeModal(); 
                            resolve(true); 
                        } 
                    }
                ]
            });
        });
    },
    
    // Helpers
    show(selector) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (el) el.classList.remove('hidden');
    },
    
    hide(selector) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (el) el.classList.add('hidden');
    },
    
    // Render helpers
    renderAvatar(name, lastName = '') {
        return `<div class="avatar">${Utils.getInitials(name, lastName)}</div>`;
    },
    
    renderBadge(text, type = 'default') {
        return `<span class="badge badge-${type}">${text}</span>`;
    },
    
    renderEmpty(icon = '📭', title = 'Sin datos', text = '') {
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3 class="empty-title">${title}</h3>
                ${text ? `<p class="empty-text">${text}</p>` : ''}
            </div>
        `;
    }
};

window.UI = UI;
