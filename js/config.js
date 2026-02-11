/**
 * =====================================================
 * ETTUR LA UNIVERSIDAD - CONFIGURACIÓN
 * Archivo: js/config.js
 * =====================================================
 */

const Config = {
    // API
    API_URL: 'https://ettur-api-production.up.railway.app',
    
    // App Info
    APP_NAME: 'ETTUR La Universidad',
    APP_VERSION: '1.0.0',
    
    // Yape
    YAPE_NUMERO: '956379525',
    
    // Storage Keys
    STORAGE: {
        TOKEN: 'ettur_token',
        USER: 'ettur_user',
        PERMISOS: 'ettur_permisos'
    },
    
    // Tiempos
    TOAST_DURATION: 3000,
    
    // Estados de pago
    ESTADOS_PAGO: {
        pendiente: { label: 'Pendiente', color: 'warning', icon: '⏳' },
        pendiente_validacion: { label: 'Por validar', color: 'info', icon: '🔍' },
        pagado: { label: 'Pagado', color: 'success', icon: '✅' },
        rechazado: { label: 'Rechazado', color: 'danger', icon: '❌' }
    },
    
    // Roles
    ROLES: {
        admin_general: { label: 'Administrador General', icon: '👑' },
        coadministrador: { label: 'Coadministrador', icon: '👤' },
        trabajador: { label: 'Trabajador', icon: '🚐' }
    },
    
    // Tipos de trabajador
    TIPOS_TRABAJADOR: {
        1: { nombre: 'Normal Semanal', precio: 12.50 },
        2: { nombre: 'Especial Semanal', precio: 10.00 },
        3: { nombre: 'Mensual', precio: 30.00 },
        4: { nombre: 'Especial Personalizado', precio: 0 }
    },
    
    // Meses
    MESES: ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
};

window.Config = Config;
