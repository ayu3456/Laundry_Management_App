import React, { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function DropOff() {
  const [formData, setFormData] = useState({
    studentName: '',
    rollNumber: '',
    clothesCount: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await axios.post('http://localhost:3000/api/dropoff', {
        ...formData,
        clothesCount: Number(formData.clothesCount)
      });
      setStatus('success');
      setFormData({ studentName: '', rollNumber: '', clothesCount: '' });
      setTimeout(() => setStatus('idle'), 3000); // Reset after 3 seconds
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.error || 'Failed to submit request');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Drop Off Laundry</h2>
          <p className="text-blue-100 mt-1 opacity-90">Enter your details to deposit clothes</p>
        </div>
        
        <div className="p-8">
            {status === 'success' ? (
                <div className="flex flex-col items-center justify-center text-center py-8 animate-fade-in">
                    <div className="bg-green-100 p-3 rounded-full mb-4">
                        <CheckCircle className="text-green-600" size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
                    <p className="text-gray-500">Your clothes have been registered.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {status === 'error' && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start space-x-2">
                            <AlertCircle size={20} className="mt-0.5" />
                            <span className="text-sm font-medium">{errorMessage}</span>
                        </div>
                    )}

                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
                    <input
                        type="text"
                        name="studentName"
                        required
                        value={formData.studentName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-gray-50 focus:bg-white"
                        placeholder="e.g. John Doe"
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Roll Number</label>
                    <input
                        type="text"
                        name="rollNumber"
                        required
                        value={formData.rollNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-gray-50 focus:bg-white"
                        placeholder="e.g. 2023CS101"
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Clothes</label>
                    <input
                        type="number"
                        name="clothesCount"
                        required
                        min="1"
                        value={formData.clothesCount}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-gray-50 focus:bg-white"
                        placeholder="e.g. 5"
                    />
                    </div>

                    <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                    >
                        {status === 'loading' ? (
                             <span className="flex items-center">Processing...</span>
                        ) : (
                            <>
                                <span>Submit Drop Off</span>
                                <Send size={18} />
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}
