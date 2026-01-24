import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Send, Clock, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [clothesCount, setClothesCount] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/laundry/my-history', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setHistory(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDropOff = async (e) => {
    e.preventDefault();
    if (Number(clothesCount) > 10) {
        alert('Maximum 10 clothes allowed per submission.');
        return;
    }

    try {
      await axios.post('http://localhost:3000/api/laundry/dropoff', 
        { clothesCount: Number(clothesCount) },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setClothesCount('');
      fetchHistory(); // Refresh list
      alert('Clothes dropped off successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to drop off clothes');
    }
  };

  const markReceived = async (id) => {
    if (!confirm('Confirm you have received your clothes?')) return;
    try {
      await axios.put(`http://localhost:3000/api/laundry/receive/${id}`, {}, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const canReceive = (returnDate) => {
     return new Date() >= new Date(returnDate);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <div className="text-gray-500 text-sm mt-1">
            <p>Roll No: <span className="font-medium text-gray-700">{user.rollNumber}</span></p>
            <p className="mt-0.5">{user.hostel} <span className="mx-1">•</span> Room {user.room}</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-500">
          Sign out
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Submit Laundry</h2>
        <form onSubmit={handleDropOff} className="flex gap-4">
          <input 
            type="number" 
            min="1" 
            max="10"
            required 
            placeholder="Number of clothes" 
            value={clothesCount} 
            onChange={e => setClothesCount(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
            <Send size={18} /> Submit
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">My Laundry History</h2>
        {loading ? <p>Loading...</p> : history.length === 0 ? <p className="text-gray-500">No records found.</p> : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="px-4 py-3">Deposit Date</th>
                            <th className="px-4 py-3">Clothes</th>
                            <th className="px-4 py-3">Return Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {history.map(record => (
                            <tr key={record._id}>
                                <td className="px-4 py-3">{new Date(record.depositDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-medium">{record.clothesCount}</td>
                                <td className="px-4 py-3">{new Date(record.returnDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        record.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {record.status === 'RECEIVED' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {record.status === 'PENDING' && (
                                        <button 
                                            onClick={() => markReceived(record._id)}
                                            disabled={!canReceive(record.returnDate)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Mark Received
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}
