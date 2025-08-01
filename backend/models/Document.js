const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  githubUrl: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: ['markdown', 'pdf', 'docx'],
    default: 'markdown'
  },
  metadata: {
    repoName: String,
    repoOwner: String,
    branch: String,
    commitHash: String,
    language: String,
    framework: String,
    fileCount: Number,
    totalLines: Number
  },
  aiModel: {
    type: String,
    default: 'openrouter'
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  exports: [{
    format: {
      type: String,
      enum: ['markdown', 'pdf', 'docx']
    },
    url: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    default: 'anonymous'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
documentSchema.index({ githubUrl: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ 'metadata.repoName': 1, 'metadata.repoOwner': 1 });

// Virtual for formatted creation date
documentSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for processing time in seconds
documentSchema.virtual('processingTimeSeconds').get(function() {
  return (this.processingTime / 1000).toFixed(2);
});

module.exports = mongoose.model('Document', documentSchema); 