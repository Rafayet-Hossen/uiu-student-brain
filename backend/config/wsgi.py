"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

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

try:
    from django.db.backends.mysql.base import DatabaseWrapper
    from django.db.backends.mysql.schema import DatabaseSchemaEditor
    from django.db.backends.base.schema import BaseDatabaseSchemaEditor

    DatabaseWrapper.check_database_version_supported = lambda self: None
    DatabaseSchemaEditor.sql_create_column_inline_fk = None

    if not getattr(BaseDatabaseSchemaEditor, "_is_safe_execute_patched", False):
        _orig_execute = BaseDatabaseSchemaEditor.execute

        def _safe_execute(self, sql, params=()):
            try:
                return _orig_execute(self, sql, params)
            except Exception as e:
                err_str = str(e).lower()
                if any(code in err_str for code in ["1060", "duplicate column", "1061", "duplicate key", "1050", "already exists", "1826"]):
                    print(f"⚠️ [TiDB Schema] Warning: Object already exists, skipping: {e}")
                    return
                raise

        BaseDatabaseSchemaEditor.execute = _safe_execute
        DatabaseSchemaEditor.execute = _safe_execute
        BaseDatabaseSchemaEditor._is_safe_execute_patched = True
except (ImportError, AttributeError):
    pass

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
