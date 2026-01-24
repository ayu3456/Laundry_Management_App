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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of laundry operations and student requests</p>
            </div>
            <button 
                onClick={handleRefresh}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                title="Refresh Data"
            >
                <RefreshCw size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={logout} 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by Roll Number..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm dark:text-white dark:placeholder-gray-400"
                    value={searchRoll}
                    onChange={e => setSearchRoll(e.target.value)}
                />
            </div>
            <div className="relative w-full md:w-64">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select 
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-sm cursor-pointer dark:text-white"
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
                    className="inline-flex items-center text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                    <Trash2 size={14} className="mr-1.5" />
                    Clear Filters
                </button>
            )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clothes</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submit Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                        {records.map(record => {
                            const isOverdue = checkIsOverdue(record);
                            return (
                                <tr 
                                    key={record._id} 
                                    onClick={() => setSelectedRecord(record)}
                                    className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                                                {record.studentId?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                                    {record.studentId?.name || 'Unknown'}
                                                </div>
                                                <div className="text-gray-500 dark:text-gray-400 text-xs">
                                                    {record.studentId?.rollNumber}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-gray-400" />
                                            {record.clothesCount} items
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" />
                                            {new Date(record.depositDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            record.status === 'RECEIVED' 
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' 
                                                : isOverdue 
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                                                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800'
                                        }`}>
                                            {record.status === 'RECEIVED' && <CheckCircle size={12} className="mr-1.5" />}
                                            {isOverdue && record.status !== 'RECEIVED' && <AlertCircle size={12} className="mr-1.5" />}
                                            {record.status !== 'RECEIVED' && !isOverdue && <Clock size={12} className="mr-1.5" />}
                                            
                                            {record.status === 'RECEIVED' ? 'Collected' : isOverdue ? 'Overdue' : 'Processing'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 inline-block transition-colors" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">Loading records...</div>
                ) : records.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                            <Package size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No records found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-medium text-gray-900 dark:text-white">{((pagination.page - 1) * 10) + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(pagination.page * 10, pagination.total)}</span> of <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span> records
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg border border-gray-200 dark:border-gray-600 transition-all ${
                                currentPage === 1 
                                    ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {[...Array(pagination.pages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                                        currentPage === i + 1
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pagination.pages}
                            className={`p-2 rounded-lg border border-gray-200 transition-all ${
                                currentPage === pagination.pages 
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                            }`}
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
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedRecord(null)}
            />
            
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Laundry Details</h3>
                    <button 
                        onClick={() => setSelectedRecord(null)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                    {/* Student Info Section */}
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {selectedRecord.studentId?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-gray-900">{selectedRecord.studentId?.name}</h4>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-xs font-mono">
                                    {selectedRecord.studentId?.rollNumber}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                                <Mail size={12} /> {selectedRecord.studentId?.email || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Status Banner */}
                    <div className={`p-4 rounded-xl border ${
                        selectedRecord.status === 'RECEIVED' 
                            ? 'bg-green-50 border-green-100' 
                            : checkIsOverdue(selectedRecord) 
                                ? 'bg-red-50 border-red-100'
                                : 'bg-yellow-50 border-yellow-100'
                    }`}>
                        <div className="flex items-center gap-3">
                            {selectedRecord.status === 'RECEIVED' 
                                ? <CheckCircle className="text-green-600" size={24} />
                                : checkIsOverdue(selectedRecord) 
                                    ? <AlertCircle className="text-red-600" size={24} />
                                    : <Clock className="text-yellow-600" size={24} />
                            }
                            <div>
                                <div className={`font-semibold ${
                                    selectedRecord.status === 'RECEIVED' ? 'text-green-900' :
                                    checkIsOverdue(selectedRecord) ? 'text-red-900' : 'text-yellow-900'
                                }`}>
                                    {selectedRecord.status === 'RECEIVED' ? 'Collected' : 
                                     checkIsOverdue(selectedRecord) ? 'Overdue Item' : 'In Progress'}
                                </div>
                                <div className={`text-sm ${
                                    selectedRecord.status === 'RECEIVED' ? 'text-green-700' :
                                    checkIsOverdue(selectedRecord) ? 'text-red-700' : 'text-yellow-700'
                                }`}>
                                    {selectedRecord.status === 'RECEIVED'
                                        ? `Collected on ${new Date(selectedRecord.receivedDate || selectedRecord.updatedAt).toLocaleDateString()}`
                                        : checkIsOverdue(selectedRecord) 
                                            ? `Was expected by ${new Date(selectedRecord.returnDate).toLocaleDateString()}`
                                            : `Expected by ${new Date(selectedRecord.returnDate).toLocaleDateString()}`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Submitted On</label>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                {new Date(selectedRecord.depositDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Expected Return</label>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                {new Date(selectedRecord.returnDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Clothes Count</label>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <Package size={14} className="text-gray-400" />
                                {selectedRecord.clothesCount} items
                            </div>
                        </div>
                        <div className="p-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Location</label>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <User size={14} className="text-gray-400" />
                                {selectedRecord.studentId?.hostel} - {selectedRecord.studentId?.room}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        onClick={() => setSelectedRecord(null)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                    <button 
                        onClick={handleSendEmail}
                        disabled={!checkIsOverdue(selectedRecord) || selectedRecord.status === 'RECEIVED' || isSending}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all ${
                            checkIsOverdue(selectedRecord) && selectedRecord.status !== 'RECEIVED'
                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                            checkIsOverdue(selectedRecord) && selectedRecord.status !== 'RECEIVED'
                            ? "Send email notification to student"
                            : "Only available for overdue items"
                        }
                    >
                        <Mail size={16} />
                        {isSending ? 'Sending...' : 'Send Overdue Email'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
    </div>
  );
}
