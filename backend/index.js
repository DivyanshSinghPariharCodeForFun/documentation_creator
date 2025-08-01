const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5001; // Force port 5001

// Security middleware
app.use(helmet());

// CORS configuration - allow both ports for development
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// MongoDB Connection (optional)
let Document = null;
let isMongoConnected = false;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    isMongoConnected = true;
    
    // Document Schema
    const documentSchema = new mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String },
      githubUrl: { type: String },
      content: { type: String, required: true },
      format: { type: String, default: 'markdown' },
      metadata: { type: Object },
      aiModel: { type: String },
      status: { type: String, default: 'completed' },
      processingTime: { type: Number },
      exports: [{ 
        format: String, 
        url: String, 
        filePath: String, 
        size: Number, 
        createdAt: { type: Date, default: Date.now } 
      }],
      tags: [String],
      isPublic: { type: Boolean, default: true },
      createdBy: { type: String },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    Document = mongoose.model('Document', documentSchema);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Continuing without MongoDB - using in-memory storage');
    isMongoConnected = false;
  });
} else {
  console.log('⚠️ No MongoDB URI provided - using in-memory storage');
}

// In-memory storage fallback
let inMemoryDocuments = [];
let documentCounter = 1;

// OpenRouter API Service
class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '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';
    this.baseURL = 'https://openrouter.ai/api/v1';
  }

  async generateDocumentation(repoData, options = {}) {
    try {
      const prompt = this.buildDocumentationPrompt(repoData, options);
      
      // Use the most reliable models in order of preference
      const reliableModels = [
        'openai/gpt-3.5-turbo',
        'google/gemini-pro',
        'anthropic/claude-3-haiku',
        'meta-llama/llama-3.1-8b-instruct'
      ];
      
      let selectedModel = 'openai/gpt-3.5-turbo'; // Default
      
      // If a specific model is requested and it's reliable, use it
      if (options.model && reliableModels.includes(options.model)) {
        selectedModel = options.model;
      }
      
      // Add timeout and retry logic
      const axiosConfig = {
        timeout: 30000, // 30 second timeout
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical writer. Generate comprehensive documentation for software projects. Keep responses under 2000 tokens.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: Math.min(options.maxTokens || 800, 800) // Reduced for free tier
      }, axiosConfig);

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
        finishReason: response.data.choices[0].finish_reason
      };
    } catch (error) {
      console.error('OpenRouter API error:', error.response?.data || error.message);
      
      // Handle specific error types
      if (error.response?.data?.error?.code === 402) {
        throw new Error('Free tier limit reached. Try with a smaller repository or wait for credits to refresh.');
      }
      
      if (error.response?.data?.error?.code === 408 || error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again in a moment.');
      }
      
      if (error.response?.data?.error?.code === 400) {
        throw new Error('Invalid request. Please check your input and try again.');
      }
      
      throw new Error('Failed to generate documentation with AI. Please try again.');
    }
  }

  buildDocumentationPrompt(repoData, options) {
    const { metadata, files, readme, packageJson } = repoData;
    
    let prompt = `Generate comprehensive documentation for: ${metadata.repoName}\n\n`;
    prompt += `Project: ${metadata.repoOwner}/${metadata.repoName}\n`;
    prompt += `Language: ${metadata.language}\n`;
    prompt += `Framework: ${metadata.framework}\n`;
    prompt += `Files: ${metadata.fileCount}\n\n`;

    // Add key project info
    if (readme) {
      prompt += `README:\n${readme.substring(0, 800)}\n\n`;
    }

    if (packageJson) {
      prompt += `Package Info:\n`;
      prompt += `Name: ${packageJson.name}\n`;
      prompt += `Description: ${packageJson.description}\n`;
      if (packageJson.scripts) {
        prompt += `Scripts: ${Object.keys(packageJson.scripts).join(', ')}\n`;
      }
      if (packageJson.dependencies) {
        prompt += `Dependencies: ${Object.keys(packageJson.dependencies).slice(0, 10).join(', ')}\n`;
      }
      prompt += `\n`;
    }

    if (files && files.length > 0) {
      prompt += `Key Files:\n${files.slice(0, 8).map(f => `- ${f.name}`).join('\n')}\n\n`;
    }

    prompt += `Generate detailed documentation including:\n`;
    prompt += `1. Project overview and purpose\n`;
    prompt += `2. Installation and setup instructions\n`;
    prompt += `3. Usage guide with examples\n`;
    prompt += `4. Architecture and key components\n`;
    prompt += `5. Development and contribution guidelines\n`;
    prompt += `6. Deployment instructions\n`;
    prompt += `7. Troubleshooting section\n\n`;
    prompt += `Make it comprehensive, professional, and project-specific. Include code examples and configuration details. Format in Markdown.`;

    return prompt;
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      // Filter to free tier friendly models
      const freeTierModels = response.data.data.filter(model => 
        model.id.includes('deepseek') ||
        model.id.includes('gemini') ||
        model.id.includes('llama') ||
        model.id.includes('phi') ||
        model.id.includes('mistral')
      ).slice(0, 8); // Limit to 8 models
      
      return freeTierModels;
    } catch (error) {
      console.error('Error fetching models:', error);
      // Return default free models if API fails
      return [
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Free)' },
        { id: 'google/gemini-pro', name: 'Gemini Pro (Free)' },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (Free)' },
        { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 (Free)' }
      ];
    }
  }
}

