import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
    socket = null;

    connect(token) {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            autoConnect: false,
        });

        this.socket.connect();

        this.socket.on("connect", () => {
            console.log('WebSocket connected successfully');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error', error.message);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (!this.socket) {
            console.warn('Socket not initialized. Event listener not attached.');
            return;
        }

        this.socket.emit(event, data);
    }

    on(event, callback) {
     if (!this.socket) {
      console.warn('Socket not initialized. Event listener not attached.');
      return;
    }

    this.socket.on(event, callback);
    }

    off(event, callback) {
        if(this.socket) {
            this.socket.off(event, callback);
        }
    }

}

const socketService = new SocketService();

export default socketService;