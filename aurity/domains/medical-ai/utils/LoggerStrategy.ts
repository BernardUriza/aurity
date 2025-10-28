export class LoggerStrategy {
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  log(...args: unknown[]): void {
    if (this.enabled) console.log(...args);
  }

  error(...args: unknown[]): void {
    if (this.enabled) console.error(...args);
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
  }
}

export const DefaultLogger = new LoggerStrategy(true);