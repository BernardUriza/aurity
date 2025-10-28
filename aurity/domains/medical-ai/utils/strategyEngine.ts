import { MedicalStrategy } from '../types';

export class StrategyEngine {
  private strategies: Map<string, MedicalStrategy> = new Map();

  register(strategy: MedicalStrategy) {
    this.strategies.set(strategy.id, strategy);
  }

  get(id: string): MedicalStrategy | undefined {
    return this.strategies.get(id);
  }
}

export const strategyEngine = new StrategyEngine();
