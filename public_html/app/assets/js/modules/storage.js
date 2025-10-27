// Storage Module - Beheert alle opslag (localStorage + Supabase)
const StorageModule = (function () {
    'use strict';

    const STORAGE_KEY = 'polarizedAppState';
    const USER_PROFILE_KEY = 'polarizedUserProfile';
    let supabaseClient = null;
    let currentUser = null;

    // Functie om default state te krijgen (lazy loading)
    function getDefaultState() {
        const hasConfig = typeof APP_CONFIG !== 'undefined';

        return {
            goal: null,
            timeCommitment: null,
            userName: hasConfig ? APP_CONFIG.defaults.userName : 'Athlete',
            ftp: hasConfig ? APP_CONFIG.defaults.ftp : 200,
            weight: 70,
            currentWeek: 1,
            schedule: {},
            history: {},
            intakeCompleted: false,
            preferredDays: hasConfig ? APP_CONFIG.defaults.preferredDays : ['Tue', 'Thu', 'Sat'],
            weekAdjustment: {},
            originalSchedule: {},
            rpeHistory: [],
            weeklyAdaptations: {},
            wkg: null
        };
    }

    // Initialize Supabase connection
    function initSupabase() {
        if (typeof SupabaseConfig !== 'undefined' && SupabaseConfig.client) {
            supabaseClient = SupabaseConfig.client;

            // Listen for auth state changes
            supabaseClient.auth.onAuthStateChange((event, session) => {
                currentUser = session?.user || null;
                console.log('Auth state changed:', event, currentUser?.email);

                // When user logs in, sync data from Supabase
                if (event === 'SIGNED_IN' && currentUser) {
                    syncFromSupabase();
                }
            });
        }
    }

    // Sync data from Supabase to localStorage
    async function syncFromSupabase() {
        if (!supabaseClient || !currentUser) return;

        try {
            console.log('Syncing from Supabase for user:', currentUser.email);

            const { data, error } = await supabaseClient
                .from('user_training_data')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching from Supabase:', error);
                return;
            }

            if (data && data.app_state) {
                const localState = loadStateFromLocalStorage();
                const mergedState = Object.assign({}, localState, data.app_state);

                if (data.app_state.userName) mergedState.userName = data.app_state.userName;
                if (data.app_state.weight) mergedState.weight = data.app_state.weight;
                if (data.app_state.ftp) mergedState.ftp = data.app_state.ftp;

                localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedState));

                const profile = {
                    userName: mergedState.userName,
                    weight: mergedState.weight,
                    ftp: mergedState.ftp
                };
                localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

                console.log('✅ Data synced from Supabase including profile');

                if (window.App && window.App.refreshUI) {
                    window.App.refreshUI();
                }
            }
        } catch (error) {
            console.error('Sync from Supabase failed:', error);
        }
    }

    // Save data to Supabase - SIMPLIFIED VERSION
    async function saveToSupabase(state) {
        if (!supabaseClient || !currentUser) {
            console.log('Not saving to Supabase - no user logged in');
            return;
        }

        try {
            const now = new Date().toISOString();

            // SIMPLIFIED: Only app_state and updated_at
            const userData = {
                user_id: currentUser.id,
                app_state: {
                    ...state,
                    lastSynced: now
                },
                updated_at: now
            };

            console.log('💾 Saving to Supabase...');

            const { error } = await supabaseClient
                .from('user_training_data')
                .upsert(userData, {
                    onConflict: 'user_id'
                });

            if (error) {
                console.error('❌ Error saving to Supabase:', error);
            } else {
                console.log('✅ Data saved to Supabase');
            }
        } catch (error) {
            console.error('Save to Supabase failed:', error);
        }
    }

    // Load from localStorage
    function loadStateFromLocalStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const profile = localStorage.getItem(USER_PROFILE_KEY);

            if (saved) {
                const state = JSON.parse(saved);

                if (profile) {
                    const profileData = JSON.parse(profile);
                    if (profileData.userName) state.userName = profileData.userName;
                    if (profileData.weight) state.weight = profileData.weight;
                    if (profileData.ftp) state.ftp = profileData.ftp;
                }

                return Object.assign({}, getDefaultState(), state);
            }
        } catch (e) {
            console.error('Failed to load state from localStorage:', e);
        }
        return getDefaultState();
    }

    // Initialize on load
    setTimeout(() => {
        initSupabase();
    }, 100);

    return {
        loadState: function () {
            const localState = loadStateFromLocalStorage();

            if (currentUser) {
                syncFromSupabase();
            }

            return localState;
        },

        saveState: function (state) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

                const profile = {
                    userName: state.userName || 'Athlete',
                    weight: state.weight || 70,
                    ftp: state.ftp || 200,
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

                console.log('✅ Saved to localStorage with profile:', profile);

                if (currentUser) {
                    saveToSupabase(state);
                }

                return true;
            } catch (e) {
                console.error('Failed to save state:', e);
                return false;
            }
        },

        resetState: function () {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(USER_PROFILE_KEY);

            if (supabaseClient && currentUser) {
                supabaseClient
                    .from('user_training_data')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .then(({ error }) => {
                        if (error) {
                            console.error('Error deleting from Supabase:', error);
                        } else {
                            console.log('✅ Data deleted from Supabase');
                        }
                    });
            }

            return getDefaultState();
        },

        updateState: function (currentState, updates) {
            return Object.assign({}, currentState, updates);
        },

        syncWithSupabase: async function () {
            if (!currentUser) {
                console.log('No user logged in - cannot sync');
                return false;
            }

            const state = loadStateFromLocalStorage();
            await saveToSupabase(state);
            return true;
        },

        getCurrentUser: function () {
            return currentUser;
        },

        isSupabaseConnected: function () {
            return supabaseClient !== null && currentUser !== null;
        },

        getUserProfile: function () {
            const profile = localStorage.getItem(USER_PROFILE_KEY);
            if (profile) {
                return JSON.parse(profile);
            }
            return {
                userName: 'Athlete',
                weight: 70,
                ftp: 200
            };
        },

        updateUserProfile: function (updates) {
            const currentState = this.loadState();
            if (updates.userName !== undefined) currentState.userName = updates.userName;
            if (updates.weight !== undefined) currentState.weight = updates.weight;
            if (updates.ftp !== undefined) currentState.ftp = updates.ftp;

            return this.saveState(currentState);
        }
    };
})();

window.StorageModule = StorageModule;
console.log('✅ StorageModule with profile support loaded successfully');