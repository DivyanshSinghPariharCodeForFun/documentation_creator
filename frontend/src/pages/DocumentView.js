import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation } from 'react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Github, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Tag,
  Eye,
  Edit,
  Loader2
} from 'lucide-react';
import axios from 'axios';

// Set the base URL for API calls
const API_BASE_URL = 'http://localhost:5001';

const DocumentView = () => {
  const { id } = useParams();
  const [showRaw, setShowRaw] = useState(false);

  // Fetch document from API
  const { data: document, isLoading, error } = useQuery(
    ['document', id],
    async () => {
      const response = await axios.get(`${API_BASE_URL}/api/docs/${id}`);
      return response.data.data;
    }
  );

  // Export mutation
  const exportMutation = useMutation(async (format) => {
    const response = await axios.post(`${API_BASE_URL}/api/export/${id}`, { format });
    return response.data.data;
  });

  const handleExport = async (format) => {
    try {
      toast.loading(`Exporting to ${format.toUpperCase()}...`);
      const result = await exportMutation.mutateAsync(format);
      
      toast.dismiss();
      toast.success(`${format.toUpperCase()} exported successfully!`);
      
      // Download the file
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}${result.export.url}`;
      link.download = result.export.url.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || 'Export failed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Document</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Document</h2>
          <p className="text-gray-600">{error.message}</p>
          <Link
            to="/documents"
            className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600">The document you're looking for doesn't exist.</p>
          <Link
            to="/documents"
            className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{document.title} - Doc Creator</title>
        <meta name="description" content={document.description} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/documents"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Link>
            
            <div className="flex items-center space-x-2">
              {getStatusIcon(document.status)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
                {document.status}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {document.title}
                </h1>
                <p className="text-gray-600 mb-4">
                  {document.description}
                </p>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {document.githubUrl && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Github className="h-4 w-4" />
                      <span className="truncate">
                        {document.githubUrl.replace('https://github.com/', '')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {document.processingTime > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{document.processingTime / 1000}s processing</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>AI Model: {document.aiModel}</span>
                  </div>
                </div>

                {/* Repository Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Language:</span>
                    <span className="ml-2 font-medium">{document.metadata?.language || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Framework:</span>
                    <span className="ml-2 font-medium">{document.metadata?.framework || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Files:</span>
                    <span className="ml-2 font-medium">{document.metadata?.fileCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Branch:</span>
                    <span className="ml-2 font-medium">{document.metadata?.branch || 'main'}</span>
                  </div>
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {document.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 lg:mt-0 lg:ml-6">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => copyToClipboard(document.content)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Content
                  </button>
                  
                  <div className="flex space-x-2">
                    {['markdown', 'pdf', 'docx'].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleExport(format)}
                        disabled={exportMutation.isLoading}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Toggle */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Documentation Content</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                showRaw 
                  ? 'bg-gray-100 text-gray-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {showRaw ? 'View Rendered' : 'View Raw'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {showRaw ? (
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {document.content}
              </pre>
            </div>
          ) : (
            <div className="p-6 prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: document.content
                  .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                  .replace(/`([^`]+)`/g, '<code>$1</code>')
                  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                  .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
                  .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
                  .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br>')
              }} />
            </div>
          )}
        </div>

        {/* Exports History */}
        {document.exports && document.exports.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export History</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {document.exports.map((exportItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">{exportItem.format.toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(exportItem.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DocumentView; 