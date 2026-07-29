import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [isConnected, setIsConnected] = useState(false);

  // Maps userId -> 'Online' | 'Offline' | 'Away'
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {

    if (!isAuthenticated) {
      setIsConnected(false);
      setOnlineUsers({});
      return;
    }

    if (socketService.socket?.connected) {
      setIsConnected(true);
    }


    const handleConnect = () => {
      setIsConnected(true);
      socketService.emit('presence_update',{
        status: 'Online'
      });
    }

    const handleDisconnect = () => {
      setIsConnected(false);
    }

    const handleStatusChange = ({ userId, status }) => {
      console.log(userId, status);
      setOnlineUsers((prev) => {
        return {
          ...prev,
          [userId]: status
        }
      });
    };


    const handleJoinGroup = () => {
      console.log("group join");
    }

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('user_status_change', handleStatusChange);
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('user_status_change', handleStatusChange);
    };
  }, [isAuthenticated]);


  // // Expose manual presence updater matching backend 'presence_update' expectation
  // const updatePresenceStatus = (status) => {
  //   // Valid statuses: 'Online' | 'Offline' | 'Away'
  //   if (socketService.socket?.connected) {
  //     socketService.emit('presence_update', { status });
  //   }
  // };

  // const joinGroupRoom = (groupId) => {
  //   if (socketService.socket?.connected) {
  //     socketService.emit('join_group', { groupId });
  //   }
  // };

  const value = {
    isConnected,
    onlineUsers,
    socket: socketService
  };

  // We return the Provider so the app can consume the state
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>

};

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