const openRouterService = new OpenRouterService();

// GitHub Service
class GitHubService {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN;
    this.baseURL = 'https://api.github.com';
  }

  async analyzeRepository(repoUrl) {
    try {
      const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid GitHub URL');
      }

      const [_, owner, repo] = urlMatch;
      
      // Fetch real repository data from GitHub API
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Doc-Creator-App'
      };

      // Only add authorization if token is properly configured
      if (this.githubToken && this.githubToken !== 'your_github_token_here' && this.githubToken.trim() !== '') {
        headers['Authorization'] = `token ${this.githubToken}`;
      }

      // Get repository information
      const repoResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, { headers });
      const repoData = repoResponse.data;

      // Get repository contents
      const contentsResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contents`, { headers });
      const contents = contentsResponse.data;

      // Get README if it exists
      let readme = '';
      try {
        const readmeResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/readme`, { headers });
        readme = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
      } catch (error) {
        console.log('No README found for this repository');
      }

      // Get package.json if it exists
      let packageJson = null;
      try {
        const packageResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contents/package.json`, { headers });
        const packageContent = Buffer.from(packageResponse.data.content, 'base64').toString('utf-8');
        packageJson = JSON.parse(packageContent);
      } catch (error) {
        console.log('No package.json found for this repository');
      }

      // Analyze files and structure
      const files = [];
      const fileTypes = {};
      
      for (const item of contents) {
        if (item.type === 'file') {
          const ext = item.name.split('.').pop() || 'no-extension';
          if (!fileTypes[ext]) fileTypes[ext] = [];
          fileTypes[ext].push(item.name);
          
          files.push({
            name: item.name,
            size: item.size,
            language: this.getLanguageFromExtension(ext),
            path: item.path,
            url: item.html_url
          });
        }
      }

      // Determine main language and framework
      const language = repoData.language || 'Unknown';
      const framework = this.detectFramework(packageJson, files);

      return {
        metadata: {
          repoName: repoData.name,
          repoOwner: repoData.owner.login,
          branch: repoData.default_branch,
          url: repoData.html_url,
          language: language,
          framework: framework,
          fileCount: files.length,
          totalLines: repoData.size || 0,
          description: repoData.description || '',
          topics: repoData.topics || [],
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          lastUpdated: repoData.updated_at,
          createdAt: repoData.created_at,
          homepage: repoData.homepage,
          license: repoData.license?.name
        },
        files: files,
        readme: readme,
        packageJson: packageJson,
        repoInfo: {
          name: repoData.name,
          description: repoData.description,
          language: repoData.language,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          issues: repoData.open_issues_count,
          pullRequests: 0, // Would need additional API call
          lastCommit: repoData.updated_at,
          topics: repoData.topics
        },
        analysis: {
          projectType: this.detectProjectType(packageJson, files, language),
          architecture: this.detectArchitecture(packageJson, files),
          mainFeatures: this.extractFeatures(readme, packageJson),
          keyComponents: this.identifyComponents(files),
          dependencies: packageJson ? {
            dependencies: packageJson.dependencies || {},
            devDependencies: packageJson.devDependencies || {},
            scripts: packageJson.scripts || {}
          } : null,
          fileStructure: this.analyzeFileStructure(files)
        }
      };
    } catch (error) {
      console.error('GitHub analysis error:', error);
      if (error.response?.status === 404) {
        throw new Error('Repository not found. Please check the URL and ensure the repository is public.');
      } else if (error.response?.status === 403) {
        throw new Error('Rate limit exceeded. Please try again later or add a GitHub token.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your GitHub token or try with a public repository.');
      }
      throw new Error('Failed to analyze repository. Please check the URL and try again.');
    }
  }

  getLanguageFromExtension(ext) {
    const languageMap = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React',
      'tsx': 'React TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'go': 'Go',
      'rs': 'Rust',
      'php': 'PHP',
      'rb': 'Ruby',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'md': 'Markdown',
      'yml': 'YAML',
      'yaml': 'YAML',
      'xml': 'XML',
      'sql': 'SQL',
      'sh': 'Shell',
      'ps1': 'PowerShell'
    };
    return languageMap[ext] || 'Unknown';
  }

  detectFramework(packageJson, files) {
    if (!packageJson) return 'Unknown';
    
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (dependencies.react) return 'React';
    if (dependencies.vue) return 'Vue.js';
    if (dependencies.angular) return 'Angular';
    if (dependencies.express) return 'Express.js';
    if (dependencies.next) return 'Next.js';
    if (dependencies.nuxt) return 'Nuxt.js';
    if (dependencies.gatsby) return 'Gatsby';
    if (dependencies.django) return 'Django';
    if (dependencies.flask) return 'Flask';
    if (dependencies.fastapi) return 'FastAPI';
    if (dependencies.spring) return 'Spring Boot';
    if (dependencies.laravel) return 'Laravel';
    if (dependencies.symfony) return 'Symfony';
    
    return 'Unknown';
  }

  detectProjectType(packageJson, files, language) {
    if (packageJson?.dependencies?.react || files.some(f => f.name.includes('App.js'))) {
      return 'React Application';
    }
    if (packageJson?.dependencies?.express) {
      return 'Node.js Backend';
    }
    if (language === 'Python' && files.some(f => f.name.includes('requirements.txt'))) {
      return 'Python Application';
    }
    if (language === 'Java' && files.some(f => f.name.includes('pom.xml'))) {
      return 'Java Application';
    }
    return 'Web Application';
  }

  detectArchitecture(packageJson, files) {
    if (packageJson?.dependencies?.react && packageJson?.dependencies?.express) {
      return 'Full-stack (React + Express)';
    }
    if (packageJson?.dependencies?.react) {
      return 'Frontend (React)';
    }
    if (packageJson?.dependencies?.express) {
      return 'Backend (Express)';
    }
    return 'Unknown';
  }

  extractFeatures(readme, packageJson) {
    const features = [];
    
    if (readme) {
      // Extract features from README
      const lines = readme.split('\n');
      for (const line of lines) {
        if (line.includes('✅') || line.includes('✓') || line.includes('•')) {
          features.push(line.trim());
        }
      }
    }
    
    if (packageJson?.description) {
      features.push(packageJson.description);
    }
    
    return features.length > 0 ? features : ['Documentation generator'];
  }

  identifyComponents(files) {
    const components = [];
    
    for (const file of files) {
      if (file.name.includes('App.js') || file.name.includes('App.tsx')) {
        components.push('Main Application Component');
      }
      if (file.name.includes('index.js') || file.name.includes('main.js')) {
        components.push('Entry Point');
      }
      if (file.name.includes('package.json')) {
        components.push('Package Configuration');
      }
      if (file.name.includes('README')) {
        components.push('Documentation');
      }
    }
    
    return components.length > 0 ? components : ['Core Application'];
  }

  analyzeFileStructure(files) {
    const structure = {};
    
    for (const file of files) {
      const path = file.path.split('/');
      const dir = path.length > 1 ? path[0] : 'root';
      
      if (!structure[dir]) {
        structure[dir] = [];
      }
      structure[dir].push(file.name);
    }
    
    return structure;
  }
}

const githubService = new GitHubService();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    openrouter: process.env.OPENROUTER_API_KEY ? 'Configured' : 'Not configured',
    mongodb: isMongoConnected ? 'Connected' : 'Disconnected',
    storage: isMongoConnected ? 'MongoDB' : 'In-Memory'
  });
});

// Real AI generation endpoint
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { repoData, options = {} } = req.body;
    
    const startTime = Date.now();
    
    // Generate documentation using OpenRouter API
    const aiResult = await openRouterService.generateDocumentation(repoData, options);
    
    const processingTime = Date.now() - startTime;
    
    // Create document object
    const documentData = {
      title: `${repoData?.metadata?.repoName || 'Repository'} Documentation`,
      description: `AI-generated documentation for ${repoData?.metadata?.repoName || 'repository'}`,
      githubUrl: repoData?.metadata?.url,
      content: aiResult.content,
      metadata: repoData?.metadata || {},
      aiModel: aiResult.model,
      status: 'completed',
      processingTime,
      tags: [repoData?.metadata?.language, repoData?.metadata?.framework].filter(Boolean),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    let savedDocument;
    
    if (isMongoConnected && Document) {
      // Save to MongoDB
      const document = new Document(documentData);
      savedDocument = await document.save();
    } else {
      // Save to in-memory storage
      savedDocument = {
        _id: `mem_${documentCounter++}`,
        ...documentData
      };
      inMemoryDocuments.push(savedDocument);
    }
    
    res.json({
      success: true,
      data: {
        document: savedDocument,
        aiResult
      }
    });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real GitHub analysis endpoint
app.post('/api/github/analyze', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    const repoData = await githubService.analyzeRepository(repoUrl);
    
    res.json({
      success: true,
      data: repoData
    });
  } catch (error) {
    console.error('GitHub analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real AI models endpoint
app.get('/api/ai/models', async (req, res) => {
  try {
    const models = await openRouterService.getAvailableModels();
    
    // Filter to popular models
    const popularModels = models.filter(model => 
      model.id.includes('claude') || 
      model.id.includes('gpt') || 
      model.id.includes('gemini')
    ).slice(0, 10);
    
    res.json({
      success: true,
      data: popularModels
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real export endpoint
app.post('/api/export/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { format = 'markdown' } = req.body;
    
    let document;
    
    if (isMongoConnected && Document) {
      document = await Document.findById(documentId);
    } else {
      document = inMemoryDocuments.find(doc => doc._id === documentId);
    }
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const filename = `doc-${documentId}-${Date.now()}`;
    const exportData = {
      format: format,
      url: `/uploads/${filename}.${format}`,
      filePath: `./uploads/${filename}.${format}`,
      size: document.content.length,
      createdAt: new Date()
    };
    
    // Add export to document
    if (!document.exports) {
      document.exports = [];
    }
    document.exports.push(exportData);
    
    if (isMongoConnected && Document) {
      await document.save();
    }
    
    res.json({
      success: true,
      data: {
        export: exportData,
        document
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all documents
app.get('/api/docs', async (req, res) => {
  try {
    const { page = 1, limit = 12, search, status } = req.query;
    const skip = (page - 1) * limit;
    
    let documents = [];
    let total = 0;
    
    if (isMongoConnected && Document) {
      // Use MongoDB
      let query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) {
        query.status = status;
      }
      
      documents = await Document.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      total = await Document.countDocuments(query);
    } else {
      // Use in-memory storage
      documents = inMemoryDocuments
        .filter(doc => {
          if (search) {
            return doc.title.toLowerCase().includes(search.toLowerCase()) ||
                   doc.description.toLowerCase().includes(search.toLowerCase());
          }
          if (status) {
            return doc.status === status;
          }
          return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + parseInt(limit));
      
      total = inMemoryDocuments.length;
    }
    
    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalDocuments: total,
          hasNextPage: skip + documents.length < total,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get document by ID
app.get('/api/docs/:id', async (req, res) => {
  try {
    let document;
    
    if (isMongoConnected && Document) {
      document = await Document.findById(req.params.id);
    } else {
      document = inMemoryDocuments.find(doc => doc._id === req.params.id);
    }
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 OpenRouter API: ${process.env.OPENROUTER_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🗄️ MongoDB URI: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📊 Storage: ${isMongoConnected ? '✅ MongoDB' : '⚠️ In-Memory'}`);
  console.log(`🔗 CORS enabled for: localhost:3000, localhost:3001`);
});
