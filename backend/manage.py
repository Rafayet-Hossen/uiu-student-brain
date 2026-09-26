#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

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
    DatabaseWrapper.check_database_version_supported = lambda self: None
except (ImportError, AttributeError):
    pass


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
