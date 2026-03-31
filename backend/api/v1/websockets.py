from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from core.sockets import manager
import asyncio

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/feed")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    """
    The main live feed WebSocket endpoint.
    According to api_contracts.md: `WS /api/v1/ws/feed?token={jwt}`
    In production, you'd decode and verify the `token` here.
    """
    # 1. Verification Stub
    if not token or token == "undefined":
        print("⚠ WARNING: WebSocket connected without a valid JWT token. Permitting for now in Dev Mode.")
        # In prod: await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        # return

    await manager.connect(websocket)
    try:
        # 2. Keep the connection alive
        while True:
            # We wait for messages from the client (e.g. ping/pong keepalives)
            # This is intentionally generic. We just need to hold the connection open.
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WEBSOCKET ERROR] Connection failed: {e}")
        manager.disconnect(websocket)
