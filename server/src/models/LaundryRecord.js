const mongoose = require('mongoose');

const laundryRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clothesCount: { type: Number, required: true },
  depositDate: { type: Date, default: Date.now },
  returnDate: { type: Date, required: true },
  receivedDate: { type: Date },
  status: { type: String, enum: ['PENDING', 'RECEIVED'], default: 'PENDING' }
});

module.exports = mongoose.model('LaundryRecord', laundryRecordSchema);
