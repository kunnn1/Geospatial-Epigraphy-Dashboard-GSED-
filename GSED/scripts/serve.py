#!/usr/bin/env python3
"""Serve the dashboard over HTTP for local development.

The dashboard is designed to work from ``file://`` as well, so this is a
convenience rather than a requirement. It is useful when you want a stable
URL, correct MIME types, or to open the page from another device on the
same network.

    python3 scripts/serve.py            # http://localhost:8000
    python3 scripts/serve.py --port 9000
"""

from __future__ import annotations

import argparse
import functools
import http.server
import socketserver
import webbrowser
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """A request handler that logs one tidy line per request and never caches.

    Disabling the cache matters during development: without it the browser
    happily serves a stale copy of an edited stylesheet or module, and you end
    up debugging code that is no longer on disk.
    """

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:  # noqa: A002 - stdlib signature
        print(f"  {self.command} {self.path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000, help="port to listen on (default 8000)")
    parser.add_argument("--no-open", action="store_true", help="do not open a browser window")
    args = parser.parse_args()

    handler = functools.partial(QuietHandler, directory=str(PROJECT_ROOT))

    # allow_reuse_address avoids "Address already in use" when restarting.
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", args.port), handler) as httpd:
        url = f"http://localhost:{args.port}/index.html"
        print(f"Serving {PROJECT_ROOT} at {url}\nPress Ctrl+C to stop.\n")
        if not args.no_open:
            webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
