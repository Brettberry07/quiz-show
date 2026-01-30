import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '../jwt/jwt.service';

type AuthedSocket = Socket & { data: { user?: { id: string } } };

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthedSocket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAndDecode(token);
      client.data.user = { id: (payload).sub };
      return true;
    } catch {
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake?.auth as { token?: string })?.token;
    if (authToken) return authToken;

    const headerAuth = client.handshake?.headers?.authorization;
    if (headerAuth && typeof headerAuth === 'string') {
      const [, token] = headerAuth.split(' ');
      return token || null;
    }

    return null;
  }
}

export type { AuthedSocket };