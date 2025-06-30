const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token_no: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  work_type: {
    type: String,
    enum: ['construct', 'repair', 'build'],
    required: true
  },
  requirement: {
    type: String,
    enum: ['high', 'medium', 'light'],
    required: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'Approved', 'Assigned', 'In Progress', 'Completed'],
    default: 'Submitted'
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  default: null
  },
  
approvalBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
},
assignedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',

},
 

account: {
  filled: { type: Boolean, default: false },
  bills: [String], 
  expenses: [
    {
      amount: Number,
      description: String,
    },
  ],
},
billGenerated: { type: Boolean, default: false },



  
estimatedTime: String,
laborRequired: String,
startPhoto: String,
completionPhoto: String,
materialRequest: String,
materialApproved: { type: Boolean, default: false }



}, { timestamps: true });

module.exports = mongoose.model('Work', workSchema);
