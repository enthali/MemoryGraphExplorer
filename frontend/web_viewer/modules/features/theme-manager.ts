/**
 * Theme Manager Module
 * Handles dark mode / light mode switching and persistence
 */

import { eventBus } from '../core/event-bus.js';

class ThemeManager {
  private currentTheme: 'light' | 'dark';
  private themeToggleButton: HTMLElement | null;
  private readonly storageKey: string;
  private readonly prefersDarkMedia: MediaQueryList | null;

  constructor() {
    this.currentTheme = 'light';
    this.themeToggleButton = null;
    this.storageKey = 'memory-graph-theme';
    this.prefersDarkMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    
    console.log('🎨 Theme Manager initialized');
  }

  /**
   * Initialize theme manager
   */
  initialize(): void {
    // Get theme toggle button
    this.themeToggleButton = document.getElementById('theme-toggle');
    
    if (!this.themeToggleButton) {
      console.warn('⚠️ Theme toggle button not found');
    }

    // Load saved theme preference (works even without button)
    this.loadTheme();

    // Setup event listener if button exists
    if (this.themeToggleButton) {
      this.themeToggleButton.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    console.log('✅ Theme Manager initialized with theme:', this.currentTheme);
  }

  /**
   * Load theme from localStorage or system preference
   */
  private loadTheme(): void {
    // Check localStorage first
    const savedTheme = localStorage.getItem(this.storageKey);
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.currentTheme = savedTheme;
    } else {
      // Check system preference using cached media query
      if (this.prefersDarkMedia && this.prefersDarkMedia.matches) {
        this.currentTheme = 'dark';
      }
    }

    this.applyTheme(this.currentTheme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set a specific theme
   */
  setTheme(theme: 'light' | 'dark'): void {
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
   */
  private applyTheme(theme: 'light' | 'dark'): void {
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
   */
  private saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn('⚠️ Failed to save theme preference:', error);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  /**
   * Get theme stats for debugging
   */
  getStats(): {
    currentTheme: 'light' | 'dark';
    isDarkMode: boolean;
    hasToggleButton: boolean;
    storageAvailable: boolean;
  } {
    return {
      currentTheme: this.currentTheme,
      isDarkMode: this.isDarkMode(),
      hasToggleButton: !!this.themeToggleButton,
      storageAvailable: this.isStorageAvailable()
    };
  }

  /**
   * Check if localStorage is available
   */
  private isStorageAvailable(): boolean {
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
