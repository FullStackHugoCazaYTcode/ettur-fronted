/**
 * =====================================================
 * ETTUR LA UNIVERSIDAD - AUTENTICACIÓN
 * Archivo: js/auth.js
 * =====================================================
 */

const Auth = {
    currentUser: null,
    permisos: null,
    
    // Inicializar
    init() {
        this.currentUser = Storage.get(Config.STORAGE.USER);
        this.permisos = Storage.get(Config.STORAGE.PERMISOS);
        return !!(Storage.get(Config.STORAGE.TOKEN) && this.currentUser);
    },
    
    // Login
    async login(dni, placa) {
        try {
            UI.showLoading('Iniciando sesión...');
            
            console.log('=== INICIANDO LOGIN ===');
            console.log('DNI:', dni, 'Placa:', placa);
            
            const response = await Api.auth.login(dni, placa);
            
            console.log('Respuesta login:', response);
            
            if (response.success) {
                // Guardar datos
                console.log('Guardando token...');
                Storage.set(Config.STORAGE.TOKEN, response.data.token);
                
                console.log('Guardando usuario...');
                Storage.set(Config.STORAGE.USER, response.data.user);
                
                console.log('Guardando permisos...');
                Storage.set(Config.STORAGE.PERMISOS, response.data.permisos);
                
                // Verificar que se guardó
                console.log('Verificando storage...');
                Storage.debug();
                
                this.currentUser = response.data.user;
                this.permisos = response.data.permisos;
                
                UI.hideLoading();
                UI.toast('¡Bienvenido!', 'success');
                
                console.log('Redirigiendo por rol:', this.currentUser.rol);
                this.redirectByRole();
                return response;
            }
        } catch (error) {
            UI.hideLoading();
            console.error('Error en login:', error);
            UI.toast(error.message || 'Error al iniciar sesión', 'error');
            throw error;
        }
    },
    
    // Logout
    logout() {
        Api.auth.logout().catch(() => {});
        
        Storage.remove(Config.STORAGE.TOKEN);
        Storage.remove(Config.STORAGE.USER);
        Storage.remove(Config.STORAGE.PERMISOS);
        
        this.currentUser = null;
        this.permisos = null;
        
        App.navigateTo('login');
        UI.toast('Sesión cerrada', 'success');
    },
    
    // Getters
    isAuthenticated() {
        return !!(Storage.get(Config.STORAGE.TOKEN) && this.currentUser);
    },
    
    getUser() {
        return this.currentUser;
    },
    
    getRole() {
        return this.currentUser?.rol || null;
    },
    
    getPermisos() {
        return this.permisos || {};
    },
    
    // Verificaciones de rol
    isAdminGeneral() {
        return this.getRole() === 'admin_general';
    },
    
    isCoadmin() {
        return this.getRole() === 'coadministrador';
    },
    
    isTrabajador() {
        return this.getRole() === 'trabajador';
    },
    
    isAdmin() {
        return this.isAdminGeneral() || this.isCoadmin();
    },
    
    // =====================================================
    // VERIFICACIÓN DE PERMISOS
    // =====================================================
    
    // Verificar si tiene un permiso específico
    hasPermission(permission) {
        // Admin General tiene TODOS los permisos
        if (this.isAdminGeneral()) return true;
        
        // Trabajador no tiene permisos de admin
        if (this.isTrabajador()) return false;
        
        // Coadmin - verificar permiso específico
        if (this.isCoadmin() && this.permisos) {
            return this.permisos[permission] === true;
        }
        
        return false;
    },
    
    // Permisos específicos
    canRegistrarTrabajadores() {
        return this.hasPermission('puede_registrar_trabajadores');
    },
    
    canModificarPrecios() {
        return this.hasPermission('puede_modificar_precios');
    },
    
    canAprobarPagos() {
        return this.hasPermission('puede_aprobar_pagos');
    },
    
    canVerReportes() {
        return this.hasPermission('puede_ver_reportes');
    },
    
    canEliminarTrabajadores() {
        return this.hasPermission('puede_eliminar_trabajadores');
    },
    
    // =====================================================
    // REDIRECCIÓN POR ROL
    // =====================================================
    redirectByRole() {
        const role = this.getRole();
        switch (role) {
            case 'admin_general':
                App.navigateTo('admin-dashboard');
                break;
            case 'coadministrador':
                App.navigateTo('coadmin-dashboard');
                break;
            case 'trabajador':
                App.navigateTo('trabajador-dashboard');
                break;
            default:
                App.navigateTo('login');
        }
    }
};

window.Auth = Auth;
