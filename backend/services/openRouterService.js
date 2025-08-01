const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }
  }

  async generateDocumentation(repoData, options = {}) {
    const {
      model = 'anthropic/claude-3.5-sonnet',
      temperature = 0.3,
      maxTokens = 4000,
      format = 'markdown',
      style = 'professional'
    } = options;

    const prompt = this.buildDocumentationPrompt(repoData, format, style);
    
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software documentation writer. Generate clear, comprehensive, and professional documentation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'Doc Creator'
        }
      });

      return {
        content: response.data.choices[0].message.content,
        model: model,
        usage: response.data.usage,
        finishReason: response.data.choices[0].finish_reason
      };
    } catch (error) {
      console.error('OpenRouter API Error:', error.response?.data || error.message);
      throw new Error(`AI generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  buildDocumentationPrompt(repoData, format, style) {
    const { files, metadata, readme, packageJson } = repoData;
    
    let prompt = `Generate comprehensive ${style} documentation for this GitHub repository in ${format.toUpperCase()} format.

Repository Information:
- Name: ${metadata.repoName}
- Owner: ${metadata.repoOwner}
- Language: ${metadata.language || 'Unknown'}
- Framework: ${metadata.framework || 'Unknown'}
- Total Files: ${metadata.fileCount || 0}
- Total Lines: ${metadata.totalLines || 0}

${readme ? `README Content:\n${readme}\n` : ''}
${packageJson ? `Package.json:\n${packageJson}\n` : ''}

Key Files Structure:
${this.formatFileStructure(files)}

Please create documentation that includes:

1. **Project Overview**
   - Brief description of what the project does
   - Key features and capabilities
   - Technology stack used

2. **Installation Guide**
   - Prerequisites
   - Step-by-step installation instructions
   - Environment setup

3. **Usage Guide**
   - How to run the project
   - Basic usage examples
   - Configuration options

4. **API Documentation** (if applicable)
   - Available endpoints
   - Request/response formats
   - Authentication methods

5. **Development Guide**
   - How to contribute
   - Development setup
   - Testing instructions

6. **Architecture Overview**
   - Project structure
   - Key components
   - Data flow

7. **Troubleshooting**
   - Common issues and solutions
   - Debugging tips

Please ensure the documentation is:
- Well-structured with clear headings
- Easy to follow for new developers
- Professional and comprehensive
- Include code examples where relevant
- Use proper ${format.toUpperCase()} formatting

Generate the complete documentation now:`;

    return prompt;
  }

  formatFileStructure(files) {
    if (!files || files.length === 0) return 'No files available';
    
    const maxFiles = 50; // Limit to prevent token overflow
    const displayFiles = files.slice(0, maxFiles);
    
    return displayFiles.map(file => {
      const language = this.detectLanguage(file.name);
      const size = file.size ? ` (${this.formatFileSize(file.size)})` : '';
      return `- ${file.name}${size} [${language}]`;
    }).join('\n');
  }

  detectLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'md': 'Markdown',
      'txt': 'Text',
      'sql': 'SQL',
      'sh': 'Shell',
      'bash': 'Bash',
      'dockerfile': 'Docker',
      'docker': 'Docker'
    };
    
    return languageMap[ext] || 'Unknown';
  }

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.data.filter(model => 
        model.id.includes('claude') || 
        model.id.includes('gpt') || 
        model.id.includes('gemini')
      );
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }
}

module.exports = new OpenRouterService(); 