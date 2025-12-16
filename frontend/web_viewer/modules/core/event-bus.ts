/**
 * Event Bus - Central event communication system
 * Provides loose coupling between modules through events
 */

import type { EventMap, EventName, EventCallback } from '../../src/types/index.js';

export class EventBus {
  private events: Partial<Record<EventName, Array<EventCallback<any>>>>;

  constructor() {
    this.events = {};
    console.log('📡 Event Bus initialized');
  }

  /**
   * Subscribe to events
   */
  on<T extends EventName>(eventName: T, callback: EventCallback<T>): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName]!.push(callback);
  }

  /**
   * Publish events
   */
  emit<T extends EventName>(eventName: T, data: EventMap[T]): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach((callback) => {
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
   */
  off<T extends EventName>(eventName: T, callback: EventCallback<T>): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback) as Array<EventCallback<any>>;
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventName?: EventName): void {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }

  /**
   * Get list of active events (for debugging)
   */
  getActiveEvents(): EventName[] {
    return Object.keys(this.events) as EventName[];
  }
}

// Create and export a singleton instance
export const eventBus = new EventBus();
