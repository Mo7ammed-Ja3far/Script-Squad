import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // adjust if backend port changes
  withCredentials: true, // Crucial for sending HTTP-only cookies like our JWT
});

export default api;
