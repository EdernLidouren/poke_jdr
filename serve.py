import http.server
import socketserver
import sys

PORT = 8000

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

class ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    with ThreadingServer(('', PORT), NoCacheHandler) as httpd:
        print(f'Serveur démarré : http://localhost:{PORT}')
        print('Ctrl+C pour arrêter.')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nArrêt.')
            sys.exit(0)