/**
 * VCPToolBox SDK Types
 * VCPToolBox SDK 类型定义
 */

// Authentication Types
export interface AuthConfig {
  apiKey?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

// API Client Types
export interface ClientConfig {
  baseURL: string;
  timeout?: number;
  auth?: AuthConfig;
  headers?: Record<string, string>;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  request?: any;
}

// Game Types
export interface Game {
  id: string;
  name: string;
  description?: string;
  status: GameStatus;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  settings?: GameSettings;
}

export type GameStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface GameSettings {
  maxPlayers?: number;
  isPublic?: boolean;
  aiModels?: string[];
  plugins?: string[];
}

export interface CreateGameRequest {
  name: string;
  description?: string;
  settings?: GameSettings;
}

export interface UpdateGameRequest {
  name?: string;
  description?: string;
  status?: GameStatus;
  settings?: GameSettings;
}

// Action Types
export interface GameAction {
  type: ActionType;
  payload: Record<string, any>;
  metadata?: ActionMetadata;
}

export type ActionType = 'option' | 'command' | 'meta';

export interface ActionMetadata {
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
  pluginId?: string;
}

export interface SubmitActionRequest {
  gameId: string;
  action: GameAction;
}

export interface ActionResponse {
  success: boolean;
  result?: any;
  error?: string;
  nextActions?: GameAction[];
}

// Plugin Types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  contributes?: PluginContributions;
}

export interface PluginContributions {
  aiTools?: AiToolContribution[];
  commands?: CommandContribution[];
  [key: string]: any;
}

export interface AiToolContribution {
  id: string;
  name: string;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
}

export interface CommandContribution {
  id: string;
  name: string;
  description: string;
  handler: string;
}

// WebSocket Types
export interface WebSocketConfig {
  url: string;
  auth?: AuthConfig;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
  gameId?: string;
}

export type WebSocketEventHandler = (event: WebSocketEvent) => void;

// Error Types
export class VCPToolBoxError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'VCPToolBoxError';
  }
}

export class AuthenticationError extends VCPToolBoxError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends VCPToolBoxError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends VCPToolBoxError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
  }
}

export class PluginError extends VCPToolBoxError {
  constructor(message: string, pluginId?: string, details?: any) {
    super(message, 'PLUGIN_ERROR', 500, { pluginId, ...details });
    this.name = 'PluginError';
  }
}

// Event Types
export interface SDKEventMap {
  ready: void;
  error: VCPToolBoxError;
  authenticated: TokenResponse;
  gameCreated: Game;
  gameUpdated: Game;
  actionSubmitted: ActionResponse;
  websocketConnected: void;
  websocketDisconnected: void;
  websocketError: Error;
  pluginLoaded: Plugin;
  pluginUnloaded: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
