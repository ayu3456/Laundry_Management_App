import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Package, Check, Clock, UserCheck, X } from 'lucide-react';

export default function PickupRegister() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [signature, setSignature] = useState('');
  const [collectStatus, setCollectStatus] = useState('idle'); // idle, loading, success

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/records');
      setRecords(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const isReady = (dateString) => {
    const dropOff = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - dropOff);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays >= 3;
  };

  const handleCollectClick = (record) => {
    setSelectedRecord(record);
    setSignature('');
    setCollectStatus('idle');
  };

  const handleConfirmPickup = async () => {
    if (!signature.trim()) return;
    
    setCollectStatus('loading');
    try {
      await axios.put(`http://localhost:3000/api/pickup/${selectedRecord._id}`, {
        signature
      });
      setCollectStatus('success');
      
      // Update local state
      setRecords(records.map(r => 
        r._id === selectedRecord._id 
          ? { ...r, status: 'COLLECTED', pickupDate: new Date().toISOString(), signature } 
          : r
      ));

      setTimeout(() => {
        setSelectedRecord(null);
        setCollectStatus('idle');
      }, 1500);
    } catch (err) {
      console.error(err);
      setCollectStatus('error');
    }
  };

  const filteredRecords = records.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" />
            Laundry Register
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search student or roll no..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-8 text-center text-gray-500">Loading records...</div>
        ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <Package size={48} className="mb-2 opacity-20" />
                <p>No records found</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Student</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Roll No</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Clothes</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Drop Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-800 font-medium">{record.studentName}</td>
                        <td className="px-6 py-4 text-gray-600">{record.rollNumber}</td>
                        <td className="px-6 py-4 text-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {record.clothesCount} items
                            </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                            {new Date(record.dropOffDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                            {record.status === 'COLLECTED' ? (
                                <span className="inline-flex items-center space-x-1 text-green-600 text-sm font-medium">
                                    <Check size={16} />
                                    <span>Collected</span>
                                </span>
                            ) : isReady(record.dropOffDate) ? (
                                <span className="inline-flex items-center space-x-1 text-purple-600 text-sm font-medium bg-purple-50 px-2 py-1 rounded-md">
                                    <Clock size={14} />
                                    <span>Ready</span>
                                </span>
                            ) : (
                                <span className="text-yellow-600 text-sm font-medium bg-yellow-50 px-2 py-1 rounded-md">Processing</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                            {record.status === 'PENDING' && (
                                <button
                                    onClick={() => handleCollectClick(record)}
                                    className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-transform shadow-md hover:scale-105"
                                >
                                    Receive
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

      {/* Signature Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Confirm Pickup</h3>
                    <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    {collectStatus === 'success' ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="text-green-600" size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-800">Collected!</h4>
                            <p className="text-gray-500 mt-2">The laundry has been marked as returned.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Student:</span>
                                    <span className="font-medium text-gray-900">{selectedRecord.studentName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Clothes:</span>
                                    <span className="font-medium text-gray-900">{selectedRecord.clothesCount}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type Name to Sign
                                </label>
                                <div className="relative">
                                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Enter full name"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    By signing, I confirm receipt of my clothes.
                                </p>
                            </div>

                            <button
                                onClick={handleConfirmPickup}
                                disabled={!signature.trim() || collectStatus === 'loading'}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {collectStatus === 'loading' ? 'Processing...' : 'Confirm & Sign'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
