import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Filter } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchRoll, setSearchRoll] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, searchRoll]);

  const fetchRecords = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchRoll) params.rollNumber = searchRoll;

      const res = await axios.get('http://localhost:3000/api/laundry/admin/all', {
        headers: { Authorization: `Bearer ${user.token}` },
        params
      });
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage all student laundry records</p>
        </div>
        <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-500">
          Sign out
        </button>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search by Roll Number..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={searchRoll}
                onChange={e => setSearchRoll(e.target.value)}
            />
        </div>
        <div className="relative w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
            >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="RECEIVED">Received</option>
            </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clothes</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {records.map(record => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{record.studentId?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{record.studentId?.rollNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                            {record.studentId?.hostel} - {record.studentId?.room}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {record.clothesCount}
                        </td>
                         <td className="px-6 py-4 text-sm text-gray-500">
                            <div>In: {new Date(record.depositDate).toLocaleDateString()}</div>
                            <div>Out: {new Date(record.returnDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {record.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {records.length === 0 && <div className="p-8 text-center text-gray-500">No records found.</div>}
      </div>
    </div>
  );
}
