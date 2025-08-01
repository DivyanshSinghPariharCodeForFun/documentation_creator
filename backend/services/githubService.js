const axios = require('axios');
const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');

class GitHubService {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN;
    this.baseURL = 'https://api.github.com';
    this.tempDir = process.env.TEMP_DIR || './temp';
    
    // Ensure temp directory exists
    fs.ensureDirSync(this.tempDir);
  }

  async getRepositoryData(repoUrl) {
    try {
      const { owner, repo, branch = 'main' } = this.parseGitHubUrl(repoUrl);
      
      // Get repository information
      const repoInfo = await this.getRepoInfo(owner, repo);
      
      // Get repository files and structure
      const files = await this.getRepoFiles(owner, repo, branch);
      
      // Get README content
      const readme = await this.getReadmeContent(owner, repo, branch);
      
      // Get package.json if exists
      const packageJson = await this.getPackageJson(owner, repo, branch);
      
      // Analyze repository structure
      const metadata = await this.analyzeRepository(owner, repo, files);
      
      return {
        metadata: {
          ...metadata,
          repoName: repo,
          repoOwner: owner,
          branch: branch,
          url: repoUrl
        },
        files,
        readme,
        packageJson,
        repoInfo
      };
    } catch (error) {
      console.error('GitHub service error:', error);
      throw new Error(`Failed to fetch repository data: ${error.message}`);
    }
  }

  parseGitHubUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
    if (!match) {
      throw new Error('Invalid GitHub URL format');
    }
    
    return {
      owner: match[1],
      repo: match[2].replace('.git', ''),
      branch: match[3] || 'main'
    };
  }

  async getRepoInfo(owner, repo) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, {
        headers: this.getHeaders()
      });
      
      return {
        name: response.data.name,
        description: response.data.description,
        language: response.data.language,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        size: response.data.size,
        defaultBranch: response.data.default_branch,
        topics: response.data.topics || [],
        homepage: response.data.homepage,
        license: response.data.license?.name
      };
    } catch (error) {
      console.error('Error fetching repo info:', error.response?.data || error.message);
      throw new Error('Failed to fetch repository information');
    }
  }

  async getRepoFiles(owner, repo, branch) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: this.getHeaders()
      });
      
      if (!response.data.tree) {
        return [];
      }
      
      return response.data.tree
        .filter(item => item.type === 'blob')
        .map(item => ({
          name: item.path,
          size: item.size,
          sha: item.sha,
          url: item.url,
          language: this.detectLanguage(item.path)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching repo files:', error.response?.data || error.message);
      return [];
    }
  }

  async getReadmeContent(owner, repo, branch) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/readme`, {
        headers: this.getHeaders()
      });
      
      // Decode content from base64
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return content;
    } catch (error) {
      console.log('No README found or error fetching README');
      return null;
    }
  }

  async getPackageJson(owner, repo, branch) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contents/package.json?ref=${branch}`, {
        headers: this.getHeaders()
      });
      
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.log('No package.json found or error fetching package.json');
      return null;
    }
  }

  async analyzeRepository(owner, repo, files) {
    const analysis = {
      language: 'Unknown',
      framework: 'Unknown',
      fileCount: files.length,
      totalLines: 0,
      fileTypes: {},
      hasTests: false,
      hasDocs: false,
      hasDocker: false,
      hasCI: false
    };

    // Analyze file types and detect language/framework
    const languageCounts = {};
    const frameworkIndicators = {
      'react': ['package.json', 'jsx', 'tsx'],
      'vue': ['vue.config.js', '.vue'],
      'angular': ['angular.json', 'ng-'],
      'express': ['express', 'app.js', 'server.js'],
      'django': ['manage.py', 'settings.py'],
      'flask': ['app.py', 'flask'],
      'spring': ['pom.xml', 'build.gradle'],
      'laravel': ['artisan', 'composer.json'],
      'rails': ['Gemfile', 'config.ru'],
      'next': ['next.config.js'],
      'nuxt': ['nuxt.config.js'],
      'gatsby': ['gatsby-config.js'],
      'svelte': ['svelte.config.js'],
      'astro': ['astro.config.mjs']
    };

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      const fileName = file.name.toLowerCase();
      
      // Count file types
      analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
      
      // Detect language based on file extensions
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        languageCounts['JavaScript'] = (languageCounts['JavaScript'] || 0) + 1;
      } else if (['.py'].includes(ext)) {
        languageCounts['Python'] = (languageCounts['Python'] || 0) + 1;
      } else if (['.java'].includes(ext)) {
        languageCounts['Java'] = (languageCounts['Java'] || 0) + 1;
      } else if (['.cpp', '.c', '.h', '.hpp'].includes(ext)) {
        languageCounts['C++'] = (languageCounts['C++'] || 0) + 1;
      } else if (['.php'].includes(ext)) {
        languageCounts['PHP'] = (languageCounts['PHP'] || 0) + 1;
      } else if (['.rb'].includes(ext)) {
        languageCounts['Ruby'] = (languageCounts['Ruby'] || 0) + 1;
      } else if (['.go'].includes(ext)) {
        languageCounts['Go'] = (languageCounts['Go'] || 0) + 1;
      } else if (['.rs'].includes(ext)) {
        languageCounts['Rust'] = (languageCounts['Rust'] || 0) + 1;
      } else if (['.swift'].includes(ext)) {
        languageCounts['Swift'] = (languageCounts['Swift'] || 0) + 1;
      } else if (['.kt'].includes(ext)) {
        languageCounts['Kotlin'] = (languageCounts['Kotlin'] || 0) + 1;
      } else if (['.scala'].includes(ext)) {
        languageCounts['Scala'] = (languageCounts['Scala'] || 0) + 1;
      }

      // Check for framework indicators
      for (const [framework, indicators] of Object.entries(frameworkIndicators)) {
        if (indicators.some(indicator => fileName.includes(indicator))) {
          analysis.framework = framework.charAt(0).toUpperCase() + framework.slice(1);
          break;
        }
      }

      // Check for special directories/files
      if (fileName.includes('test') || fileName.includes('spec')) {
        analysis.hasTests = true;
      }
      if (fileName.includes('readme') || fileName.includes('docs') || fileName.includes('documentation')) {
        analysis.hasDocs = true;
      }
      if (fileName.includes('dockerfile') || fileName.includes('docker-compose')) {
        analysis.hasDocker = true;
      }
      if (fileName.includes('.github/workflows') || fileName.includes('.gitlab-ci') || fileName.includes('travis')) {
        analysis.hasCI = true;
      }
    }

    // Determine primary language
    if (Object.keys(languageCounts).length > 0) {
      analysis.language = Object.entries(languageCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
    }

    return analysis;
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
      'bash': 'Bash'
    };
    
    return languageMap[ext] || 'Unknown';
  }

  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Doc-Creator-App'
    };
    
    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }
    
    return headers;
  }

  async cloneRepository(repoUrl, branch = 'main') {
    const repoPath = path.join(this.tempDir, `repo-${Date.now()}`);
    
    try {
      const git = simpleGit();
      await git.clone(repoUrl, repoPath, ['--depth', '1', '--branch', branch]);
      return repoPath;
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw new Error('Failed to clone repository');
    }
  }

  async cleanupTempFiles(repoPath) {
    try {
      if (fs.existsSync(repoPath)) {
        await fs.remove(repoPath);
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

module.exports = new GitHubService(); 