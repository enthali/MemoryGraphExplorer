"""
Authentication middleware for Memory Graph Explorer
Supports API Key authentication with future OAuth 2.0 extensibility
"""

import os
from functools import wraps
from flask import request, jsonify
from typing import Optional, Dict, Tuple


class AuthManager:
    """Manages authentication for the application"""

    def __init__(self):
        # Load API keys from environment
        # Format: API_KEYS=key1:name1:permissions,key2:name2:permissions
        self.api_keys = self._load_api_keys()
        self.auth_enabled = os.environ.get("AUTH_ENABLED", "false").lower() == "true"

    def _load_api_keys(self) -> Dict[str, Dict[str, any]]:
        """Load API keys from environment variable"""
        keys = {}
        api_keys_env = os.environ.get("API_KEYS", "")

        if not api_keys_env:
            # Development fallback - single key if not configured
            dev_key = os.environ.get("API_KEY")
            if dev_key:
                keys[dev_key] = {
                    "name": "Default API Key",
                    "permissions": ["read", "write", "admin"],
                }
            return keys

        # Parse format: key1:name1:read,write|key2:name2:read
        for key_config in api_keys_env.split("|"):
            parts = key_config.split(":")
            if len(parts) >= 2:
                key = parts[0]
                name = parts[1]
                permissions = parts[2].split(",") if len(parts) > 2 else ["read"]
                keys[key] = {"name": name, "permissions": permissions}

        return keys

    def validate_request(
        self, required_permission: str = "read"
    ) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Validate incoming request authentication

        Returns:
            (is_valid, error_message, key_info)
        """
        # If auth is disabled (local dev), allow all requests
        if not self.auth_enabled:
            return (
                True,
                None,
                {"name": "Auth Disabled", "permissions": ["read", "write", "admin"]},
            )

        # Check for API key in headers
        # Support both X-API-Key and Authorization: Bearer formats
        api_key = request.headers.get("X-API-Key")

        if not api_key:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                api_key = auth_header[7:]  # Remove "Bearer " prefix

        if not api_key:
            return (
                False,
                "Missing API key. Provide X-API-Key header or Authorization: Bearer token",
                None,
            )

        # Validate key
        key_info = self.api_keys.get(api_key)
        if not key_info:
            return False, "Invalid API key", None

        # Check permission
        if (
            required_permission not in key_info["permissions"]
            and "admin" not in key_info["permissions"]
        ):
            return (
                False,
                f"Insufficient permissions. Required: {required_permission}",
                None,
            )

        return True, None, key_info


# Global auth manager instance
auth_manager = AuthManager()


def require_auth(permission: str = "read"):
    """
    Decorator to require authentication for a route

    Usage:
        @app.route('/api/protected')
        @require_auth('read')
        def protected_route():
            return jsonify({'data': 'secret'})
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            is_valid, error, key_info = auth_manager.validate_request(permission)

            if not is_valid:
                return jsonify({"error": "Unauthorized", "message": error}), 401

            # Attach key info to request for logging/audit
            request.auth_info = key_info

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def require_admin():
    """Decorator to require admin permissions"""
    return require_auth("admin")
