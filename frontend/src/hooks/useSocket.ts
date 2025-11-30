import { useEffect } from 'react';
import socket from '../socket';

/**
 * Hook to listen for vacation updates via Socket.IO
 * @param onUpdate - Callback function when vacation updates occur
 */
export const useVacationUpdates = (
  onUpdate: (data: { vacationId: string; action: 'follow' | 'unfollow' | 'update' | 'delete' | 'create' }) => void
) => {
  useEffect(() => {
    // Listen for vacation updates
    socket.on('vacation-update', onUpdate);

    // Cleanup on unmount
    return () => {
      socket.off('vacation-update', onUpdate);
    };
  }, [onUpdate]);
};

/**
 * Hook to connect/disconnect from Socket.IO
 */
export const useSocketConnection = () => {
  useEffect(() => {
    // Connect to Socket.IO server
    socket.connect();

    console.log('Socket.IO connected');

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log('Socket.IO disconnected');
    };
  }, []);
};

export default socket;
