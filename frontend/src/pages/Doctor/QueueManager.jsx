import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';

const QueueManager = () => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Hardcoded dummy IDs to test the transaction (you would fetch these from the active queue)
  const [currentPatientId, setCurrentPatientId] = useState('65f1c9d8e4b0a1a2b3c4d5e6'); 
  const [currentQueueId, setCurrentQueueId] = useState('65f1c9d8e4b0a1a2b3c4d5e7');

  useEffect(() => {
    // Connect socket and attach credentials (cookies)
    const newSocket = io('http://localhost:5000', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      setLogs(prev => [...prev, '🔌 Socket Connected!']);
      // Join the doctor-specific room
      newSocket.emit('joinRoom', `doctor_${user._id}`);
      setLogs(prev => [...prev, `Joined Room: doctor_${user._id}`]);
    });

    // Listen for live queue updates triggered by the Service transaction
    newSocket.on('PATIENT_CALLED', (data) => {
      setLogs(prev => [...prev, `[PATIENT_CALLED]: ${JSON.stringify(data)}`]);
    });

    newSocket.on('QUEUE_UPDATED', (data) => {
      setLogs(prev => [...prev, `[QUEUE_UPDATED]: ${JSON.stringify(data)}`]);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user._id]);

  const handleNextPatient = async () => {
    try {
      // Simulate completing a session and updating the EMR
      const payload = {
        currentPatientId, 
        currentQueueId,
        sessionDuration: 15,
        diagnosis: "General Checkup via React Frontend",
        emrUpdates: {
          chronicDiseases: ["Asthma"]
        }
      };

      const { data } = await api.post('/consultations/complete-and-next', payload);
      alert('Transaction Success! Check logs. Backend says: ' + data.message);
      
      if(data.nextPatient) {
         setCurrentPatientId(data.nextPatient.patient._id);
         setCurrentQueueId(data.nextPatient._id);
      }
    } catch (error) {
      alert('Error triggering transaction: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2>Doctor Command Center - Queue Manager</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Controls</h3>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <p><strong>Current Session Target:</strong></p>
            <p>Patient ID: <code>{currentPatientId}</code></p>
            <p>Queue ID: <code>{currentQueueId}</code></p>
            <small style={{ color: '#888' }}>(Using dummy IDs for testing the Complete endpoint without fetching a live queue first)</small>
          </div>
          
          <button 
            onClick={handleNextPatient}
            style={{ padding: '15px 20px', fontSize: '16px', background: '#d32f2f', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', width: '100%' }}
          >
            Complete Session & Call Next Patient
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Socket.io Live Logs</h3>
          <div style={{ background: '#1e1e1e', color: '#00ff00', padding: '15px', height: '400px', overflowY: 'auto', borderRadius: '5px', fontFamily: 'monospace' }}>
            {logs.map((log, i) => (
               <div key={i} style={{ marginBottom: '5px' }}>&gt; {log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueManager;
