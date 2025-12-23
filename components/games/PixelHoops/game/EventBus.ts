// EventBus for React-Phaser communication
// Simple event emitter pattern

type EventCallback = (...args: unknown[]) => void;

class EventBusClass {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    return this;
  }

  off(event: string, callback: EventCallback): this {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    return this;
  }

  emit(event: string, ...args: unknown[]): this {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}

export const EventBus = new EventBusClass();
