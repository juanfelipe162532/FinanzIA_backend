export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}
