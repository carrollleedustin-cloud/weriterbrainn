// Simple service locator placeholder; replace with awilix/tsyringe later if needed
export class Container {
  private registry = new Map<string, unknown>();

  register<T>(key: string, value: T) {
    this.registry.set(key, value);
  }

  resolve<T>(key: string): T {
    if (!this.registry.has(key)) throw new Error(`Dependency not found: ${key}`);
    return this.registry.get(key) as T;
  }
}

export const container = new Container();
