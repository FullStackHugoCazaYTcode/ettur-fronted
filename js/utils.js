/**
 * =====================================================
 * ETTUR LA UNIVERSIDAD - UTILIDADES
 * Archivo: js/utils.js
 * =====================================================
 */

// Storage - Mejorado para Cordova/Móvil
const Storage = {
    // Memoria temporal como fallback
    _memoryStorage: {},
    
    set(key, value) {
        try {
            const stringValue = JSON.stringify(value);
            localStorage.setItem(key, stringValue);
            // También guardar en memoria como backup
            this._memoryStorage[key] = stringValue;
            console.log('Storage.set:', key, '- guardado correctamente');
            return true;
        } catch (e) {
            console.error('Storage.set error:', e);
            // Guardar en memoria si localStorage falla
            this._memoryStorage[key] = JSON.stringify(value);
            return true;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            // Primero intentar localStorage
            let data = localStorage.getItem(key);
            
            // Si no hay en localStorage, buscar en memoria
            if (!data && this._memoryStorage[key]) {
                data = this._memoryStorage[key];
                console.log('Storage.get:', key, '- recuperado de memoria');
            }
            
            if (data) {
                const parsed = JSON.parse(data);
                console.log('Storage.get:', key, '- encontrado');
                return parsed;
            }
            
            console.log('Storage.get:', key, '- no encontrado');
            return defaultValue;
        } catch (e) {
            console.error('Storage.get error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            delete this._memoryStorage[key];
        } catch (e) {
            delete this._memoryStorage[key];
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            this._memoryStorage = {};
        } catch (e) {
            this._memoryStorage = {};
        }
    },
    
    // Debug: mostrar todo lo guardado
    debug() {
        console.log('=== STORAGE DEBUG ===');
        console.log('localStorage disponible:', typeof localStorage !== 'undefined');
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                console.log(key, ':', localStorage.getItem(key)?.substring(0, 50) + '...');
            }
        } catch (e) {
            console.log('Error leyendo localStorage:', e);
        }
        console.log('memoryStorage:', Object.keys(this._memoryStorage));
        console.log('=== FIN DEBUG ===');
    }
};

// Utilidades
const Utils = {
    // Formatear dinero
    formatMoney(amount) {
        const num = parseFloat(amount) || 0;
        return `S/ ${num.toFixed(2)}`;
    },
    
    // Formatear fecha
    formatDate(dateString, format = 'short') {
        if (!dateString) return '-';
        const date = new Date(dateString);
        
        if (format === 'short') {
            return date.toLocaleDateString('es-PE');
        }
        if (format === 'long') {
            return date.toLocaleDateString('es-PE', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
        }
        return dateString;
    },
    
    // Obtener iniciales
    getInitials(name, lastName = '') {
        const first = name ? name.charAt(0).toUpperCase() : '';
        const last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return first + last || '??';
    },
    
    // Validar DNI
    validateDNI(dni) {
        return /^\d{8}$/.test(dni.toString().trim());
    },
    
    // Validar placa
    validatePlaca(placa) {
        return /^[A-Z0-9]{3,4}-?[A-Z0-9]{2,3}$/i.test(placa.toString().trim());
    },
    
    // Formatear placa
    formatPlaca(placa) {
        return placa.toString().trim().toUpperCase();
    },
    
    // Copiar al portapapeles
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Generar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Obtener estado de pago
    getPaymentStatus(status) {
        return Config.ESTADOS_PAGO[status] || { label: status, color: 'gray', icon: '❓' };
    },
    
    // Nombre del mes
    getMonthName(month) {
        return Config.MESES[month] || '';
    }
};

window.Storage = Storage;
window.Utils = Utils;
