/**
 * Message Storage Abstraction (SOLID: Interface Segregation)
 *
 * Provides clean interface for message persistence.
 * Allows different implementations (localStorage, IndexedDB, memory, etc.)
 *
 * Author: Bernard Uriza Orozco
 * Created: 2025-11-20
 * Card: FI-PHIL-DOC-014 (Memoria Longitudinal Unificada)
 */

import type { FIMessage } from '@/types/assistant';

/**
 * Interface for message storage operations.
 *
 * Single Responsibility: ONLY handles message persistence.
 * Interface Segregation: Minimal interface, only what's needed.
 */
export interface IMessageStorage {
  /**
   * Load messages from storage.
   *
   * @param key Storage key (e.g., doctor_id)
   * @returns Array of messages, or empty array if none found
   */
  load(key: string): FIMessage[];

  /**
   * Save messages to storage.
   *
   * @param key Storage key
   * @param messages Messages to save
   */
  save(key: string, messages: FIMessage[]): void;

  /**
   * Clear messages from storage.
   *
   * @param key Storage key
   */
  clear(key: string): void;
}

/**
 * LocalStorage implementation of IMessageStorage.
 *
 * Single Responsibility: ONLY handles localStorage operations.
 * Open/Closed: Can add new storage implementations without modifying this.
 */
export class LocalStorageMessageStorage implements IMessageStorage {
  load(key: string): FIMessage[] {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) {
        return [];
      }

      return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to load messages from localStorage:', err);
      return [];
    }
  }

  save(key: string, messages: FIMessage[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to save messages to localStorage:', err);
    }
  }

  clear(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Failed to clear messages from localStorage:', err);
    }
  }
}

/**
 * In-memory implementation (for anonymous users or testing).
 *
 * Single Responsibility: ONLY handles in-memory storage.
 * Liskov Substitution: Can replace LocalStorageMessageStorage without breaking.
 */
export class InMemoryMessageStorage implements IMessageStorage {
  private storage = new Map<string, FIMessage[]>();

  load(key: string): FIMessage[] {
    return this.storage.get(key) || [];
  }

  save(key: string, messages: FIMessage[]): void {
    this.storage.set(key, messages);
  }

  clear(key: string): void {
    this.storage.delete(key);
  }
}

/**
 * Factory: Create appropriate storage based on context.
 *
 * Dependency Inversion: Returns IMessageStorage interface, not concrete type.
 */
export function createMessageStorage(persistent: boolean): IMessageStorage {
  if (persistent && typeof window !== 'undefined' && window.localStorage) {
    return new LocalStorageMessageStorage();
  }

  return new InMemoryMessageStorage();
}
