from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from ..models.models import Token, Stream


class TokenValidationError(Exception):
    pass


def validate_stream_token(db: Session, stream_id: int, token_value: Optional[str]) -> Token:
    if not token_value:
        raise TokenValidationError("Missing token")

    token: Token | None = db.query(Token).filter(Token.token == token_value).first()
    if not token:
        raise TokenValidationError("Invalid token")

    if token.stream_id != stream_id:
        raise TokenValidationError("Token does not match stream")

    if token.revoked:
        raise TokenValidationError("Token revoked")

    if token.expires_at and token.expires_at < datetime.utcnow():
        raise TokenValidationError("Token expired")

    return token