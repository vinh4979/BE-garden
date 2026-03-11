import { JwtPayload } from 'src/modules/auth/types/jwt-payload.type';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
export {};
