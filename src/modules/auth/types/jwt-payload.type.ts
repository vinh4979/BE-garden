export type JwtPayload = {
  userId: string; // userId
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  iat?: number;
  exp?: number;
};
