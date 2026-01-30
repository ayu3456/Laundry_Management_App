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
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0f172a] p-6 md:p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Student Portal</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your laundry submissions and pickups</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={logout} 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Card & Action Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-900 dark:text-gray-100">
            {/* Profile Info */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-1">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl">
                        {user.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</h2>
                        <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-mono rounded mt-1">
                            {user.rollNumber}
                        </span>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <User size={16} className="text-gray-400" />
                        <div>
                            <span className="font-medium text-gray-900 dark:text-white">{user.hostel}</span>
                            <span className="mx-1 text-gray-400">|</span>
                            Room {user.room}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit / Status Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2">
                {activeLaundry ? (
                     <div className="h-full flex flex-col justify-center items-center text-center p-4">
                        <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/10 rounded-full flex items-center justify-center mb-4">
                            <Clock size={32} className="text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Laundry in Process</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                            You have <span className="font-semibold text-gray-900 dark:text-white">{activeLaundry.clothesCount} clothes</span> currently being washed.
                            <br/>
                            Expected collection: <span className="font-semibold text-gray-900 dark:text-white">{new Date(activeLaundry.returnDate).toLocaleDateString()}</span>
                        </p>
                        
                        {canReceive(activeLaundry.returnDate) ? (
                            <button 
                                onClick={() => markReceived(activeLaundry._id)}
                                className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
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
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Submission</h2>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full border dark:border-gray-600">Max 10 items</span>
                        </div>
                        <form onSubmit={handleDropOff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Number of Clothes</label>
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
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting || !clothesCount}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-blue-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-gray-900 dark:text-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <History size={20} className="text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Submission History</h2>
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
                        <thead className="bg-gray-50/50 dark:bg-gray-900/40 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <tr className="border-b dark:border-gray-700">
                                <th className="px-6 py-4">Submitted</th>
                                <th className="px-6 py-4">Clothes</th>
                                <th className="px-6 py-4">Expected Return</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {history.map(record => (
                                <tr key={record._id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {new Date(record.depositDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {record.clothesCount} items
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {new Date(record.returnDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                            record.status === 'RECEIVED' 
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' 
                                                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800'
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
