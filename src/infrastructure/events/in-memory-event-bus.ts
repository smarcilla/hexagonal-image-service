import { DomainEvent } from 'src/domain/events/domain-event';
import { EventBus } from '../../application/ports/event.bus';
import { Logger, OnModuleDestroy } from '@nestjs/common';

type Handler = (event: DomainEvent) => Promise<void>;

export class InMemoryEventBus implements EventBus, OnModuleDestroy {
  public static DEFAULT_POLLING_INTERVAL_MS = 1000 * 60; // 1 minute
  private handlers: Map<string, Handler[]> = new Map();
  private queue: DomainEvent[] = [];
  private intervalId?: NodeJS.Timeout;
  private processing = false;
  logger: Logger = new Logger(InMemoryEventBus.name);

  /**
   * @param pollingIntervalMs cuánto esperar entre cada intento de procesar la cola (por defecto 1000ms)
   * @param autoStart arrancar el procesador inmediatamente (por defecto true)
   */
  constructor(
    private pollingIntervalMs = InMemoryEventBus.DEFAULT_POLLING_INTERVAL_MS,
    autoStart = true,
  ) {
    if (autoStart) this.start();
  }

  /**
   * Publica (enqueue) un evento en memoria.
   */
  publish(event: DomainEvent): Promise<void> {
    this.queue.push(event);
    return Promise.resolve();
  }

  /**
   * Suscribe un handler a un tipo de evento.
   */
  subscribe(eventType: string, handler: Handler): void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  /**
   * Arranca el procesador periódico que extrae eventos de la cola y ejecuta handlers.
   */
  start(): void {
    if (this.intervalId) return; // ya arrancado
    this.intervalId = setInterval(
      () => void this.processQueue(),
      this.pollingIntervalMs,
    );
  }

  /**
   * Detiene el procesador periódico.
   */
  stop(): void {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  /**
   * Procesa la cola: toma Snapshot de eventos pendientes y ejecuta handlers para cada evento.
   * Evita procesamiento concurrente y captura errores por handler para no bloquear la cola.
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      // Extraer snapshot de la cola (FIFO)
      const pending: DomainEvent[] = this.queue.splice(0, this.queue.length);
      if (pending.length === 0) return;

      for (const event of pending) {
        const handlers = this.handlers.get(event.type) ?? [];
        // Ejecutar handlers en paralelo para este evento, pero esperar a que terminen
        await Promise.all(
          handlers.map(async (h) => {
            try {
              await h(event);
            } catch (err) {
              this.logger.error(`Event handler error for ${event.type}`, err);
              // Capturar errores por handler; no se re-lanza para no bloquear otros handlers/eventos.
              // Aquí se podría loggear usando el adaptador de logging de infraestructura.
              // console.error(`Event handler error for ${event.type}`, err);
            }
          }),
        );
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Hook de NestJS: se ejecuta automáticamente antes de que el módulo se destruya.
   */
  onModuleDestroy() {
    this.dispose();
  }

  /**
   * Detiene el procesador periódico y libera recursos.
   * Puede ser llamado manualmente o automáticamente por NestJS.
   */
  dispose(): void {
    this.stop();
    this.handlers.clear();
    this.queue = [];
    this.logger.log('InMemoryEventBus disposed');
  }
}
