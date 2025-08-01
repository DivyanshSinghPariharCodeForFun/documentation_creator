import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  BookOpen, 
  FileText, 
  Download, 
  Zap, 
  Github, 
  Code, 
  Users, 
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Generation',
      description: 'Advanced AI models analyze your codebase and generate comprehensive, professional documentation automatically.'
    },
    {
      icon: Github,
      title: 'GitHub Integration',
      description: 'Simply paste a GitHub repository URL and let our AI analyze the code structure, README, and dependencies.'
    },
    {
      icon: FileText,
      title: 'Multiple Formats',
      description: 'Export your documentation in Markdown, PDF, or DOCX formats for easy sharing and collaboration.'
    },
    {
      icon: Code,
      title: 'Smart Analysis',
      description: 'Intelligent code analysis detects frameworks, languages, and project structure for accurate documentation.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Perfect for teams, open-source maintainers, and developers who need quick, professional documentation.'
    },
    {
      icon: Clock,
      title: 'Time Saving',
      description: 'Save hours of manual documentation work with our automated, AI-powered generation process.'
    }
  ];

  const benefits = [
    'Automated code analysis and documentation generation',
    'Support for multiple programming languages and frameworks',
    'Professional, well-structured documentation output',
    'Export to Markdown, PDF, and DOCX formats',
    'GitHub repository integration',
    'Real-time processing and status updates',
    'Clean, modern user interface',
    'No manual setup or configuration required'
  ];

  return (
    <>
      <Helmet>
        <title>Doc Creator - AI-Powered Documentation Generator</title>
        <meta name="description" content="Generate professional documentation from GitHub repositories using AI. Export to Markdown, PDF, or DOCX formats." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI-Powered
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Documentation Generator
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Transform your GitHub repositories into professional documentation in seconds. 
              Powered by advanced AI models for accurate, comprehensive results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/generator"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Start Generating
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link
                to="/documents"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2" />
                View Documents
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create professional documentation from your codebase
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-center h-12 w-12 bg-blue-600 rounded-lg mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to generate professional documentation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 bg-blue-600 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Paste GitHub URL
              </h3>
              <p className="text-gray-600">
                Simply paste your GitHub repository URL into our generator
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 bg-purple-600 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Analysis
              </h3>
              <p className="text-gray-600">
                Our AI analyzes your codebase, README, and project structure
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 bg-green-600 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Export & Share
              </h3>
              <p className="text-gray-600">
                Download your documentation in Markdown, PDF, or DOCX format
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Doc Creator?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Save time and create professional documentation that helps your team and community understand your codebase better.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Link
                  to="/generator"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Github className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">GitHub Integration</h3>
                    <p className="text-gray-600">Direct repository analysis</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Multiple Formats</h3>
                    <p className="text-gray-600">Markdown, PDF, DOCX export</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Download className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Instant Download</h3>
                    <p className="text-gray-600">Ready-to-use documentation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Documentation?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of developers who are already saving time with AI-powered documentation generation.
          </p>
          <Link
            to="/generator"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            Start Generating Documentation
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home; 