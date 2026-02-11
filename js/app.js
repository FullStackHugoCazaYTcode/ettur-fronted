/**
 * =====================================================
 * ETTUR LA UNIVERSIDAD - APP PRINCIPAL
 * Archivo: js/app.js
 * =====================================================
 */

const App = {
    currentPage: null,
    history: [],
    
    // Inicializar
    init() {
        console.log('🚀 ETTUR App iniciando...');
        
        UI.init();
        this.setupEventListeners();
        
        if (Auth.init()) {
            Auth.redirectByRole();
        } else {
            this.navigateTo('login');
        }
        
        console.log('✅ ETTUR App lista');
    },
    
    // Event Listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Logout buttons
        document.querySelectorAll('[data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', () => Auth.logout());
        });
        
        // Navigation
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        let targetPage = item.dataset.page;
        
        // Si el coadmin hace clic en "Inicio" (admin-dashboard), redirigir a coadmin-dashboard
        if (targetPage === 'admin-dashboard' && Auth.isCoadmin()) {
            targetPage = 'coadmin-dashboard';
        }
        
        this.navigateTo(targetPage);
    });
});

    },
    
    // Handle Login
    async handleLogin(e) {
        e.preventDefault();
        
        const dni = document.getElementById('login-dni').value.trim();
        const placa = document.getElementById('login-placa').value.trim().toUpperCase();
        
        // Reset errors
        document.getElementById('error-dni').textContent = '';
        document.getElementById('error-placa').textContent = '';
        
        // Validate
        let hasError = false;
        if (!dni || dni.length !== 8) {
            document.getElementById('error-dni').textContent = 'DNI debe tener 8 dígitos';
            hasError = true;
        }
        if (!placa) {
            document.getElementById('error-placa').textContent = 'Placa es requerida';
            hasError = true;
        }
        
        if (hasError) return;
        
        try {
            await Auth.login(dni, placa);
        } catch (error) {
            console.error('Login error:', error);
        }
    },
    
    // Navegación
    navigateTo(pageId) {
        // Guardar historial
        if (this.currentPage && this.currentPage !== pageId) {
            this.history.push(this.currentPage);
        }
        
        // Ocultar todas las páginas
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Mostrar página destino
        const page = document.getElementById(`page-${pageId}`);
        if (page) {
            page.classList.add('active');
            this.currentPage = pageId;
            this.updateNavigation(pageId);
            this.loadPage(pageId);
            window.scrollTo(0, 0);
        }
    },
    
    // Volver atrás
    goBack() {
        if (this.history.length > 0) {
            this.navigateTo(this.history.pop());
        } else if (Auth.isAuthenticated()) {
            Auth.redirectByRole();
        }
    },
    
    // Actualizar navegación activa
    updateNavigation(pageId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });
    },
    
    // Cargar datos de página
    async loadPage(pageId) {
        try {
            switch (pageId) {
                case 'admin-dashboard':
                    if (typeof AdminDashboard !== 'undefined') await AdminDashboard.init();
                    break;
                case 'admin-usuarios':
                    if (typeof AdminUsuarios !== 'undefined') await AdminUsuarios.init();
                    break;
                case 'admin-reportes':
                    if (typeof AdminReportes !== 'undefined') await AdminReportes.init();
                    break;
                case 'admin-configuracion':
                    if (typeof AdminConfiguracion !== 'undefined') await AdminConfiguracion.init();
                    break;
                case 'trabajador-dashboard':
                    if (typeof TrabajadorDashboard !== 'undefined') await TrabajadorDashboard.init();
                    break;
                case 'trabajador-pagar':
                    if (typeof TrabajadorPagar !== 'undefined') await TrabajadorPagar.init();
                    break;
                case 'trabajador-historial':
                    if (typeof TrabajadorHistorial !== 'undefined') await TrabajadorHistorial.init();
                    break;
                case 'coadmin-dashboard':
                    if (typeof CoadminDashboard !== 'undefined') await CoadminDashboard.init();
                    break;
            }
        } catch (error) {
            console.error('Error cargando página:', error);
        }
    }
};

// Iniciar cuando DOM esté listo
document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
