import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { 
  Github, 
  Zap, 
  FileText, 
  Download, 
  Settings, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye
} from 'lucide-react';
import axios from 'axios';

// Set the base URL for API calls
const API_BASE_URL = 'http://localhost:5001';

const Generator = () => {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('markdown');
  
  // AI model options
  const [aiOptions, setAiOptions] = useState({
    model: 'anthropic/claude-3.5-sonnet',
    temperature: 0.3,
    maxTokens: 4000,
    style: 'professional'
  });

  // Get available AI models
  const { data: models = [] } = useQuery('aiModels', async () => {
    const response = await axios.get(`${API_BASE_URL}/api/ai/models`);
    return response.data.data || [];
  });

  // Analyze repository
  const analyzeMutation = useMutation(async (url) => {
    const response = await axios.post(`${API_BASE_URL}/api/github/analyze`, { repoUrl: url });
    return response.data.data;
  });

  // Generate documentation
  const generateMutation = useMutation(async ({ repoData, options }) => {
    const response = await axios.post(`${API_BASE_URL}/api/ai/generate`, { repoData, options });
    return response.data.data;
  });

  // Export document
  const exportMutation = useMutation(async ({ documentId, format }) => {
    const response = await axios.post(`${API_BASE_URL}/api/export/${documentId}`, { format });
    return response.data.data;
  });

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    if (!repoUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }

    try {
      toast.loading('Analyzing repository...');
      const repoData = await analyzeMutation.mutateAsync(repoUrl);
      toast.dismiss();
      toast.success('Repository analyzed successfully!');
      
      // Generate documentation
      toast.loading('Generating documentation with AI (Free tier)...');
      const result = await generateMutation.mutateAsync({
        repoData,
        options: aiOptions
      });
      
      toast.dismiss();
      toast.success('Documentation generated successfully!');
      setGeneratedDocument(result.document);
      
    } catch (error) {
      toast.dismiss();
      
      // Handle specific free tier errors
      if (error.message.includes('Free tier limit')) {
        toast.error('Free tier limit reached. Try with a smaller repository or wait for credits to refresh.');
      } else if (error.message.includes('credit limit')) {
        toast.error('Free tier limit reached. Try with a smaller repository.');
      } else {
        toast.error(error.response?.data?.error || error.message || 'An error occurred');
      }
    }
  };

  const handleExport = async (format) => {
    if (!generatedDocument) return;

    try {
      toast.loading(`Exporting to ${format.toUpperCase()}...`);
      const result = await exportMutation.mutateAsync({
        documentId: generatedDocument._id,
        format
      });
      
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

  const viewDocument = () => {
    if (generatedDocument) {
      navigate(`/documents/${generatedDocument._id}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Generate Documentation - Doc Creator</title>
        <meta name="description" content="Generate AI-powered documentation from GitHub repositories" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Generate Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Paste your GitHub repository URL and let our AI create professional documentation for you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Repository URL Input */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Github className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Repository URL</h2>
              </div>
              
              <div className="space-y-4">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isLoading || generateMutation.isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {analyzeMutation.isLoading || generateMutation.isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {analyzeMutation.isLoading ? 'Analyzing...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Generate Documentation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Options */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">AI Options</h2>
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Model
                  </label>
                  <select
                    value={aiOptions.model}
                    onChange={(e) => setAiOptions({ ...aiOptions, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name || model.id}
                      </option>
                    ))}
                  </select>
                </div>

                {showAdvanced && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature: {aiOptions.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={aiOptions.temperature}
                        onChange={(e) => setAiOptions({ ...aiOptions, temperature: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Tokens: {aiOptions.maxTokens}
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="8000"
                        step="500"
                        value={aiOptions.maxTokens}
                        onChange={(e) => setAiOptions({ ...aiOptions, maxTokens: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Style
                      </label>
                      <select
                        value={aiOptions.style}
                        onChange={(e) => setAiOptions({ ...aiOptions, style: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="technical">Technical</option>
                        <option value="beginner-friendly">Beginner Friendly</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {generatedDocument && (
              <>
                {/* Document Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h2 className="text-lg font-semibold text-gray-900">Documentation Generated</h2>
                    </div>
                    <span className="text-sm text-gray-500">
                      {generatedDocument.processingTime / 1000}s
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{generatedDocument.title}</h3>
                      <p className="text-sm text-gray-600">{generatedDocument.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Language: {generatedDocument.metadata?.language || 'Unknown'}</span>
                      <span>•</span>
                      <span>Framework: {generatedDocument.metadata?.framework || 'Unknown'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={viewDocument}
                        className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Document
                      </button>
                      <button
                        onClick={() => copyToClipboard(generatedDocument.content)}
                        className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-700 text-sm font-medium"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Content
                      </button>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <Download className="h-5 w-5 text-gray-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['markdown', 'pdf', 'docx'].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleExport(format)}
                        disabled={exportMutation.isLoading}
                        className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Repository Analysis */}
            {analyzeMutation.data && !generatedDocument && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Github className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Repository Analysis</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {analyzeMutation.data.metadata.repoOwner}/{analyzeMutation.data.metadata.repoName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {analyzeMutation.data.repoInfo?.description || 'No description available'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Language:</span>
                      <span className="ml-2 font-medium">{analyzeMutation.data.metadata.language}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Framework:</span>
                      <span className="ml-2 font-medium">{analyzeMutation.data.metadata.framework}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Files:</span>
                      <span className="ml-2 font-medium">{analyzeMutation.data.metadata.fileCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Has README:</span>
                      <span className="ml-2 font-medium">
                        {analyzeMutation.data.readme ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {analyzeMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <h2 className="text-lg font-semibold text-red-900">Error</h2>
                </div>
                <p className="text-red-700">
                  {analyzeMutation.error.response?.data?.error || analyzeMutation.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Generator; 