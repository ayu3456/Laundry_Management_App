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

// Virtual for dynamic status
laundryRecordSchema.virtual('calculatedStatus').get(function() {
  if (this.status === 'RECEIVED') {
    return 'RECEIVED';
  }
  
  const now = new Date();
  const returnDate = new Date(this.returnDate);
  const diffTime = Math.abs(now - returnDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  // Logic: If pending and current date > return date + 5 days
  // But wait, the requirement is: "Current date > returnDate + 5 days"
  // Let's implement accurately.
  
  const overdueThreshold = new Date(this.returnDate);
  overdueThreshold.setDate(overdueThreshold.getDate() + 5);
  
  if (now > overdueThreshold) {
    return 'OVERDUE';
  }
  
  return 'PENDING';
});

module.exports = mongoose.model('LaundryRecord', laundryRecordSchema);
