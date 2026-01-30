import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
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
  const debounceTimeoutRef = useRef(null);
  
  const debouncedFetchRecords = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchRecords(currentPage);
    }, 500); // 500ms debounce delay
  }, [statusFilter, searchRoll, currentPage]);

  useEffect(() => {
    if (user && user.token) {
        debouncedFetchRecords();
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [statusFilter, searchRoll, currentPage, user, debouncedFetchRecords]);
  
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);


  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setSelectedRecord(null); // Close modal on Escape
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount




  const fetchRecords = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 10, t: Date.now() };
      if (statusFilter) params.status = statusFilter;
      if (searchRoll) params.rollNumber = searchRoll;

      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/laundry/admin/all\`, {
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

        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/laundry/notify\`, \n            { studentId: selectedRecord.studentId?._id, message },
            { headers: { Authorization: `Bearer ${user.token}` } }
        );
        toast.success('Notification sent successfully!');
        setSelectedRecord(null);
    } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 400) {
            toast.error(err.response.data.error);
        } else {
            toast.error('Failed to send notification');
        }
    } finally {
        setIsSending(false);
        fetchRecords(currentPage); // Refresh records after attempting to send email
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-gray-500 mt-1">Overview of laundry operations and student requests</p>
            </div>
            <button 
                onClick={handleRefresh}
                className={`p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-colors ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                title="Refresh Data"
            >
                <RefreshCw size={20} />
            </button>
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

        {/* Filters */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by Roll Number..." 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm"
                    value={searchRoll}
                    onChange={e => setSearchRoll(e.target.value)}
                />
            </div>
            <div className="relative w-full md:w-64">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select 
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all appearance-none text-sm cursor-pointer"
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
                    className="inline-flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors py-2 px-3 rounded-lg hover:bg-red-50"
                >
                    <Trash2 size={14} className="mr-1.5" />
                    Clear Filters
                </button>
            )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clothes</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submit Date</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {records.map(record => {
                            const isOverdue = checkIsOverdue(record);
                            return (
                                <tr 
                                    key={record._id} 
                                    onClick={() => setSelectedRecord(record)}
                                    className="group hover:bg-blue-50/20 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-3 text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {record.studentId?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{record.studentId?.name || 'Unknown'}</div>
                                                <div className="text-gray-500 text-xs">{record.studentId?.rollNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-gray-400" />
                                            {record.clothesCount} items
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" />
                                            {new Date(record.depositDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                            record.status === 'RECEIVED' 
                                                ? 'bg-green-100 text-green-800 border-green-200' 
                                                : isOverdue 
                                                    ? 'bg-red-100 text-red-800 border-red-200'
                                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }`}>
                                            {record.status === 'RECEIVED' ? 'Collected' : isOverdue ? 'Overdue' : 'Processing'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 inline-block" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {isLoading && <div className="p-12 text-center text-gray-400">Loading records...</div>}
                {!isLoading && records.length === 0 && (
                    <div className="p-12 text-center text-gray-500">No records found</div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="text-sm text-gray-500">
                        Page <span className="font-medium text-gray-900">{pagination.page}</span> of <span className="font-medium text-gray-900">{pagination.pages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pagination.pages}
                            className="p-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedRecord(null)} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Details</h3>
                    <button onClick={() => setSelectedRecord(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {selectedRecord.studentId?.name?.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">{selectedRecord.studentId?.name}</h4>
                            <p className="text-sm text-gray-500">Roll No: {selectedRecord.studentId?.rollNumber}</p>
                            <p className="text-sm text-gray-500">Hostel: {selectedRecord.studentId?.hostel}, Room: {selectedRecord.studentId?.room}</p>
                            <p className="text-sm text-gray-500">Email: {selectedRecord.studentId?.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSendEmail}
                        disabled={!checkIsOverdue(selectedRecord) || selectedRecord.status === 'RECEIVED' || isSending}
                        className={`w-full py-3.5 rounded-xl font-bold transition-all ${
                            checkIsOverdue(selectedRecord) && selectedRecord.status !== 'RECEIVED'
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isSending ? 'Sending...' : 'Send Overdue Reminder'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
