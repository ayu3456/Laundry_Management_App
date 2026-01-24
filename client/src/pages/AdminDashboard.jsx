import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Search, 
  Filter, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Package, 
  Calendar,
  User,
  Mail,
  LogOut,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Trash2
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchRoll, setSearchRoll] = useState('');
  
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.token) {
        fetchRecords(currentPage);
    }
  }, [statusFilter, searchRoll, currentPage, user]);



  const fetchRecords = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 10, t: Date.now() };
      if (statusFilter) params.status = statusFilter;
      if (searchRoll) params.rollNumber = searchRoll;

      const res = await axios.get('http://localhost:3000/api/laundry/admin/all', {
        headers: { Authorization: `Bearer ${user.token}` },
        params
      });
      // Safety check for paginated response
      if (res.data && res.data.records) {
        setRecords(res.data.records);
        setPagination(res.data.pagination);
      } else if (Array.isArray(res.data)) {
        // Fallback if server wasn't restarted and returns old format
        setRecords(res.data);
        setPagination({ page: 1, pages: 1, total: res.data.length });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch records');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRecords(currentPage);
  };

  const handleClearFilters = () => {
      setStatusFilter('');
      setSearchRoll('');
      setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
    }
  };

  const checkIsOverdue = (record) => {
    if (record.status === 'RECEIVED') return false;
    return new Date() > new Date(record.returnDate);
  };

  const handleSendEmail = async () => {
    if (!selectedRecord) return;
    setIsSending(true);
    try {
        const studentName = selectedRecord.studentId?.name || 'Student';
        const message = `Dear ${studentName},\n\nThis is a reminder that your laundry (submitted on ${new Date(selectedRecord.depositDate).toLocaleDateString()}) is now overdue. Please collect it from the laundry facility as soon as possible.\n\nThank you,\nUniversity Laundry Service`;

        await axios.post('http://localhost:3000/api/laundry/notify', 
            { studentId: selectedRecord.studentId?._id, message },
            { headers: { Authorization: `Bearer ${user.token}` } }
        );
        toast.success('Notification sent successfully!');
        setSelectedRecord(null);
    } catch (err) {
        console.error(err);
        toast.error('Failed to send notification');
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Left Side: Header & Controls */}
          <div className="lg:w-1/3 space-y-8 lg:sticky lg:top-12">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg leading-relaxed">
                Overview of laundry operations and student requests. Manage submissions and notifications.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button 
                  onClick={handleRefresh}
                  className={`p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                  title="Refresh Data"
              >
                  <RefreshCw size={24} />
              </button>
              <ThemeToggle />
              <button 
                onClick={logout} 
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none"
              >
                <LogOut size={20} className="mr-2" />
                Sign Out
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search Roll Number..." 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm dark:text-white"
                    value={searchRoll}
                    onChange={e => setSearchRoll(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select 
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-sm dark:text-white cursor-pointer"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="RECEIVED">Received</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="rotate-90 text-gray-400" size={16} />
                </div>
              </div>
              {(statusFilter || searchRoll) && (
                <button 
                    onClick={handleClearFilters}
                    className="w-full py-2 text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 size={14} />
                    Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Table */}
          <div className="lg:w-2/3 w-full">
            <div className="bg-white dark:bg-gray-800/40 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Student</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Clothes</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Submit Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {records.map(record => {
                                const isOverdue = checkIsOverdue(record);
                                return (
                                    <tr 
                                        key={record._id} 
                                        onClick={() => setSelectedRecord(record)}
                                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                    {record.studentId?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{record.studentId?.name || 'Unknown'}</div>
                                                    <div className="text-gray-400 text-xs mt-0.5">{record.studentId?.rollNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
                                                <Package size={16} className="text-gray-300 dark:text-gray-600" />
                                                {record.clothesCount} items
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                                                <Calendar size={16} />
                                                {new Date(record.depositDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                record.status === 'RECEIVED' 
                                                    ? 'bg-green-100 dark:bg-green-900/10 text-green-700 dark:text-green-400' 
                                                    : isOverdue 
                                                        ? 'bg-red-100 dark:bg-red-900/10 text-red-700 dark:text-red-400'
                                                        : 'bg-blue-100 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400'
                                            }`}>
                                                {record.status === 'RECEIVED' ? 'Collected' : isOverdue ? 'Overdue' : 'Processing'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {isLoading && <div className="p-20 text-center text-gray-400 animate-pulse">Fetching records...</div>}
                    {!isLoading && records.length === 0 && (
                        <div className="p-20 text-center">
                            <Package size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-400">No results found</h3>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.pages}
                                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedRecord(null)} />
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 p-8 border border-white/10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRecord.studentId?.name}</h3>
                        <p className="text-gray-400 font-mono text-sm mt-1">{selectedRecord.studentId?.rollNumber}</p>
                    </div>
                    <button onClick={() => setSelectedRecord(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className={`p-5 rounded-2xl border ${
                        selectedRecord.status === 'RECEIVED' ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' :
                        checkIsOverdue(selectedRecord) ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' :
                        'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className="font-bold text-lg dark:text-white">
                                {selectedRecord.status === 'RECEIVED' ? 'Laundry Collected' : 
                                 checkIsOverdue(selectedRecord) ? 'Item Overdue' : 'Work in Progress'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Location</label>
                            <p className="dark:text-white font-medium">{selectedRecord.studentId?.hostel}, {selectedRecord.studentId?.room}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Clothes</label>
                            <p className="dark:text-white font-medium">{selectedRecord.clothesCount} Items</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleSendEmail}
                        disabled={!checkIsOverdue(selectedRecord) || selectedRecord.status === 'RECEIVED' || isSending}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all ${
                            checkIsOverdue(selectedRecord) && selectedRecord.status !== 'RECEIVED'
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-600/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Mail size={20} />
                        {isSending ? 'Sending Notification...' : 'Send Overdue Reminder'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
