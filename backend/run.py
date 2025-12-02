from app import create_app, db, socketio
from dotenv import load_dotenv
import socket

load_dotenv()

app = create_app()

with app.app_context():
    db.create_all()


def obtener_ip_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except:
        return "127.0.0.1"
    finally:
        s.close()


if __name__ == '__main__':
    
    ip_local = obtener_ip_local()
    print("==============================================")
    print(f" 🔵 Servidor Flask (Socket.IO) corriendo en:")
    print(f" 👉 https://{ip_local}:5000 ")
    print("==============================================")

    # ⚠️ IMPORTANTE: ejecutar con socketio.run
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        ssl_context=(
            "C:/Users/ok/Desktop/proyecto de asistencia/frontend/127.0.0.1+3.pem",
            "C:/Users/ok/Desktop/proyecto de asistencia/frontend/127.0.0.1+3-key.pem"
        )
    )
