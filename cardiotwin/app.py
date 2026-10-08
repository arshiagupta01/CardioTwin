try:
    from cardiotwin.api.app import app
except ImportError:
    from api.app import app

__all__ = ["app"]