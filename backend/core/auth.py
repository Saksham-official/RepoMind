import os
from fastapi import Request, HTTPException, Depends
from jose import jwt
from core.database import get_db_client

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

async def get_current_user(request: Request):
    """
    Validates the Supabase JWT from the Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = auth_header.split(" ")[1]
    
    try:
        # Debug: Check token header
        unverified_header = jwt.get_unverified_header(token)
        print(f"[AUTH] Token Header: {unverified_header}")
        
        # Validate the token
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256", "RS256", "ES256"], 
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except Exception as e:
        print(f"[AUTH] Token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
