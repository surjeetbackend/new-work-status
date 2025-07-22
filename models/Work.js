const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token_no: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  contact_name:{type:String, required: true},
  contact_phone:{type: String, required:true},
  work_type: {
    type: String,
    enum: ['Electrical', 'Civil', 'Fabrication', 'Other'],
    required: true,
     set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() // auto-format
  },
  requirement: {
    type: String,
    enum: ['high', 'medium', 'light'],
    required: true
  },
  
  sheetLink: {
  type: String,
  default: ''
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
materialRequests: [
  {
    item: { type: String, required: true },
    quantity: { type: String, required: true },
    requiredDate: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    approved: { type: Boolean, default: false },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }
],


  billGenerated: { type: Boolean, default: false },
approvedAt: { type: Date },
completedAt: { type: Date },


 startedAt: Date,     
  completedAt: Date, 
  estimatedTime: String,
  laborRequired: String,
  startPhoto: String,
  completionPhoto: String,
  
  

  

}, { timestamps: true });

module.exports = mongoose.model('Work', workSchema);
