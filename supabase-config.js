// supabase-config.js
const SupabaseConfig = {
    url: 'https://onyzbaglqpjjxyrwhdms.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueXpiYWdscXBqanh5cndoZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ5MTYsImV4cCI6MjA3Mzk1MDkxNn0.2nqWTMHOzZrQwsFvjRNtmH2gMTrQjsmKcvIElf0SNMY',
    client: null,
    initialized: false,

    async init() {
        // Check if Supabase is loaded
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client not loaded. Include script first.');
            return false;
        }

        // Check if URL is configured (niet meer de placeholder check)
        if (!this.url || !this.anonKey) {
            console.warn('⚠️ Supabase credentials not configured - using offline mode');
            return false;
        }

        try {
            this.client = window.supabase.createClient(this.url, this.anonKey);
            this.initialized = true;
            console.log('✅ Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Supabase init failed:', error);
            return false;
        }
    },

    getClient() {
        return this.initialized ? this.client : null;
    }
};