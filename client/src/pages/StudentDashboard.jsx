import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  Package, 
  Calendar, 
  LogOut, 
  User,
  History,
  AlertCircle
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [clothesCount, setClothesCount] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/laundry/my-history\`, {
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
        toast.error('Maximum 10 clothes allowed per submission.');
        return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/laundry/dropoff\`, \n        { clothesCount: Number(clothesCount) },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setClothesCount('');
      await fetchHistory();
      toast.success('Clothes dropped off successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to drop off clothes');
    } finally {
        setSubmitting(false);
    }
  };

  const markReceived = async (id) => {
    if (!confirm('Confirm you have received your clothes?')) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/laundry/receive/${id}\`, {}, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Laundry marked as received!');
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const canReceive = (returnDate) => {
     return new Date() >= new Date(returnDate);
  };

  const activeLaundry = history.find(r => r.status === 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Portal</h1>
            <p className="text-gray-500 mt-1">Manage your laundry submissions and pickups</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={logout} 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Card & Action Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-900">
            {/* Profile Info */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 md:col-span-1">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                        {user.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded mt-1">
                            {user.rollNumber}
                        </span>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <User size={16} className="text-gray-400" />
                        <div>
                            <span className="font-medium text-gray-900">{user.hostel}</span>
                            <span className="mx-1 text-gray-400">|</span>
                            Room {user.room}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit / Status Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 md:col-span-2">
                {activeLaundry ? (
                     <div className="h-full flex flex-col justify-center items-center text-center p-4">
                        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                            <Clock size={32} className="text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Laundry in Process</h3>
                        <p className="text-gray-500 max-w-sm mb-6">
                            You have <span className="font-semibold text-gray-900">{activeLaundry.clothesCount} clothes</span> currently being washed.
                            <br/>
                            Expected collection: <span className="font-semibold text-gray-900">{new Date(activeLaundry.returnDate).toLocaleDateString()}</span>
                        </p>
                        
                        {canReceive(activeLaundry.returnDate) ? (
                            <button 
                                onClick={() => markReceived(activeLaundry._id)}
                                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} />
                                Mark as Received
                            </button>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium">
                                <Clock size={16} />
                                Estimated wait: 3 Days
                            </div>
                        )}
                     </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">New Submission</h2>
                            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full border">Max 10 items</span>
                        </div>
                        <form onSubmit={handleDropOff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Clothes</label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="10"
                                        required 
                                        placeholder="e.g. 5" 
                                        value={clothesCount} 
                                        onChange={e => setClothesCount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium text-gray-900"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting || !clothesCount}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-blue-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Submitting...' : (
                                    <>
                                        <Send size={18} /> Submit Laundry
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-center text-gray-400">
                                Submitting confirms you have dropped off your clothes at the counter.
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden text-gray-900">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <History size={20} className="text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900">Submission History</h2>
            </div>
            
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading history...</div>
            ) : history.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <p>No past laundry records found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr className="border-b">
                                <th className="px-6 py-3">Submitted</th>
                                <th className="px-6 py-3">Clothes</th>
                                <th className="px-6 py-3">Expected Return</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {history.map(record => (
                                <tr key={record._id} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-6 py-3 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {new Date(record.depositDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {record.clothesCount} items
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {new Date(record.returnDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                            record.status === 'RECEIVED' 
                                                ? 'bg-green-100 text-green-800 border-green-200' 
                                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }`}>
                                            {record.status === 'RECEIVED' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                                            {record.status === 'RECEIVED' ? 'Collected' : 'Processing'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
