/**
 * Theme Manager Module
 * Handles dark mode / light mode switching and persistence
 */

import { eventBus } from '../core/event-bus.js';

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themeToggleButton = null;
    this.storageKey = 'memory-graph-theme';
    
    console.log('🎨 Theme Manager initialized');
  }

  /**
   * Initialize theme manager
   */
  initialize() {
    // Get theme toggle button
    this.themeToggleButton = document.getElementById('theme-toggle');
    
    if (!this.themeToggleButton) {
      console.warn('⚠️ Theme toggle button not found');
      return;
    }

    // Load saved theme preference
    this.loadTheme();

    // Setup event listener
    this.themeToggleButton.addEventListener('click', () => {
      this.toggleTheme();
    });

    console.log('✅ Theme Manager initialized with theme:', this.currentTheme);
  }

  /**
   * Load theme from localStorage or system preference
   */
  loadTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem(this.storageKey);
    
    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.currentTheme = 'dark';
      }
    }

    this.applyTheme(this.currentTheme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set a specific theme
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('⚠️ Invalid theme:', theme);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
    
    // Emit event for other modules
    eventBus.emit('theme-changed', { theme });
    
    console.log('🎨 Theme changed to:', theme);
  }

  /**
   * Apply theme to the document
   * @param {string} theme - 'light' or 'dark'
   */
  applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      if (this.themeToggleButton) {
        this.themeToggleButton.textContent = '☀️';
        this.themeToggleButton.title = 'Switch to light mode';
      }
    } else {
      html.removeAttribute('data-theme');
      if (this.themeToggleButton) {
        this.themeToggleButton.textContent = '🌙';
        this.themeToggleButton.title = 'Switch to dark mode';
      }
    }
  }

  /**
   * Save theme preference to localStorage
   * @param {string} theme - 'light' or 'dark'
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn('⚠️ Failed to save theme preference:', error);
    }
  }

  /**
   * Get current theme
   * @returns {string} Current theme ('light' or 'dark')
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active
   * @returns {boolean} True if dark mode is active
   */
  isDarkMode() {
    return this.currentTheme === 'dark';
  }

  /**
   * Get theme stats for debugging
   * @returns {object} Theme manager stats
   */
  getStats() {
    return {
      currentTheme: this.currentTheme,
      isDarkMode: this.isDarkMode(),
      hasToggleButton: !!this.themeToggleButton,
      storageAvailable: this.isStorageAvailable()
    };
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  isStorageAvailable() {
    try {
      const test = '__theme_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Create singleton instance
export const themeManager = new ThemeManager();
