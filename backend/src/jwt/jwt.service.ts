// You can ignore these, eslint has a seizure when it sees good code (brcrypt types are incorrectly defined)
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";

export interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  // ----- ACCESS TOKEN -----
  generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_SECRET"), // Use symmetric secret
      algorithm: "HS256",
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXP", "15m") as any,
    });
  }

  // ----- REFRESH TOKEN -----
  generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload)
  }

  // Hash refresh tokens before storing in DB
  async hashToken(token: string): Promise<string> {
    try {
      const salt: string = (await bcrypt.genSalt(10)) as string;
      return bcrypt.hash(token, salt) as Promise<string>;
    } catch (error) {
      throw new InternalServerErrorException("Error hashing token", error as Error);
    }
  }

  compareToken(token: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(token, hash) as Promise<boolean>;
    } catch (error) {
      throw new InternalServerErrorException("Error comparing token", error as Error);
    }
  }

  // ----- VALIDATION -----
  async verifyToken(token: string): Promise<boolean> {
    return this.jwtService.verifyAsync<JwtPayload>(token).then(() => true).catch(() => false);
  }

  async verifyAndDecode<T extends object = JwtPayload>(token: string): Promise<T> {
    return this.jwtService.verifyAsync<T>(token);
  }

  /**
   * Extract payload without validating signature
   * 
   * @deprecated Use verifyAndDecode for secure operations
  */ 
  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decode(token);
  }

  // ----- TOKEN ROTATION -----
  async rotateTokens(userId: string) {
    const payload: JwtPayload = { sub: userId };
    
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);
    
    // Return both but hash refresh before saving
    return {
      accessToken,
      refreshToken,
      refreshTokenHash: await this.hashToken(refreshToken),
    };
  }
}
