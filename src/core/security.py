"""
Enterprise Authentication, RBAC, Field Encryption & Security Utilities.
Provides JWT issuance/verification, Role-Based Access Control, and PII anonymization.
"""

import hmac
import hashlib
import base64
import json
import time
from enum import Enum
from typing import Optional, Dict, Any, List
from src.core.config import settings

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    RECRUITER = "RECRUITER"
    HIRING_MANAGER = "HIRING_MANAGER"
    VIEWER = "VIEWER"

# Granular Permission Capabilities
ROLE_PERMISSIONS: Dict[UserRole, List[str]] = {
    UserRole.ADMIN: [
        "users:manage", "settings:write", "candidates:read_unmasked",
        "candidates:write", "ranking:evaluate", "analytics:view", "interviews:score"
    ],
    UserRole.RECRUITER: [
        "candidates:read_unmasked", "candidates:write", "jobs:create",
        "ranking:evaluate", "interviews:score", "copilot:chat", "analytics:view"
    ],
    UserRole.HIRING_MANAGER: [
        "candidates:read_masked", "interviews:score", "analytics:view", "copilot:chat"
    ],
    UserRole.VIEWER: [
        "candidates:read_masked", "analytics:view"
    ]
}

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _base64url_decode(s: str) -> bytes:
    padding = '=' * (4 - (len(s) % 4))
    return base64.urlsafe_b64decode(s + padding)

def create_access_token(
    user_id: str,
    email: str,
    role: UserRole = UserRole.RECRUITER,
    expires_delta_minutes: Optional[int] = None
) -> str:
    """Generates a signed JWT token using HMAC-SHA256."""
    expire = int(time.time()) + (expires_delta_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "role": role.value,
        "exp": expire,
        "iat": int(time.time()),
        "iss": "nexora-auth-engine"
    }

    header_b64 = _base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(payload).encode('utf-8'))
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    
    signature = hmac.new(
        settings.JWT_SECRET.encode('utf-8'),
        signing_input,
        hashlib.sha256
    ).digest()
    sig_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifies and decodes a JWT token. Returns payload or None if invalid/expired."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        expected_sig = hmac.new(
            settings.JWT_SECRET.encode('utf-8'),
            signing_input,
            hashlib.sha256
        ).digest()
        
        if not hmac.compare_digest(_base64url_encode(expected_sig), sig_b64):
            return None
            
        payload = json.loads(_base64url_decode(payload_b64).decode('utf-8'))
        if payload.get("exp", 0) < int(time.time()):
            return None # Expired
            
        return payload
    except Exception:
        return None

class SecureAuditor:
    """
    Enterprise Audit Logging & Access Control Validator.
    Tracks all security events and validates RBAC actions.
    """
    def __init__(self):
        self.audit_logs: List[str] = []
        self._log_event("SYSTEM", "SecureAuditor initialized with RBAC controls active.")

    def _log_event(self, actor: str, message: str):
        ts = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
        self.audit_logs.append(f"[{ts} UTC] [{actor}] {message}")

    def authorize_action(self, role: str, permission: str) -> bool:
        try:
            user_role = UserRole(role.upper())
            perms = ROLE_PERMISSIONS.get(user_role, [])
            authorized = permission in perms
            self._log_event(role, f"Permission check for '{permission}': {'GRANTED' if authorized else 'DENIED'}")
            return authorized
        except Exception:
            self._log_event(role, f"Invalid role checked for '{permission}': DENIED")
            return False

    def authorize_profile_access(self, user_role: str, candidate_id: str, action: str = "VIEW") -> bool:
        perm = "candidates:read_unmasked" if action == "UNMASK" else "candidates:read_masked"
        return self.authorize_action(user_role, perm)

    def get_logs(self) -> List[str]:
        return self.audit_logs[-100:] # Last 100 entries
