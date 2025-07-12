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
    enum: ['open', 'Approved', 'Assigned', 'In Progress', 'Completed', 'Rejected'],
    default: 'open'
  },

  approvalStatus: {
    type: String,
    enum: ['open', 'Approved', 'Rejected'],
    default: 'open'
  },

  assigned_to: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  approvalBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

 
  assignmentHistory: [
    {
      supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assignedOn: Date,
      unassignedOn: Date
    }
  ],

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
supervisor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
history: [
  {
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedOn: Date,
    unassignedOn: Date,
  }
  
],

  billGenerated: { type: Boolean, default: false },
approvedAt: { type: Date },
completedAt: { type: Date },


 startedAt: Date,     // new field: when work started
  completedAt: Date,
  estimatedTime: String,
  laborRequired: String,
  startPhoto: String,
  completionPhoto: String,
  materialRequest: String,
  materialApproved: { type: Boolean, default: false }
  

}, { timestamps: true });

module.exports = mongoose.model('Work', workSchema);
