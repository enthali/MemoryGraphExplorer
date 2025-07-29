/**
 * Event Bus - Central event communication system
 * Provides loose coupling between modules through events
 */

export class EventBus {
  constructor() {
    this.events = {};
    console.log('📡 Event Bus initialized');
  }

  /**
   * Subscribe to events
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Function to call when event is emitted
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  /**
   * Publish events
   * @param {string} eventName - Name of the event to emit
   * @param {*} data - Data to pass to event listeners
   */
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Event Bus error in "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * Unsubscribe from events (for cleanup)
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Specific callback to remove
   */
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Name of the event to clear
   */
  removeAllListeners(eventName) {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }

  /**
   * Get list of active events (for debugging)
   */
  getActiveEvents() {
    return Object.keys(this.events);
  }
}

// Create and export a singleton instance
export const eventBus = new EventBus();