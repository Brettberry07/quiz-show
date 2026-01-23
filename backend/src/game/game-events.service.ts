import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameEventsService {
  private server: Server | null = null;
  private readonly logger = new Logger(GameEventsService.name);

  setServer(server: Server) {
    this.server = server;
  }

  emitToPin(pin: string, event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.warn(`emitToPin(${pin}, ${event}) skipped: server not ready`);
      return;
    }
    this.server.to(pin).emit(event, payload);
  }

  emitToSocket(socketId: string, event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.warn(`emitToSocket(${socketId}, ${event}) skipped: server not ready`);
      return;
    }
    this.server.to(socketId).emit(event, payload);
  }
}