import os
import sys
import mimetypes
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.error

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

class MobileAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        # Proxy /api requests to Django backend on port 8000
        if self.path.startswith("/api/"):
            target_url = f"http://127.0.0.1:8000{self.path}"
            try:
                headers = {k: v for k, v in self.headers.items() if k.lower() != "host"}
                req = urllib.request.Request(target_url, headers=headers)
                with urllib.request.urlopen(req) as resp:
                    self.send_response(resp.status)
                    for k, v in resp.headers.items():
                        self.send_header(k, v)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(resp.read())
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                for k, v in e.headers.items():
                    self.send_header(k, v)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(e.read())
            except Exception as e:
                self.send_response(502)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(f"Proxy error: {e}".encode())
            return

        # Check if requested static file exists in dist
        clean_path = self.path.split("?")[0]
        file_path = os.path.join(DIST_DIR, clean_path.lstrip("/"))
        if os.path.isfile(file_path):
            return super().do_GET()

        # SPA Fallback: serve index.html for client-side routes
        self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        self.proxy_write("POST")

    def do_PUT(self):
        self.proxy_write("PUT")

    def do_PATCH(self):
        self.proxy_write("PATCH")

    def do_DELETE(self):
        self.proxy_write("DELETE")

    def proxy_write(self, method):
        if self.path.startswith("/api/"):
            target_url = f"http://127.0.0.1:8000{self.path}"
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len) if content_len > 0 else None
                headers = {k: v for k, v in self.headers.items() if k.lower() not in ["host", "content-length"]}
                req = urllib.request.Request(target_url, data=body, headers=headers, method=method)
                with urllib.request.urlopen(req) as resp:
                    self.send_response(resp.status)
                    for k, v in resp.headers.items():
                        self.send_header(k, v)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(resp.read())
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                for k, v in e.headers.items():
                    self.send_header(k, v)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(e.read())
            except Exception as e:
                self.send_response(502)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(f"Proxy error: {e}".encode())
        else:
            self.send_response(405)
            self.end_headers()

if __name__ == "__main__":
    port = 5174
    server = ThreadingHTTPServer(("0.0.0.0", port), MobileAppHandler)
    print(f"Mobile & Desktop Server running at http://0.0.0.0:{port}")
    server.serve_forever()
