import http.server
import socketserver
import sys

PORT = 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'Serveur démarré : http://localhost:{PORT}')
        print('Ctrl+C pour arrêter.')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nArrêt du serveur.')
            sys.exit(0)
