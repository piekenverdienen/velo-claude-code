// Theme Module - Handles dark/light mode switching
const ThemeModule = (function () {
    'use strict';

    const THEME_KEY = 'polarized_theme';
    const THEMES = {
        DARK: 'dark',
        LIGHT: 'light'
    };

    /**
     * Get current theme from localStorage or default to dark
     * @returns {string} Current theme ('dark' or 'light')
     */
    function getCurrentTheme() {
        return localStorage.getItem(THEME_KEY) || THEMES.DARK;
    }

    /**
     * Set theme and save preference
     * @param {string} theme - Theme to set ('dark' or 'light')
     */
    function setTheme(theme) {
        // Validate theme
        if (theme !== THEMES.DARK && theme !== THEMES.LIGHT) {
            console.warn('Invalid theme:', theme);
            return;
        }

        // Apply to document
        if (theme === THEMES.LIGHT) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Save preference
        localStorage.setItem(THEME_KEY, theme);

        // Update toggle button if it exists
        updateToggleButton(theme);

        console.log('🎨 Theme set to:', theme);
    }

    /**
     * Toggle between dark and light theme
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
        setTheme(newTheme);
    }

    /**
     * Update toggle button appearance
     * @param {string} theme - Current theme
     */
    function updateToggleButton(theme) {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('.theme-icon');
        const label = toggleBtn.querySelector('.theme-label');

        if (theme === THEMES.LIGHT) {
            if (icon) icon.textContent = '🌙';
            if (label) label.textContent = 'Dark Mode';
            toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
        } else {
            if (icon) icon.textContent = '☀️';
            if (label) label.textContent = 'Light Mode';
            toggleBtn.setAttribute('aria-label', 'Switch to light mode');
        }
    }

    /**
     * Initialize theme system
     * - Loads saved theme preference
     * - Sets up toggle button
     * - Applies theme immediately
     */
    function init() {
        console.log('🎨 Initializing theme system...');

        // Apply saved theme immediately (before page renders)
        const savedTheme = getCurrentTheme();
        setTheme(savedTheme);

        // Set up toggle button when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupToggleButton);
        } else {
            setupToggleButton();
        }
    }

    /**
     * Set up theme toggle button in settings
     */
    function setupToggleButton() {
        // Create toggle button HTML if settings container exists
        const settingsContent = document.getElementById('settingsContent');
        if (settingsContent) {
            insertToggleButton();
        }

        // Add click handler
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
            updateToggleButton(getCurrentTheme());
        }
    }

    /**
     * Insert theme toggle button into settings
     */
    function insertToggleButton() {
        const settingsContent = document.getElementById('settingsContent');
        if (!settingsContent) return;

        // Check if button already exists
        if (document.getElementById('themeToggle')) return;

        // Find the settings section
        const settingsSection = settingsContent.querySelector('.settings-section');
        if (!settingsSection) return;

        // Create theme toggle HTML
        const themeToggleHTML = `
            <div class="setting-item" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
                <div class="setting-header">
                    <h3>🎨 Appearance</h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 4px;">
                        Customize the look and feel
                    </p>
                </div>
                <button id="themeToggle"
                        class="btn btn-secondary"
                        style="width: 100%; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;"
                        aria-label="Toggle theme">
                    <span class="theme-icon" style="font-size: 1.25rem;">☀️</span>
                    <span class="theme-label">Light Mode</span>
                </button>
            </div>
        `;

        // Insert at the end of settings section
        settingsSection.insertAdjacentHTML('beforeend', themeToggleHTML);
    }

    // Public API
    return {
        init: init,
        getCurrentTheme: getCurrentTheme,
        setTheme: setTheme,
        toggleTheme: toggleTheme,
        THEMES: THEMES
    };
})();

// Initialize theme system immediately (before page load)
ThemeModule.init();

// Make globally available
if (typeof window !== 'undefined') {
    window.ThemeModule = ThemeModule;
}

console.log('✅ Theme module loaded successfully');
