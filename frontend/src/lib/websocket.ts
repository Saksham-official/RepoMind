/**
 * Orbiter WebSocket Client
 * Real-time activity feed from the backend
 */

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export type WSEventType =
  | "issue_triaged"
  | "question_answered"
  | "commit_analyzed"
  | "error"
  | "connected";

export interface WSEvent {
  type: WSEventType;
  issue_number?: number;
  classification?: string;
  confidence?: number;
  sha?: string;
  commit_type?: string;
  message?: string;
  actions?: string[];
  timestamp?: string;
}

type EventHandler = (event: WSEvent) => void;

class OrbiterWebSocket {
  private ws: WebSocket | null = null;
  private handlers: EventHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;

  connect(token?: string) {
    this.token = token || null;
    this.createConnection();
  }

  private createConnection() {
    const url = `${WS_BASE}/api/v1/ws/feed${this.token ? `?token=${this.token}` : ""}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit({ type: "connected", message: "Connected to Orbiter" });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSEvent;
          data.timestamp = data.timestamp || new Date().toISOString();
          this.emit(data);
        } catch {
          console.error("Failed to parse WS message:", event.data);
        }
      };

      this.ws.onclose = () => {
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  onEvent(handler: EventHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  private emit(event: WSEvent) {
    this.handlers.forEach((h) => h(event));
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

// Singleton
export const orbiterWS = new OrbiterWebSocket();
