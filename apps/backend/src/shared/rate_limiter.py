import logging
from fastapi import Request, HTTPException, status
from jose import jwt
from src.core.config import settings
from src.shared.redis_service import redis_service

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds

    async def __call__(self, request: Request):
        # Fallback identification: Client IP
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        
        identifier = client_ip
        
        # Try to resolve authenticated user if Bearer token is provided
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=[settings.ALGORITHM]
                )
                # Use sub (email) or user_id as identifier
                identifier = payload.get("sub", client_ip)
            except Exception:
                pass # Invalid token, fall back to IP
                
        key = f"rate_limit:{path}:{identifier}"
        
        # Check rates using the wrapper service to maintain JSON integrity
        try:
            current = await redis_service.get(key)
            if current is not None:
                count = int(current)
                if count >= self.limit:
                    logger.warning(f"Rate limit hit for key: {key} (limit: {self.limit})")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded. Please try again later."
                    )
                await redis_service.set(key, count + 1, expire=self.window)
            else:
                await redis_service.set(key, 1, expire=self.window)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Redis rate limiter exception (continuing gracefully): {e}")
