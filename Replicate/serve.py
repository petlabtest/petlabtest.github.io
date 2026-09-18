#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Local HTTP server for DPETLab website previews (http://127.0.0.1:5500/Website/...).
Handles POST gracefully (returns 204) so analytics/tracking noise doesn't error in console."""
import http.server, socketserver, os, sys

ROOT = "/Users/zhang/Documents/DPETLab"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5500

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_POST(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"Serving {ROOT} at http://127.0.0.1:{PORT}/  (POST -> 204)", flush=True)
    httpd.serve_forever()
