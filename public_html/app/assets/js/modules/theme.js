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

        // Also update button whenever Settings tab is opened
        // Use MutationObserver to detect when Settings tab becomes visible
        observeSettingsTab();
    }

    /**
     * Set up theme toggle button in settings
     * Called when DOM is ready or Settings tab is opened
     */
    function setupToggleButton() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            updateToggleButton(getCurrentTheme());
        }
    }

    /**
     * Observe when Settings tab becomes visible
     * Updates theme toggle button when user opens Settings
     */
    function observeSettingsTab() {
        // Wait for DOM to be ready
        const checkAndObserve = () => {
            const settingsTab = document.getElementById('settingsTab');
            if (!settingsTab) {
                // Retry after a short delay
                setTimeout(checkAndObserve, 100);
                return;
            }

            // Create observer to watch for visibility changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isVisible = !settingsTab.classList.contains('hidden');
                        if (isVisible) {
                            setupToggleButton();
                        }
                    }
                });
            });

            // Start observing
            observer.observe(settingsTab, {
                attributes: true,
                attributeFilter: ['class']
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndObserve);
        } else {
            checkAndObserve();
        }
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
