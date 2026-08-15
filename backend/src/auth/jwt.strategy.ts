import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ClientsService } from '../clients/clients.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly users: UsersService, private readonly clients: ClientsService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: Role }) {
    if (payload.role === Role.CLIENT) {
      const client = await this.clients.findById(payload.sub);
      if (!client) throw new UnauthorizedException('Invalid token');
      return { ...this.clients.sanitize(client), role: Role.CLIENT };
    }
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid token');
    return this.users.sanitize(user);
  }
}
