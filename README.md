# Doc Creator - AI-Powered Documentation Generator

An intelligent documentation generator that analyzes GitHub repositories and creates professional documentation using advanced AI models. Built with the MERN stack and OpenRouter API.

## 🚀 Features

- **AI-Powered Generation**: Uses advanced AI models (Claude, GPT, Gemini) to analyze codebases and generate comprehensive documentation
- **GitHub Integration**: Simply paste a GitHub repository URL and let the AI analyze the code structure, README, and dependencies
- **Multiple Export Formats**: Export documentation in Markdown, PDF, or DOCX formats
- **Smart Analysis**: Intelligent code analysis detects frameworks, languages, and project structure
- **Real-time Processing**: Live status updates during document generation
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Database Storage**: MongoDB integration for storing and managing generated documents
- **Search & Filter**: Advanced search and filtering capabilities for documents

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** & **Mongoose** - Database and ODM
- **OpenRouter API** - AI model integration
- **GitHub API** - Repository analysis
- **Puppeteer** - PDF generation
- **Docx** - DOCX file creation
- **Marked** - Markdown processing

### Frontend
- **React** - UI framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Markdown** - Markdown rendering
- **React Syntax Highlighter** - Code highlighting

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- OpenRouter API key
- GitHub token (optional, for private repos)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doc-creator
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create `.env` file in the backend directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/doc-creator

   # OpenRouter API Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

   # GitHub API Configuration (Optional - for private repos)
   GITHUB_TOKEN=your_github_token_here

   # File Storage
   UPLOAD_DIR=./uploads
   TEMP_DIR=./temp

   # Security
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Export Settings
   MAX_FILE_SIZE=50mb
   ALLOWED_FILE_TYPES=md,pdf,docx,txt
   ```

5. **Start the development servers**

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔧 Configuration

### OpenRouter API Setup
1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add the API key to your `.env` file

### GitHub Token (Optional)
For private repositories or higher rate limits:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Add the token to your `.env` file

### MongoDB Setup
- **Local**: Install MongoDB locally and run `mongod`
- **Cloud**: Use MongoDB Atlas or similar cloud service
- Update `MONGODB_URI` in your `.env` file

## 📖 Usage

### 1. Generate Documentation
1. Navigate to the Generator page
2. Paste a GitHub repository URL
3. Configure AI options (model, temperature, style)
4. Click "Generate Documentation"
5. Wait for the AI to analyze and generate documentation

### 2. View and Export
1. View generated documentation in the Documents page
2. Export to Markdown, PDF, or DOCX formats
3. Copy content to clipboard
4. Download files directly

### 3. Manage Documents
- Search and filter documents
- View document history
- Access export history
- Monitor processing status

## 🏗️ Project Structure

```
doc-creator/
├── backend/
│   ├── models/
│   │   └── Document.js          # MongoDB document model
│   ├── routes/
│   │   ├── github.js            # GitHub API routes
│   │   ├── ai.js                # AI generation routes
│   │   ├── docs.js              # Document management routes
│   │   └── export.js            # Export functionality routes
│   ├── services/
│   │   ├── openRouterService.js # OpenRouter AI integration
│   │   ├── githubService.js     # GitHub API integration
│   │   └── exportService.js     # File export services
│   └── index.js                 # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js        # Navigation component
│   │   ├── pages/
│   │   │   ├── Home.js          # Landing page
│   │   │   ├── Generator.js     # Document generation
│   │   │   ├── Documents.js     # Document listing
│   │   │   ├── DocumentView.js  # Individual document view
│   │   │   └── Dashboard.js     # Analytics dashboard
│   │   └── App.js               # Main app component
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### GitHub Routes
- `GET /api/github/repo/:owner/:repo` - Get repository data
- `POST /api/github/analyze` - Analyze repository by URL
- `GET /api/github/files/:owner/:repo` - Get repository files
- `GET /api/github/readme/:owner/:repo` - Get README content

### AI Routes
- `POST /api/ai/generate` - Generate documentation
- `GET /api/ai/models` - Get available AI models
- `POST /api/ai/regenerate/:documentId` - Regenerate documentation
- `GET /api/ai/status/:documentId` - Get generation status

### Document Routes
- `GET /api/docs` - Get all documents
- `GET /api/docs/:id` - Get specific document
- `POST /api/docs` - Create new document
- `PUT /api/docs/:id` - Update document
- `DELETE /api/docs/:id` - Delete document
- `GET /api/docs/stats/overview` - Get document statistics

### Export Routes
- `POST /api/export/:documentId` - Export document
- `POST /api/export/:documentId/multiple` - Export multiple formats
- `GET /api/export/download/:filename` - Download exported file
- `GET /api/export/info/:filename` - Get file information

## 🎨 Customization

### AI Models
The application supports multiple AI models through OpenRouter:
- Claude 3.5 Sonnet (default)
- GPT-4
- Gemini Pro
- And many more

### Export Formats
- **Markdown**: Clean, readable format
- **PDF**: Professional PDF with styling
- **DOCX**: Microsoft Word compatible format

### Styling
The frontend uses Tailwind CSS for styling. Customize the design by modifying:
- `frontend/src/App.css`
- Tailwind configuration
- Component-specific styles

## 🚀 Deployment

### Backend Deployment
1. Set up a production MongoDB instance
2. Configure environment variables for production
3. Deploy to platforms like:
   - Heroku
   - Railway
   - DigitalOcean
   - AWS

### Frontend Deployment
1. Build the production version:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy to platforms like:
   - Vercel
   - Netlify
   - GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for AI model access
- [GitHub API](https://developer.github.com/) for repository data
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [MongoDB](https://www.mongodb.com/) for database

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for developers who want to focus on code, not documentation.** 