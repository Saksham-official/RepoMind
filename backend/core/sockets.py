from fastapi import WebSocket
from typing import List
import json

class ConnectionManager:
    """
    Manages all active WebSocket connections to the backend.
    Used for broadcasting AI and GitHub events live to the Next.js Dashboard.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WEBSOCKET] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WEBSOCKET] Client disconnected. Total active: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        """
        Broadcasts a JSON object to all connected dashboard instances.
        If a socket is dead/closed, it will be safely removed.
        """
        if not self.active_connections:
            return
            
        json_message = json.dumps(message)
        dead_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(json_message)
            except Exception as e:
                dead_connections.append(connection)
                
        # Clean up dead sockets
        for dead in dead_connections:
            self.disconnect(dead)

# Global singleton instance used throughout the app (background tasks to push events)
manager = ConnectionManager()
