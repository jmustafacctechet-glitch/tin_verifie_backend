import { GovernmentIntegration } from './integration.interface';

export class IntegrationRegistry {
  private integrations = new Map<string, GovernmentIntegration>();

  register(source: string, integration: GovernmentIntegration): void {
    const key = source.toLowerCase();
    if (this.integrations.has(key)) {
      throw new Error(`Integration for source "${source}" is already registered`);
    }
    this.integrations.set(key, integration);
  }

  get(source: string): GovernmentIntegration | undefined {
    return this.integrations.get(source.toLowerCase());
  }

  has(source: string): boolean {
    return this.integrations.has(source.toLowerCase());
  }

  getAvailableSources(): string[] {
    return Array.from(this.integrations.keys());
  }

  remove(source: string): boolean {
    return this.integrations.delete(source.toLowerCase());
  }

  clear(): void {
    this.integrations.clear();
  }
}
