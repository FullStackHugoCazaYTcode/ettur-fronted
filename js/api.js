/**
 * =====================================================
 * ETTUR LA UNIVERSIDAD - API
 * Archivo: js/api.js
 * =====================================================
 */

const Api = {
    // Request base
    async request(endpoint, options = {}) {
        const url = `${Config.API_URL}${endpoint}`;
        const token = Storage.get(Config.STORAGE.TOKEN);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Solo agregar token si existe y NO es el endpoint de login
        if (token && !endpoint.includes('/auth/login')) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            method: options.method || 'GET',
            headers: { ...headers, ...options.headers }
        };
        
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            console.log('API →', config.method, endpoint);
            const response = await fetch(url, config);
            const data = await response.json();
            
            // Si es 401 y NO es login, hacer logout
            if (response.status === 401 && !endpoint.includes('/auth/login')) {
                console.error('Sesión expirada, redirigiendo a login...');
                Storage.remove(Config.STORAGE.TOKEN);
                Storage.remove(Config.STORAGE.USER);
                Storage.remove(Config.STORAGE.PERMISOS);
                window.location.reload();
                throw new Error('Sesión expirada');
            }
            
            if (!response.ok) {
                console.error('API Error:', response.status, data.message);
                throw new Error(data.message || 'Error en la petición');
            }
            
            console.log('API ✓', endpoint, '- OK');
            return data;
        } catch (error) {
            console.error('API Error:', error.message);
            throw error;
        }
    },
    
    get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request(url);
    },
    
    post(endpoint, body = {}) {
        return this.request(endpoint, { method: 'POST', body });
    },
    
    put(endpoint, body = {}) {
        return this.request(endpoint, { method: 'PUT', body });
    },
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // AUTH
    auth: {
        login: (dni, placa) => Api.post('/auth/login', { dni, placa }),
        logout: () => Api.post('/auth/logout'),
        me: () => Api.get('/auth/me')
    },
    
    // USUARIOS
    usuarios: {
        listar: (params = {}) => Api.get('/usuarios', params),
        obtener: (id) => Api.get(`/usuarios/${id}`),
        crear: (data) => Api.post('/usuarios', data),
        actualizar: (id, data) => Api.put(`/usuarios/${id}`, data),
        eliminar: (id) => Api.delete(`/usuarios/${id}`),
        toggleActivo: (id) => Api.put(`/usuarios/${id}/activar`),
        cambiarTipo: (id, tipoId, precio = null) => Api.put(`/usuarios/${id}/tipo`, { tipo_trabajador_id: tipoId, precio_personalizado: precio }),
        actualizarPermisos: (id, permisos) => Api.put(`/usuarios/${id}/permisos`, permisos)
    },
    
    // PAGOS
    pagos: {
        listar: (params = {}) => Api.get('/pagos', params),
        obtener: (id) => Api.get(`/pagos/${id}`),
        misPagos: (anio = null) => Api.get('/pagos/mis-pagos', anio ? { anio } : {}),
        pendientes: () => Api.get('/pagos/pendientes'),
        semanasPendientes: () => Api.get('/pagos/semanas-pendientes'),
        mesesPendientes: () => Api.get('/pagos/meses-pendientes'),
        registrar: (data) => Api.post('/pagos', data),
        validar: (id) => Api.put(`/pagos/${id}/validar`),
        rechazar: (id, motivo) => Api.put(`/pagos/${id}/rechazar`, { motivo })
    },
    
    // SEMANAS
    semanas: {
        listar: (params = {}) => Api.get('/semanas', params),
        actual: () => Api.get('/semanas/actual'),
        obtener: (id) => Api.get(`/semanas/${id}`)
    },
    
    // CONFIGURACIÓN
    configuracion: {
        obtener: () => Api.get('/configuracion'),
        precios: () => Api.get('/configuracion/precios'),
        tiposTrabajador: () => Api.get('/configuracion/tipos-trabajador'),
        actualizar: (data) => Api.put('/configuracion', data),
        actualizarPrecio: (tipoId, data) => Api.put(`/configuracion/precio/${tipoId}`, data)
    },
    
    // REPORTES
    reportes: {
        dashboard: (params = {}) => Api.get('/reportes/dashboard', params),
        semanal: (semanaId = null) => Api.get('/reportes/semanal', semanaId ? { semana_id: semanaId } : {}),
        mensual: (mes = null, anio = null) => Api.get('/reportes/mensual', { mes, anio }),
        anual: (anio = null) => Api.get('/reportes/anual', anio ? { anio } : {}),
        morosos: (anio = null) => Api.get('/reportes/morosos', anio ? { anio } : {}),
        trabajador: (id, anio = null) => Api.get('/reportes/trabajador', { id, anio })
    }
};

window.Api = Api;
