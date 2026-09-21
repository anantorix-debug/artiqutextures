export interface JwtAccessPayload {
  sub: string;
  email: string;
  name: string;
}

export interface JwtRefreshPayload {
  sub: string;
}

export interface JwtResetPayload {
  sub: string;
  email: string;
}
