import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const FindDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState('');

  // Fetch all doctors from the directory on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get('/doctors');
        setDoctors(data.data);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  const fetchSlots = async (doctorId, searchDate) => {
    try {
      const { data } = await api.get(`/doctors/${doctorId}/available-slots?date=${searchDate}`);
      setSlots(data.data);
    } catch (err) {
      alert('Failed to fetch slots. ' + err.message);
    }
  };

  const handleBook = async (time) => {
    try {
      const payload = {
        doctorId: selectedDoctor._id,
        date,
        time,
        notes: "Frontend test booking"
      };
      await api.post('/appointments/book', payload);
      alert(`Successfully booked for ${date} at ${time}`);
      // Refresh slots dynamically so it disappears
      fetchSlots(selectedDoctor._id, date);
    } catch (err) {
      alert('Booking Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2>Patient Dashboard - Find Doctor & Book</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Doctors Directory List */}
        <div style={{ flex: 1 }}>
          <h3>Doctors Directory</h3>
          {doctors.map(doc => (
            <div 
              key={doc._id} 
              onClick={() => setSelectedDoctor(doc)}
              style={{ 
                border: '1px solid #ccc', padding: '15px', margin: '10px 0', 
                cursor: 'pointer', borderRadius: '5px',
                background: selectedDoctor?._id === doc._id ? '#e0f7fa' : '#fff'
              }}
            >
              <h4 style={{ margin: '0 0 5px' }}>{doc.name}</h4>
              <p style={{ margin: '0 0 5px', color: '#555' }}>{doc.department} | {doc.specialization}</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Fee: ${doc.consultationFee}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Availability Engine */}
        {selectedDoctor && (
          <div style={{ flex: 1 }}>
            <h3>Book with {selectedDoctor.name}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Select Date:</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => {
                  setDate(e.target.value);
                  fetchSlots(selectedDoctor._id, e.target.value);
                }}
                style={{ padding: '8px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            
            <h4>Available Slots</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {slots.length === 0 ? (
                <p>{date ? 'No slots available for this date.' : 'Select a date to view slots.'}</p>
              ) : (
                slots.map(slot => (
                  <button 
                    key={slot} 
                    onClick={() => handleBook(slot)}
                    style={{ padding: '10px 20px', cursor: 'pointer', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}
                  >
                    {slot}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindDoctor;
