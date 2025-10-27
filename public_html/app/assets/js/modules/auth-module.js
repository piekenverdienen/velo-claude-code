// auth-module.js - Complete Authentication Module met page refresh na login
const AuthModule = {
    currentUser: null,
    supabase: null,
    isOnline: true,
    autoSaveInterval: null,
    eventListeners: [],

    async init() {
        console.log('🔐 Initializing Auth Module...');

        this.supabase = SupabaseConfig.getClient();
        if (!this.supabase) {
            console.log('📱 Running in offline mode');
            this.createOfflineAuthUI();
            return;
        }

        this.isOnline = true;
        await this.checkExistingSession();
        this.setupAuthListener();
        this.createAuthUI();
        this.startAutoSave();
        this.setupNetworkListener();

        console.log('✅ Auth Module ready');
    },

    showWelcomeBanner() {
        if (document.getElementById('welcome-banner') || this.currentUser) return;
        if (sessionStorage.getItem('bannerDismissed') || sessionStorage.getItem('continueWithoutAccount')) return;

        const banner = document.createElement('div');
        banner.id = 'welcome-banner';
        banner.className = 'welcome-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-text">
                    <span class="banner-icon">💜</span>
                    <span>Save your progress across all devices - Create a free account</span>
                </div>
                <div class="banner-actions">
                    <button class="banner-btn-primary" onclick="AuthModule.showAuthModal()">
                        Sign Up Free
                    </button>
                    <button class="banner-btn-secondary" onclick="AuthModule.dismissBanner()">
                        Maybe Later
                    </button>
                </div>
            </div>
            <div class="banner-warning">
                ⚠️ Without an account, your data is only saved locally and may be lost
            </div>
        `;

        const mainApp = document.getElementById('mainApp');
        if (mainApp && !mainApp.classList.contains('hidden')) {
            const header = mainApp.querySelector('.header');
            if (header) {
                header.insertAdjacentElement('afterend', banner);
            }
        }
    },

    dismissBanner() {
        const banner = document.getElementById('welcome-banner');
        if (banner) {
            banner.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => banner.remove(), 300);
            sessionStorage.setItem('bannerDismissed', 'true');
        }
    },

    continueWithoutAccount() {
        this.hideAuthModal();
        this.dismissBanner();
        this.showNotification('⚠️ Using local storage only - create account to sync', 'warning');
        sessionStorage.setItem('continueWithoutAccount', 'true');
    },

    createOfflineAuthUI() {
        const container = document.createElement('div');
        container.id = 'auth-container';
        container.className = 'auth-container offline';
        container.innerHTML = `
            <div class="offline-indicator">
                <span>📱 Offline Mode</span>
            </div>
        `;

        document.body.prepend(container);
        this.addAuthCSS();
    },

    async checkExistingSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (error) {
                console.warn('Session check warning:', error);
                return;
            }

            if (session?.user) {
                this.currentUser = session.user;
                console.log('👤 Found existing session for:', session.user.email);

                const intakeSection = document.getElementById('intakeSection');
                const mainApp = document.getElementById('mainApp');
                
                if (intakeSection && mainApp) {
                    console.log('🔄 Existing session found, loading main app...');
                    intakeSection.classList.add('hidden');
                    mainApp.classList.remove('hidden');
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', async () => {
                        await this.loadUserData();
                    });
                } else {
                    await this.loadUserData();
                }
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    },

    setupAuthListener() {
        const { data: authListener } = this.supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 Auth event:', event);

                if (event === 'SIGNED_IN' && session?.user) {
                    this.currentUser = session.user;
                    await this.onSignIn(session.user);
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.onSignOut();
                }

                this.updateAuthUI();
            }
        );

        this.authListener = authListener;
    },

    setupNetworkListener() {
        const handleOnline = () => {
            this.isOnline = true;
            this.syncWhenOnline();
        };

        const handleOffline = () => {
            this.isOnline = false;
            this.showOfflineWarning();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        this.eventListeners.push(
            { element: window, event: 'online', handler: handleOnline },
            { element: window, event: 'offline', handler: handleOffline }
        );
    },

    createAuthUI() {
        if (document.getElementById('auth-container')) return;

        const authHTML = `
            <div id="auth-container" class="auth-container">
                <div id="auth-signed-out" class="auth-signed-out">
                    <button id="show-auth-modal" class="auth-login-btn">
                        <span class="auth-icon">👤</span>
                        Login / Sign Up
                    </button>
                </div>
                
                <div id="auth-signed-in" class="auth-signed-in hidden">
                    <div class="user-info">
                        <div class="user-details">
                            <span class="user-email" id="user-email"></span>
                            <div class="sync-status" id="sync-status">
                                <span class="sync-indicator">☁️</span>
                                <span class="sync-text">Synced</span>
                            </div>
                        </div>
                        <button id="user-menu-btn" class="user-menu-btn">⚙️</button>
                    </div>
                    
                    <div id="user-menu" class="user-menu hidden">
                        <button id="sync-now-btn" class="menu-item">🔄 Sync Now</button>
                        <button id="sign-out-btn" class="menu-item">🚪 Sign Out</button>
                    </div>
                </div>
            </div>
            
            <div id="auth-modal" class="auth-modal hidden">
                <div class="auth-modal-content">
                    <div class="auth-modal-header">
                        <h3>Welcome to Polarized Training</h3>
                        <button id="close-auth-modal" class="close-modal">&times;</button>
                    </div>
                    
                    <div class="auth-benefits">
                        <div class="benefit-item">
                            <span>🚴</span>
                            <span>Join 1000+ cyclists</span>
                        </div>
                        <div class="benefit-item">
                            <span>☁️</span>
                            <span>Sync across all devices</span>
                        </div>
                        <div class="benefit-item">
                            <span>✅</span>
                            <span>100% free, no credit card</span>
                        </div>
                    </div>
                    
                    <div id="auth-status" class="auth-status hidden"></div>
                    
                    <div id="auth-tabs" class="auth-tabs">
                        <button id="signin-tab" class="auth-tab active" data-tab="signin">Sign In</button>
                        <button id="signup-tab" class="auth-tab" data-tab="signup">Sign Up</button>
                    </div>
                    
                    <form id="auth-form" class="auth-form">
                        <div class="form-group">
                            <label for="auth-email">Email Address</label>
                            <input type="email" id="auth-email" placeholder="your@email.com" required>
                            <small class="form-help">We'll never share your email</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="auth-password">Password</label>
                            <input type="password" id="auth-password" placeholder="Minimum 6 characters" required minlength="6">
                            <small class="form-help">Keep it secure</small>
                        </div>
                        
                        <button type="submit" id="auth-submit" class="auth-submit-btn">
                            <span id="auth-submit-text">Sign In</span>
                            <span id="auth-loading" class="auth-loading hidden">⏳</span>
                        </button>
                    </form>
                    
                    <div class="auth-divider">
                        <span>or</span>
                    </div>
                    
                    <button class="continue-without-account" onclick="AuthModule.continueWithoutAccount()">
                        Continue Without Account
                        <small>Data saved locally only</small>
                    </button>
                    
                    <div class="auth-footer">
                        <button id="forgot-password-btn" class="auth-link">Forgot password?</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', authHTML);
        this.bindAuthEvents();
        this.addAuthCSS();
        this.updateAuthUI();
    },

    bindAuthEvents() {
        const bindEvent = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
                this.eventListeners.push({ element, event, handler });
            }
        };

        bindEvent('show-auth-modal', 'click', () => this.showAuthModal());
        bindEvent('close-auth-modal', 'click', () => this.hideAuthModal());
        bindEvent('auth-modal', 'click', (e) => {
            if (e.target.id === 'auth-modal') this.hideAuthModal();
        });

        bindEvent('signin-tab', 'click', () => this.switchAuthTab('signin'));
        bindEvent('signup-tab', 'click', () => this.switchAuthTab('signup'));

        bindEvent('auth-form', 'submit', (e) => this.handleAuthSubmit(e));

        bindEvent('user-menu-btn', 'click', () => this.toggleUserMenu());
        bindEvent('sync-now-btn', 'click', () => this.syncNow());
        bindEvent('sign-out-btn', 'click', () => this.signOut());
        bindEvent('forgot-password-btn', 'click', () => this.handleForgotPassword());

        document.addEventListener('click', (e) => {
            const menu = document.getElementById('user-menu');
            const btn = document.getElementById('user-menu-btn');
            if (menu && !menu.contains(e.target) && e.target !== btn) {
                menu.classList.add('hidden');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAuthModal();
                document.getElementById('user-menu')?.classList.add('hidden');
            }
        });
    },

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');

        const submitText = document.getElementById('auth-submit-text');
        const isSignUp = tab === 'signup';
        submitText.textContent = isSignUp ? 'Create Account' : 'Sign In';

        this.clearAuthStatus();
    },

    async handleAuthSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const isSignUp = document.getElementById('signup-tab').classList.contains('active');

        if (!email || !password) {
            this.showAuthStatus('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAuthStatus('Password must be at least 6 characters', 'error');
            return;
        }

        this.setAuthLoading(true);

        try {
            if (isSignUp) {
                await this.signUp(email, password);
            } else {
                await this.signIn(email, password);
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showAuthStatus(error.message, 'error');
        } finally {
            this.setAuthLoading(false);
        }
    },

    async signUp(email, password) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    app_name: 'Polarized Training'
                }
            }
        });

        if (error) throw error;

        this.showAuthStatus(
            'Account created! Check your email to verify your account.',
            'success'
        );

        setTimeout(() => {
            this.switchAuthTab('signin');
            this.clearAuthStatus();
        }, 3000);
    },

    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        this.hideAuthModal();
        this.showNotification('Welcome back! Loading your data...');
        
        // Page refresh na 1 seconde
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    },

    async signOut() {
        try {
            this.setSyncStatus('saving');
            await this.saveUserData();

            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

        } catch (error) {
            console.error('Sign out error:', error);
            this.showNotification('Error signing out', 'error');
        }
    },

    async handleForgotPassword() {
        const email = document.getElementById('auth-email').value.trim();

        if (!email) {
            this.showAuthStatus('Enter your email address first', 'error');
            return;
        }

        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });

            if (error) throw error;

            this.showAuthStatus('Password reset email sent!', 'success');
        } catch (error) {
            this.showAuthStatus(error.message, 'error');
        }
    },

    toggleUserMenu() {
        const menu = document.getElementById('user-menu');
        menu.classList.toggle('hidden');
    },

    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.remove('hidden');
        document.getElementById('auth-email').focus();
        document.body.style.overflow = 'hidden';
    },

    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.clearAuthForm();
    },

    clearAuthForm() {
        document.getElementById('auth-email').value = '';
        document.getElementById('auth-password').value = '';
        this.clearAuthStatus();
    },

    showAuthStatus(message, type = 'info') {
        const status = document.getElementById('auth-status');
        status.textContent = message;
        status.className = `auth-status ${type}`;
        status.classList.remove('hidden');

        if (type === 'success') {
            setTimeout(() => this.clearAuthStatus(), 5000);
        }
    },

    clearAuthStatus() {
        const status = document.getElementById('auth-status');
        status.classList.add('hidden');
    },

    setAuthLoading(loading) {
        const submitBtn = document.getElementById('auth-submit');
        const submitText = document.getElementById('auth-submit-text');
        const loadingIcon = document.getElementById('auth-loading');

        submitBtn.disabled = loading;
        submitText.style.display = loading ? 'none' : 'inline';
        loadingIcon.style.display = loading ? 'inline' : 'none';
    },

    updateAuthUI() {
        const signedOut = document.getElementById('auth-signed-out');
        const signedIn = document.getElementById('auth-signed-in');
        const userEmail = document.getElementById('user-email');

        if (!signedOut || !signedIn) return;

        if (this.currentUser) {
            signedOut.classList.add('hidden');
            signedIn.classList.remove('hidden');
            if (userEmail) userEmail.textContent = this.currentUser.email;
            this.setSyncStatus('synced');
        } else {
            signedOut.classList.remove('hidden');
            signedIn.classList.add('hidden');
        }
    },

    setSyncStatus(status) {
        const indicator = document.getElementById('sync-status');
        if (!indicator) return;

        const statusConfig = {
            synced: { icon: '☁️', text: 'Synced', class: 'synced' },
            saving: { icon: '⏳', text: 'Saving...', class: 'saving' },
            error: { icon: '⚠️', text: 'Sync Error', class: 'error' },
            offline: { icon: '📱', text: 'Offline', class: 'offline' }
        };

        const config = statusConfig[status] || statusConfig.synced;

        indicator.innerHTML = `
            <span class="sync-indicator">${config.icon}</span>
            <span class="sync-text">${config.text}</span>
        `;
        indicator.className = `sync-status ${config.class}`;
    },

    async onSignIn(user) {
        console.log('👤 User signed in:', user.email);
        
        // Check of we op intake pagina zijn
        const intakeSection = document.getElementById('intakeSection');
        if (intakeSection && !intakeSection.classList.contains('hidden')) {
            console.log('🔄 On intake page, reloading to load user data...');
            this.showNotification('Welcome back! Loading your data...');
            setTimeout(() => {
                window.location.reload();
            }, 800);
            return;
        }
        
        // Als we al op main app zijn, gewoon data laden
        this.updateAuthUI();
        this.dismissBanner();
        
        try {
            await this.loadUserData();
            this.showNotification(`Welcome back, ${user.email.split('@')[0]}!`);
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('Signed in, but couldn\'t load cloud data', 'warning');
        }
    },

    onSignOut() {
        console.log('👋 User signed out');
        this.updateAuthUI();

        document.getElementById('user-menu')?.classList.add('hidden');

        this.showNotification('Signed out successfully');

        setTimeout(() => {
            sessionStorage.removeItem('bannerDismissed');
            sessionStorage.removeItem('continueWithoutAccount');
            this.showWelcomeBanner();
        }, 2000);

        setTimeout(() => {
            if (confirm('Reload page to reset to default state?')) {
                location.reload();
            }
        }, 3000);
    },

    async saveUserData() {
        console.log('🔍 saveUserData called - checking requirements...');

        if (!this.currentUser || !this.supabase || !window.StorageModule) {
            console.log('❌ Missing requirements for save');
            return false;
        }

        try {
            this.setSyncStatus('saving');

            const appState = window.StorageModule.loadState();
            const now = new Date().toISOString();

            console.log('💾 Saving to Supabase...');

            const { data: existing } = await this.supabase
                .from('user_training_data')
                .select('id')
                .eq('user_id', this.currentUser.id)
                .maybeSingle();

            let result;

            if (existing) {
                console.log('📝 Updating existing record...');
                result = await this.supabase
                    .from('user_training_data')
                    .update({
                        app_state: {
                            ...appState,
                            lastSynced: now
                        },
                        updated_at: now
                    })
                    .eq('user_id', this.currentUser.id)
                    .select()
                    .single();
            } else {
                console.log('➕ Creating new record...');
                result = await this.supabase
                    .from('user_training_data')
                    .insert({
                        user_id: this.currentUser.id,
                        app_state: {
                            ...appState,
                            lastSynced: now
                        },
                        updated_at: now
                    })
                    .select()
                    .single();
            }

            if (result.error) {
                throw result.error;
            }

            console.log('✅ Data saved to cloud successfully');
            this.setSyncStatus('synced');
            return true;

        } catch (error) {
            console.error('❌ Save error:', error);
            this.setSyncStatus('error');
            return false;
        }
    },

    async loadUserData() {
        if (!this.currentUser || !this.supabase || !window.StorageModule) {
            return false;
        }

        try {
            const { data, error } = await this.supabase
                .from('user_training_data')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data?.app_state) {
                const localState = window.StorageModule.loadState();
                const cloudLastSynced = new Date(data.app_state.lastSynced || 0);
                const localLastSynced = new Date(localState.lastSynced || 0);

                if (cloudLastSynced > localLastSynced || !localState.intakeCompleted) {
                    window.StorageModule.saveState(data.app_state);
                    console.log('📥 Loaded cloud data (newer than local)');

                    if (window.App?.refreshUI) {
                        window.App.refreshUI();
                    }
                } else {
                    console.log('📱 Local data is current');
                }

                return true;
            } else {
                console.log('🆕 First time sync - saving initial state');
                await this.saveUserData();
                return true;
            }

        } catch (error) {
            console.error('Load error:', error);
            this.setSyncStatus('error');
            return false;
        }
    },

    async syncNow() {
        if (!this.isOnline) {
            this.showNotification('You\'re offline - sync when connected', 'warning');
            return;
        }

        const success = await this.saveUserData();
        if (success) {
            this.showNotification('Data synced successfully!');
        } else {
            this.showNotification('Sync failed - try again', 'error');
        }

        document.getElementById('user-menu')?.classList.add('hidden');
    },

    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            if (this.currentUser && this.isOnline) {
                await this.saveUserData();
            }
        }, 30000);

        const saveBeforeUnload = async () => {
            if (this.currentUser) {
                await this.saveUserData();
            }
        };

        window.addEventListener('beforeunload', saveBeforeUnload);
        this.eventListeners.push({
            element: window,
            event: 'beforeunload',
            handler: saveBeforeUnload
        });
    },

    showNotification(message, type = 'info') {
        if (window.UIModule?.showNotification) {
            window.UIModule.showNotification(message);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    syncWhenOnline() {
        if (this.currentUser) {
            setTimeout(() => {
                this.syncNow();
            }, 1000);
        }
    },

    showOfflineWarning() {
        this.setSyncStatus('offline');
        this.showNotification('You\'re offline - changes saved locally', 'warning');
    },

    addAuthCSS() {
        if (document.getElementById('auth-styles')) return;

        const css = `
        .welcome-banner {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1));
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            animation: slideIn 0.5s ease;
        }

        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }

        .banner-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }

        .banner-text {
            display: flex;
            align-items: center;
            gap: 12px;
            color: white;
            font-size: 1.05rem;
            font-weight: 500;
        }

        .banner-icon { font-size: 1.5rem; }

        .banner-actions { display: flex; gap: 12px; }

        .banner-btn-primary {
            padding: 10px 20px;
            background: linear-gradient(135deg, #a855f7, #6366f1);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .banner-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3);
        }

        .banner-btn-secondary {
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .banner-btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }

        .banner-warning {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(139, 92, 246, 0.2);
            color: #fbbf24;
            font-size: 0.9rem;
            text-align: center;
        }

        .auth-benefits {
            display: grid;
            gap: 12px;
            margin: 20px 0;
            padding: 16px;
            background: #f9fafb;
            border-radius: 8px;
        }

        .benefit-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.95rem;
            color: #374151;
        }

        .benefit-item span:first-child { font-size: 1.2rem; }

        .form-help {
            display: block;
            margin-top: 4px;
            font-size: 0.8rem;
            color: #6b7280;
        }

        .auth-divider {
            text-align: center;
            margin: 20px 0;
            position: relative;
        }

        .auth-divider span {
            background: white;
            padding: 0 12px;
            color: #9ca3af;
            position: relative;
            z-index: 1;
        }

        .auth-divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #e5e7eb;
            z-index: 0;
        }

        .continue-without-account {
            width: 100%;
            padding: 12px;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }

        .continue-without-account:hover {
            background: #f9fafb;
            border-color: #d1d5db;
        }

        .continue-without-account small {
            display: block;
            margin-top: 4px;
            font-size: 0.8rem;
            color: #9ca3af;
        }

        .auth-form .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #374151;
            font-weight: 500;
            font-size: 0.875rem;
        }

        .auth-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .auth-container.offline {
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.875rem;
        }
        
        .auth-login-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
        }
        
        .auth-login-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
        }
        
        .user-info {
            position: relative;
            background: white;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
            min-width: 200px;
        }
        
        .user-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .user-email {
            font-size: 0.875rem;
            font-weight: 500;
            color: #333;
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .sync-status {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75rem;
            color: #666;
        }
        
        .sync-status.synced { color: #22c55e; }
        .sync-status.saving { color: #f59e0b; }
        .sync-status.error { color: #ef4444; }
        .sync-status.offline { color: #6b7280; }
        
        .user-menu-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            color: #666;
            font-size: 14px;
        }
        
        .user-menu-btn:hover { background: #f3f4f6; }
        
        .user-menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: 1px solid #e0e0e0;
            min-width: 140px;
            z-index: 1001;
        }
        
        .menu-item {
            display: block;
            width: 100%;
            padding: 10px 12px;
            background: none;
            border: none;
            text-align: left;
            cursor: pointer;
            font-size: 0.875rem;
            color: #374151;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .menu-item:last-child { border-bottom: none; }
        .menu-item:hover { background: #f9fafb; }
        
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .auth-modal.hidden { display: none; }
        
        .auth-modal-content {
            background: white;
            border-radius: 16px;
            padding: 32px;
            width: 400px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .auth-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .auth-modal-header h3 {
            margin: 0;
            color: #1f2937;
            font-size: 1.25rem;
            font-weight: 600;
        }
        
        .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #9ca3af;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }
        
        .close-modal:hover {
            background: #f3f4f6;
            color: #6b7280;
        }
        
        .auth-tabs {
            display: flex;
            margin-bottom: 24px;
            background: #f9fafb;
            border-radius: 8px;
            padding: 4px;
        }
        
        .auth-tab {
            flex: 1;
            padding: 10px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            color: #6b7280;
            border-radius: 6px;
            transition: all 0.2s;
        }
        
        .auth-tab.active {
            background: white;
            color: #374151;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
            background: white;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .auth-submit-btn {
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 8px;
        }
        
        .auth-submit-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .auth-submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        .auth-loading {
            display: inline-block;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .auth-footer {
            text-align: center;
            margin-top: 20px;
        }
        
        .auth-link {
            background: none;
            border: none;
            color: #667eea;
            cursor: pointer;
            text-decoration: underline;
            font-size: 0.875rem;
        }
        
        .auth-link:hover { color: #5a67d8; }
        
        .auth-status {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 0.875rem;
        }
        
        .auth-status.error {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        
        .auth-status.success {
            background: #dcfce7;
            color: #16a34a;
            border: 1px solid #bbf7d0;
        }
        
        .auth-status.info {
            background: #dbeafe;
            color: #2563eb;
            border: 1px solid #bfdbfe;
        }
        
        .auth-notification {
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideInNotif 0.3s ease-out;
        }
        
        .auth-notification.info { background: #3b82f6; }
        .auth-notification.error { background: #ef4444; }
        .auth-notification.warning { background: #f59e0b; }
        
        @keyframes slideInNotif {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .auth-container {
                top: 10px;
                right: 10px;
                left: 10px;
                position: relative;
                margin-bottom: 10px;
            }
            
            .auth-modal-content {
                padding: 24px;
                margin: 20px;
            }
            
            .user-info { min-width: auto; }
            
            .banner-content {
                flex-direction: column;
                text-align: center;
            }
            
            .banner-actions {
                width: 100%;
                flex-direction: column;
            }
            
            .banner-btn-primary,
            .banner-btn-secondary {
                width: 100%;
            }
        }
        
        .hidden { display: none !important; }
        `;

        const style = document.createElement('style');
        style.id = 'auth-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }
};

window.AuthModule = AuthModule;