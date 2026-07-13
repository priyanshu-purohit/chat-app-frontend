import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {


    const handleConnect = () => {
      console.log("connected");
    }
    const handleDisconnect = () => {
      console.log("disconnected");
    }
    const handleTypingStart = () => {
      console.log("typing started");
    }
    const handleTypingStop = () => {
      console.log("typing started");
    }
    const handlePresenceUpdate = () => {
      console.log("presence updated");
    }
    const handleStatusChange = () => {
      console.log("status change");
    }
    const handleJoinGroup = () => {
      console.log("group join");
    }

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('typing_started', handleTypingStart);
    socketService.on('typing_stopped', handleTypingStop);
    socketService.on('presence_update', handlePresenceUpdate);
    socketService.on('user_status_change', handleStatusChange);
    socketService.on('join_group', handleJoinGroup);
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('user_status_change', handleStatusChange);
    };
  }, [isAuthenticated]);

}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// import { createContext, useContext, useState, useEffect } from 'react';
// import { useAuth } from './AuthContext';
// import socketService from '../services/socket';

// const SocketContext = createContext(null);

// export function SocketProvider({ children }) {
//   const { isAuthenticated } = useAuth();
//   const [isConnected, setIsConnected] = useState(false);
  
//   // Maps userId -> 'Online' | 'Offline' | 'Away'
//   const [onlineUsers, setOnlineUsers] = useState({});

//   useEffect(() => {
//     if (!isAuthenticated) {
//       setIsConnected(false);
//       setOnlineUsers({});
//       return;
//     }

//     if (socketService.socket?.connected) {
//       setIsConnected(true);
//     }

//     const handleConnect = () => {
//       setIsConnected(true);
//       // Let the backend know we are online (capitalized 'Online')
//       socketService.emit('presence_update', { status: 'Online' });
//     };

//     const handleDisconnect = () => {
//       setIsConnected(false);
//     };

//     // Listen to backend's status broadcast
//     const handleStatusChange = ({ userId, status }) => {
//       setOnlineUsers((prev) => ({
//         ...prev,
//         [userId]: status, // updates user state dynamically
//       }));
//     };

//     // Attach WebSocket Listeners matching backend names
//     socketService.on('connect', handleConnect);
//     socketService.on('disconnect', handleDisconnect);
//     socketService.on('user_status_change', handleStatusChange);

//     return () => {
//       socketService.off('connect', handleConnect);
//       socketService.off('disconnect', handleDisconnect);
//       socketService.off('user_status_change', handleStatusChange);
//     };
//   }, [isAuthenticated]);

//   // Expose manual presence updater matching backend 'presence_update' expectation
//   const updatePresenceStatus = (status) => {
//     // Valid statuses: 'Online' | 'Offline' | 'Away'
//     if (socketService.socket?.connected) {
//       socketService.emit('presence_update', { status });
//     }
//   };

//   const joinGroupRoom = (groupId) => {
//     if (socketService.socket?.connected) {
//       socketService.emit('join_group', { groupId });
//     }
//   };

//   const value = {
//     isConnected,
//     onlineUsers,
//     updatePresenceStatus,
//     joinGroupRoom,
//     socket: socketService,
//   };

//   // We return the Provider so the app can consume the state
//   return (
//     <SocketContext.Provider value={value}>
//       {children}
//     </SocketContext.Provider>
//   );
// }

// export function useSocket() {
//   const context = useContext(SocketContext);
//   if (!context) {
//     throw new Error('useSocket must be used within a SocketProvider');
//   }
//   return context;
// }

