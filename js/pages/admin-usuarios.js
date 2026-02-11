/**
 * =====================================================
 * ETTUR - ADMIN USUARIOS (Trabajadores + Coadmins)
 * Archivo: js/pages/admin-usuarios.js
 * =====================================================
 */

const AdminUsuarios = {
    usuarios: [],
    tiposTrabajador: [],
    filtroActual: 'todos', // todos, trabajadores, coadmins
    
    // Inicializar
    async init() {
        console.log('AdminUsuarios.init() iniciando...');
        this.filtroActual = 'todos'; // Siempre empezar con "todos"
        this.applyPermisos();
        this.setupFilters();
        await this.loadTiposTrabajador();
        await this.loadUsuarios();
    },
    
    // Aplicar permisos - Ocultar/mostrar botones según permisos
    applyPermisos() {
        const isCoadmin = Auth.isCoadmin();
        
        // Botón agregar usuario (solo si puede registrar)
        const btnAgregar = document.getElementById('btn-agregar-usuario');
        if (btnAgregar) {
            if (Auth.isAdminGeneral() || Auth.canRegistrarTrabajadores()) {
                btnAgregar.style.display = 'flex';
            } else {
                btnAgregar.style.display = 'none';
            }
        }
        
        // Tab de coadmins (solo admin general puede ver/crear coadmins)
        const tabCoadmins = document.querySelector('[data-filter="coadmins"]');
        if (tabCoadmins && isCoadmin) {
            tabCoadmins.style.display = 'none';
        }
    },
    
    // Setup filtros - CORREGIDO
    setupFilters() {
        const tabs = document.querySelectorAll('#page-admin-usuarios .tab-filter');
        
        // Primero resetear todos los tabs
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.filter === 'todos') {
                tab.classList.add('active');
            }
        });
        
        // Agregar eventos
        tabs.forEach(tab => {
            // Remover eventos anteriores clonando el elemento
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            newTab.addEventListener('click', (e) => {
                e.preventDefault();
                // Quitar active de todos
                document.querySelectorAll('#page-admin-usuarios .tab-filter').forEach(t => t.classList.remove('active'));
                // Agregar active al clickeado
                newTab.classList.add('active');
                // Cambiar filtro
                this.filtroActual = newTab.dataset.filter;
                console.log('Filtro cambiado a:', this.filtroActual);
                this.renderUsuarios();
            });
        });
    },
    
    // Cargar tipos de trabajador
    async loadTiposTrabajador() {
        this.tiposTrabajador = [
            { id: 1, nombre: 'Normal Semanal', precio_default: 12.50 },
            { id: 2, nombre: 'Especial Semanal', precio_default: 10.00 },
            { id: 3, nombre: 'Mensual', precio_default: 30.00 },
            { id: 4, nombre: 'Especial Personalizado', precio_default: 0 }
        ];
        
        try {
            const response = await Api.configuracion.tiposTrabajador();
            if (response.data?.tipos?.length > 0) {
                this.tiposTrabajador = response.data.tipos;
            }
        } catch (error) {
            console.log('Usando tipos por defecto');
        }
    },
    
    // Cargar usuarios - CORREGIDO
    async loadUsuarios() {
        const container = document.getElementById('lista-usuarios');
        if (!container) {
            console.error('Container lista-usuarios no encontrado');
            return;
        }
        
        try {
            UI.showLoading('Cargando usuarios...');
            console.log('Cargando usuarios...');
            
            // Cargar todos los usuarios (sin filtro de rol en la API)
            const response = await Api.usuarios.listar({ limit: 100 });
            console.log('Respuesta API:', response);
            
            // La API devuelve data.items, NO data.usuarios
            const todosUsuarios = response.data?.items || response.data?.usuarios || [];
            console.log('Usuarios obtenidos:', todosUsuarios.length);
            
            // Separar por tipo
            this.usuarios = todosUsuarios.map(u => ({
                ...u,
                tipo: u.rol === 'coadministrador' ? 'coadmin' : 'trabajador'
            }));
            
            // Filtrar: no mostrar admin_general en la lista
            this.usuarios = this.usuarios.filter(u => u.rol !== 'admin_general');
            
            console.log('Usuarios procesados (sin admin):', this.usuarios.length);
            
            UI.hideLoading();
            this.updateStats();
            this.renderUsuarios();
            
        } catch (error) {
            UI.hideLoading();
            console.error('Error cargando usuarios:', error);
            container.innerHTML = UI.renderEmpty('❌', 'Error al cargar', 'Intenta de nuevo');
        }
    },
    
    // Actualizar estadísticas - MEJORADO
    updateStats() {
        const trabajadores = this.usuarios.filter(u => u.rol === 'trabajador');
        const coadmins = this.usuarios.filter(u => u.rol === 'coadministrador');
        
        const totalEl = document.getElementById('total-usuarios');
        const trabEl = document.getElementById('total-trabajadores');
        const coadminEl = document.getElementById('total-coadmins');
        
        if (totalEl) totalEl.textContent = this.usuarios.length;
        if (trabEl) trabEl.textContent = trabajadores.length;
        if (coadminEl) coadminEl.textContent = coadmins.length;
        
        console.log('Stats actualizadas:', {
            total: this.usuarios.length,
            trabajadores: trabajadores.length,
            coadmins: coadmins.length
        });
    },
    
    // Renderizar lista según filtro - MEJORADO
    renderUsuarios() {
        const container = document.getElementById('lista-usuarios');
        if (!container) {
            console.error('Container lista-usuarios no encontrado');
            return;
        }
        
        console.log('Renderizando usuarios. Filtro:', this.filtroActual, 'Total:', this.usuarios.length);
        
        let lista = [...this.usuarios]; // Copia del array
        
        // Aplicar filtro
        if (this.filtroActual === 'trabajadores') {
            lista = lista.filter(u => u.rol === 'trabajador');
        } else if (this.filtroActual === 'coadmins') {
            lista = lista.filter(u => u.rol === 'coadministrador');
        }
        // 'todos' no filtra nada
        
        console.log('Usuarios después de filtro:', lista.length);
        
        if (lista.length === 0) {
            container.innerHTML = UI.renderEmpty('👥', 'No hay usuarios', 'Agrega el primero con el botón +');
            return;
        }
        
        container.innerHTML = lista.map(u => this.renderUsuarioCard(u)).join('');
    },
    
    // Renderizar card de usuario
    renderUsuarioCard(u) {
        const esCoadmin = u.rol === 'coadministrador';
        const rolBadge = esCoadmin ? 
            '<span class="badge badge-info">Coadmin</span>' : 
            '<span class="badge badge-default">Trabajador</span>';
        
        return `
            <div class="usuario-card ${esCoadmin ? 'usuario-coadmin' : ''}" data-id="${u.id}">
                <div class="usuario-avatar ${esCoadmin ? 'avatar-coadmin' : ''}">
                    ${esCoadmin ? '👔' : Utils.getInitials(u.nombre, u.apellido)}
                </div>
                <div class="usuario-info">
                    <div class="usuario-nombre">${u.nombre} ${u.apellido}</div>
                    <div class="usuario-meta">
                        ${esCoadmin ? `📧 DNI: ${u.dni}` : `🚗 ${u.placa} • 📄 ${u.dni}`}
                    </div>
                    <div class="usuario-badges">
                        ${rolBadge}
                        <span class="badge badge-${u.activo ? 'success' : 'danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                </div>
                <div class="usuario-actions">
                    <button class="btn-icon" onclick="AdminUsuarios.showMenu(${u.id}, '${u.rol}')" title="Opciones">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2"/>
                            <circle cx="12" cy="12" r="2"/>
                            <circle cx="12" cy="19" r="2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },
    
    // Buscar usuarios
    buscar(query) {
        const q = query.toLowerCase().trim();
        const container = document.getElementById('lista-usuarios');
        if (!container) return;
        
        let lista = this.usuarios;
        
        if (this.filtroActual === 'trabajadores') {
            lista = lista.filter(u => u.rol === 'trabajador');
        } else if (this.filtroActual === 'coadmins') {
            lista = lista.filter(u => u.rol === 'coadministrador');
        }
        
        if (q) {
            lista = lista.filter(u =>
                u.nombre.toLowerCase().includes(q) ||
                u.apellido.toLowerCase().includes(q) ||
                u.dni.includes(q) ||
                (u.placa && u.placa.toLowerCase().includes(q))
            );
        }
        
        if (lista.length === 0) {
            container.innerHTML = UI.renderEmpty('🔍', 'Sin resultados', 'Prueba con otra búsqueda');
            return;
        }
        
        container.innerHTML = lista.map(u => this.renderUsuarioCard(u)).join('');
    },
    
    // Mostrar menú de opciones
    showMenu(id, rol) {
        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) return;
        
        const esCoadmin = rol === 'coadministrador';
        const canEdit = Auth.isAdminGeneral() || Auth.canRegistrarTrabajadores();
        const canDelete = Auth.isAdminGeneral() || Auth.canEliminarTrabajadores();
        const canToggle = Auth.isAdminGeneral() || Auth.canRegistrarTrabajadores();
        const canEditPermisos = Auth.isAdminGeneral(); // Solo admin general
        
        // Construir opciones del menú según permisos
        let menuOptions = '';
        
        // Editar datos
        if (canEdit) {
            menuOptions += `
                <button class="menu-option" onclick="AdminUsuarios.showEditModal(${id});">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar datos
                </button>
            `;
        }
        
        // Configurar permisos (solo para coadmins y solo admin general)
        if (esCoadmin && canEditPermisos) {
            menuOptions += `
                <button class="menu-option" onclick="AdminUsuarios.showPermisosModal(${id});">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Configurar permisos
                </button>
            `;
        }
        
        // Activar/Desactivar
        if (canToggle) {
            menuOptions += `
                <button class="menu-option" onclick="AdminUsuarios.toggleActivo(${id});">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${usuario.activo ? 
                            '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>' :
                            '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                        }
                    </svg>
                    ${usuario.activo ? 'Desactivar' : 'Activar'}
                </button>
            `;
        }
        
        // Eliminar
        if (canDelete) {
            menuOptions += `
                <button class="menu-option text-danger" onclick="AdminUsuarios.eliminar(${id});">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Eliminar
                </button>
            `;
        }
        
        // Si no tiene ningún permiso, mostrar mensaje
        if (!menuOptions) {
            menuOptions = '<p class="text-muted text-center py-3">No tienes permisos para modificar este usuario</p>';
        }
        
        UI.showModal({
            title: `${usuario.nombre} ${usuario.apellido}`,
            content: `<div class="menu-options">${menuOptions}</div>`,
            buttons: []
        });
    },
    
    // Modal para agregar usuario
    showAddModal() {
        const tiposOptions = this.tiposTrabajador.map(t => 
            `<option value="${t.id}">${t.nombre} - ${Utils.formatMoney(t.precio_default)}</option>`
        ).join('');
        
        UI.showModal({
            title: 'Nuevo Usuario',
            size: 'modal-lg',
            content: `
                <form id="form-usuario">
                    <!-- Tipo de usuario -->
                    <div class="form-group">
                        <label class="form-label">Tipo de Usuario *</label>
                        <div class="role-selector">
                            <label class="role-option">
                                <input type="radio" name="rol" value="trabajador" checked onchange="AdminUsuarios.toggleRolFields()">
                                <div class="role-card">
                                    <span class="role-icon">🚐</span>
                                    <span class="role-name">Trabajador</span>
                                </div>
                            </label>
                            <label class="role-option">
                                <input type="radio" name="rol" value="coadministrador" onchange="AdminUsuarios.toggleRolFields()">
                                <div class="role-card">
                                    <span class="role-icon">👔</span>
                                    <span class="role-name">Coadministrador</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Datos básicos -->
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nombre *</label>
                            <input type="text" id="usuario-nombre" class="form-input" placeholder="Nombre" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Apellido *</label>
                            <input type="text" id="usuario-apellido" class="form-input" placeholder="Apellido" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">DNI *</label>
                            <input type="text" id="usuario-dni" class="form-input" placeholder="12345678" maxlength="8" required>
                        </div>
                        <div class="form-group" id="grupo-placa">
                            <label class="form-label">Placa *</label>
                            <input type="text" id="usuario-placa" class="form-input" placeholder="ABC-123" maxlength="10">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Teléfono</label>
                        <input type="tel" id="usuario-telefono" class="form-input" placeholder="987654321" maxlength="9">
                    </div>
                    
                    <!-- Campos solo para trabajador -->
                    <div id="campos-trabajador">
                        <div class="form-group">
                            <label class="form-label">Tipo de Trabajador *</label>
                            <select id="usuario-tipo" class="form-input">
                                ${tiposOptions}
                            </select>
                        </div>
                        <div class="form-group" id="grupo-precio-personalizado" style="display: none;">
                            <label class="form-label">Precio Personalizado</label>
                            <input type="number" id="usuario-precio" class="form-input" placeholder="0.00" step="0.01" min="0">
                        </div>
                    </div>
                    
                    <!-- Campos solo para coadmin -->
                    <div id="campos-coadmin" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">Permisos del Coadministrador</label>
                            <div class="permisos-list">
                                <label class="permiso-item">
                                    <input type="checkbox" id="perm-registrar" checked>
                                    <span>Registrar trabajadores</span>
                                </label>
                                <label class="permiso-item">
                                    <input type="checkbox" id="perm-precios">
                                    <span>Modificar precios</span>
                                </label>
                                <label class="permiso-item">
                                    <input type="checkbox" id="perm-pagos" checked>
                                    <span>Aprobar/Rechazar pagos</span>
                                </label>
                                <label class="permiso-item">
                                    <input type="checkbox" id="perm-reportes" checked>
                                    <span>Ver reportes</span>
                                </label>
                                <label class="permiso-item">
                                    <input type="checkbox" id="perm-eliminar">
                                    <span>Eliminar trabajadores</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            `,
            buttons: [
                { text: 'Cancelar', class: 'btn-outline', action: 'close' },
                { text: 'Guardar', class: 'btn-primary', action: 'save', onClick: () => this.guardarUsuario() }
            ]
        });
        
        // Event para tipo de trabajador
        document.getElementById('usuario-tipo')?.addEventListener('change', (e) => {
            const grupo = document.getElementById('grupo-precio-personalizado');
            if (grupo) grupo.style.display = e.target.value === '4' ? 'block' : 'none';
        });
    },
    
    // Toggle campos según rol
    toggleRolFields() {
        const rol = document.querySelector('input[name="rol"]:checked')?.value;
        const camposTrab = document.getElementById('campos-trabajador');
        const camposCoadmin = document.getElementById('campos-coadmin');
        
        if (rol === 'coadministrador') {
            if (camposTrab) camposTrab.style.display = 'none';
            if (camposCoadmin) camposCoadmin.style.display = 'block';
        } else {
            if (camposTrab) camposTrab.style.display = 'block';
            if (camposCoadmin) camposCoadmin.style.display = 'none';
        }
    },
    
    // Guardar usuario
    async guardarUsuario() {
        const rol = document.querySelector('input[name="rol"]:checked')?.value || 'trabajador';
        const nombre = document.getElementById('usuario-nombre').value.trim();
        const apellido = document.getElementById('usuario-apellido').value.trim();
        const dni = document.getElementById('usuario-dni').value.trim();
        const placa = document.getElementById('usuario-placa')?.value.trim().toUpperCase() || '';
        const telefono = document.getElementById('usuario-telefono')?.value.trim() || '';
        
        // Validaciones básicas - TODOS necesitan placa (todos tienen carro)
        if (!nombre || !apellido || !dni || !placa) {
            UI.toast('Completa todos los campos requeridos', 'error');
            return;
        }
        
        if (!Utils.validateDNI(dni)) {
            UI.toast('DNI inválido (8 dígitos)', 'error');
            return;
        }
        
        try {
            UI.showLoading('Guardando...');
            
            const userData = {
                nombre,
                apellido,
                dni,
                placa, // TODOS tienen placa
                telefono: telefono || null,
                rol
            };
            
            if (rol === 'trabajador') {
                // Trabajador tiene tipo y precio
                userData.tipo_trabajador_id = parseInt(document.getElementById('usuario-tipo').value);
                const precioPersonalizado = document.getElementById('usuario-precio')?.value;
                if (userData.tipo_trabajador_id === 4 && precioPersonalizado) {
                    userData.precio_personalizado = parseFloat(precioPersonalizado);
                }
            } else {
                // Coadmin tiene permisos
                userData.permisos = {
                    puede_registrar_trabajadores: document.getElementById('perm-registrar')?.checked || false,
                    puede_modificar_precios: document.getElementById('perm-precios')?.checked || false,
                    puede_aprobar_pagos: document.getElementById('perm-pagos')?.checked || false,
                    puede_ver_reportes: document.getElementById('perm-reportes')?.checked || false,
                    puede_eliminar_trabajadores: document.getElementById('perm-eliminar')?.checked || false
                };
            }
            
            await Api.usuarios.crear(userData);
            
            UI.hideLoading();
            UI.closeModal();
            UI.toast(`${rol === 'coadministrador' ? 'Coadministrador' : 'Trabajador'} registrado correctamente`, 'success');
            await this.loadUsuarios();
            
        } catch (error) {
            UI.hideLoading();
            UI.toast(error.message || 'Error al guardar', 'error');
        }
    },
    
    // Modal para editar permisos
    async showPermisosModal(id) {
        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) return;
        
        // Cargar permisos actuales
        let permisos = {
            puede_registrar_trabajadores: true,
            puede_modificar_precios: false,
            puede_aprobar_pagos: true,
            puede_ver_reportes: true,
            puede_eliminar_trabajadores: false
        };
        
        try {
            const response = await Api.usuarios.obtener(id);
            if (response.data?.permisos) {
                permisos = response.data.permisos;
            }
        } catch (e) {
            console.log('Usando permisos por defecto');
        }
        
        UI.showModal({
            title: `Permisos: ${usuario.nombre}`,
            content: `
                <input type="hidden" id="permisos-usuario-id" value="${id}">
                <p class="text-muted mb-3">Configura qué puede hacer este coadministrador:</p>
                <div class="permisos-list">
                    <label class="permiso-item">
                        <input type="checkbox" id="edit-perm-registrar" ${permisos.puede_registrar_trabajadores ? 'checked' : ''}>
                        <div class="permiso-info">
                            <span class="permiso-nombre">Registrar trabajadores</span>
                            <span class="permiso-desc">Puede agregar nuevos trabajadores al sistema</span>
                        </div>
                    </label>
                    <label class="permiso-item">
                        <input type="checkbox" id="edit-perm-precios" ${permisos.puede_modificar_precios ? 'checked' : ''}>
                        <div class="permiso-info">
                            <span class="permiso-nombre">Modificar precios</span>
                            <span class="permiso-desc">Puede cambiar precios de trabajadores</span>
                        </div>
                    </label>
                    <label class="permiso-item">
                        <input type="checkbox" id="edit-perm-pagos" ${permisos.puede_aprobar_pagos ? 'checked' : ''}>
                        <div class="permiso-info">
                            <span class="permiso-nombre">Aprobar/Rechazar pagos</span>
                            <span class="permiso-desc">Puede validar los pagos de Yape</span>
                        </div>
                    </label>
                    <label class="permiso-item">
                        <input type="checkbox" id="edit-perm-reportes" ${permisos.puede_ver_reportes ? 'checked' : ''}>
                        <div class="permiso-info">
                            <span class="permiso-nombre">Ver reportes</span>
                            <span class="permiso-desc">Puede ver reportes y estadísticas</span>
                        </div>
                    </label>
                    <label class="permiso-item">
                        <input type="checkbox" id="edit-perm-eliminar" ${permisos.puede_eliminar_trabajadores ? 'checked' : ''}>
                        <div class="permiso-info">
                            <span class="permiso-nombre">Eliminar trabajadores</span>
                            <span class="permiso-desc">Puede eliminar trabajadores del sistema</span>
                        </div>
                    </label>
                </div>
            `,
            buttons: [
                { text: 'Cancelar', class: 'btn-outline', action: 'close' },
                { text: 'Guardar', class: 'btn-primary', action: 'save', onClick: () => this.guardarPermisos() }
            ]
        });
    },
    
    // Guardar permisos
    async guardarPermisos() {
        const id = document.getElementById('permisos-usuario-id').value;
        
        const permisos = {
            puede_registrar_trabajadores: document.getElementById('edit-perm-registrar')?.checked || false,
            puede_modificar_precios: document.getElementById('edit-perm-precios')?.checked || false,
            puede_aprobar_pagos: document.getElementById('edit-perm-pagos')?.checked || false,
            puede_ver_reportes: document.getElementById('edit-perm-reportes')?.checked || false,
            puede_eliminar_trabajadores: document.getElementById('edit-perm-eliminar')?.checked || false
        };
        
        try {
            UI.showLoading('Guardando permisos...');
            
            // Usar el endpoint específico de permisos
            await Api.usuarios.actualizarPermisos(id, permisos);
            
            UI.hideLoading();
            UI.closeModal();
            UI.toast('Permisos actualizados correctamente', 'success');
            
            // Recargar lista de usuarios
            await this.loadUsuarios();
        } catch (error) {
            UI.hideLoading();
            console.error('Error al guardar permisos:', error);
            UI.toast(error.message || 'Error al guardar permisos', 'error');
        }
    },
    
    // Modal editar usuario
    showEditModal(id) {
        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) return;
        
        UI.showModal({
            title: 'Editar Usuario',
            size: 'modal-lg',
            content: `
                <form id="form-editar-usuario">
                    <input type="hidden" id="editar-id" value="${usuario.id}">
                    
                    <div class="form-group mb-3">
                        <label class="form-label text-muted">DNI (no editable)</label>
                        <input type="text" class="form-input" value="${usuario.dni}" disabled style="background: #f5f5f5;">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nombre *</label>
                            <input type="text" id="editar-nombre" class="form-input" value="${usuario.nombre}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Apellido *</label>
                            <input type="text" id="editar-apellido" class="form-input" value="${usuario.apellido}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Placa</label>
                        <input type="text" id="editar-placa" class="form-input" value="${usuario.placa || ''}" maxlength="10" placeholder="ABC-123">
                    </div>
                </form>
            `,
            buttons: [
                { text: 'Cancelar', class: 'btn-outline', action: 'close' },
                { text: 'Actualizar', class: 'btn-primary', action: 'save', onClick: () => this.actualizarUsuario() }
            ]
        });
    },
    
    // Actualizar usuario
    async actualizarUsuario() {
        const id = document.getElementById('editar-id').value;
        const nombre = document.getElementById('editar-nombre').value.trim();
        const apellido = document.getElementById('editar-apellido').value.trim();
        const placa = document.getElementById('editar-placa').value.trim().toUpperCase();
        const telefono = document.getElementById('editar-telefono')?.value.trim();
        
        if (!nombre || !apellido) {
            UI.toast('Completa nombre y apellido', 'error');
            return;
        }
        
        // Preparar datos (no enviamos DNI porque no se puede cambiar)
        const data = { 
            nombre, 
            apellido, 
            placa: placa || null
        };
        
        // Solo agregar teléfono si existe el campo
        if (telefono) {
            data.telefono = telefono;
        }
        
        try {
            UI.showLoading('Actualizando...');
            console.log('Actualizando usuario:', id, data);
            
            await Api.usuarios.actualizar(id, data);
            
            UI.hideLoading();
            UI.closeModal();
            UI.toast('Usuario actualizado correctamente', 'success');
            await this.loadUsuarios();
        } catch (error) {
            UI.hideLoading();
            console.error('Error al actualizar:', error);
            UI.toast(error.message || 'Error al actualizar', 'error');
        }
    },
    
    // Toggle activo
    async toggleActivo(id) {
        const usuario = this.usuarios.find(u => u.id === id);
        const action = usuario?.activo ? 'desactivar' : 'activar';
        
        const confirmed = await UI.confirm(`¿Deseas ${action} a ${usuario.nombre}?`, 'Confirmar');
        if (!confirmed) return;
        
        try {
            UI.showLoading('Procesando...');
            await Api.usuarios.toggleActivo(id);
            UI.hideLoading();
            UI.toast(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'}`, 'success');
            await this.loadUsuarios();
        } catch (error) {
            UI.hideLoading();
            UI.toast('Error', 'error');
        }
    },
    
    // Eliminar
    async eliminar(id) {
        const usuario = this.usuarios.find(u => u.id === id);
        
        const confirmed = await UI.confirm(
            `¿Eliminar a ${usuario.nombre} ${usuario.apellido}? Esta acción no se puede deshacer.`,
            'Eliminar Usuario'
        );
        if (!confirmed) return;
        
        try {
            UI.showLoading('Eliminando...');
            await Api.usuarios.eliminar(id);
            UI.hideLoading();
            UI.toast('Usuario eliminado', 'success');
            await this.loadUsuarios();
        } catch (error) {
            UI.hideLoading();
            UI.toast('Error al eliminar', 'error');
        }
    }
};

window.AdminUsuarios = AdminUsuarios;
