const mongoose = require('mongoose');

const laundryRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clothesCount: { type: Number, required: true },
  depositDate: { type: Date, default: Date.now },
  returnDate: { type: Date, required: true },
  receivedDate: { type: Date },
  status: { type: String, enum: ['PENDING', 'RECEIVED'], default: 'PENDING' }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if record is overdue
// Overdue = status is PENDING AND current date > returnDate + 5 days
laundryRecordSchema.virtual('isOverdue').get(function() {
  if (this.status === 'RECEIVED') {
    return false;
  }
  
  const now = new Date();
  const returnDate = new Date(this.returnDate);
  const overdueThreshold = new Date(returnDate);
  overdueThreshold.setDate(overdueThreshold.getDate() + 5);
  
  return now > overdueThreshold;
});

module.exports = mongoose.model('LaundryRecord', laundryRecordSchema);
