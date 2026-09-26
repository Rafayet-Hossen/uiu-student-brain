try:
    import pymysql
    import pymysql.connections

    if not getattr(pymysql.connections.Connection, "_is_ssl_mode_patched", False):
        _orig_init = pymysql.connections.Connection.__init__

        def _patched_init(self, *args, **kwargs):
            for key in ("password", "passwd"):
                if key in kwargs and isinstance(kwargs[key], str):
                    try:
                        kwargs[key] = kwargs[key].encode("latin1")
                    except UnicodeEncodeError:
                        kwargs[key] = kwargs[key].encode("utf-8")
            if "ssl_mode" in kwargs:
                ssl_mode = kwargs.pop("ssl_mode")
                if ssl_mode and str(ssl_mode).upper() != "DISABLED":
                    kwargs["ssl_verify_identity"] = True
                    kwargs["ssl_verify_cert"] = True
            return _orig_init(self, *args, **kwargs)

        pymysql.connections.Connection.__init__ = _patched_init
        pymysql.connections.Connection._is_ssl_mode_patched = True
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# TiDB reports version as 8.0.11 while supporting full MySQL 8.
# Django 6.0 enforces MySQL >= 8.4 by default, so we allow TiDB by bypassing the version check.
try:
    from django.db.backends.mysql.base import DatabaseWrapper
    DatabaseWrapper.check_database_version_supported = lambda self: None
except (ImportError, AttributeError):
    pass
