const fs = require('fs-extra');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const marked = require('marked');
const TurndownService = require('turndown');
const { JSDOM } = require('jsdom');

class ExportService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.tempDir = process.env.TEMP_DIR || './temp';
    
    // Ensure directories exist
    fs.ensureDirSync(this.uploadDir);
    fs.ensureDirSync(this.tempDir);
  }

  async exportToMarkdown(content, filename) {
    try {
      const filePath = path.join(this.uploadDir, `${filename}.md`);
      await fs.writeFile(filePath, content, 'utf8');
      
      return {
        format: 'markdown',
        url: `/uploads/${filename}.md`,
        filePath: filePath,
        size: fs.statSync(filePath).size
      };
    } catch (error) {
      console.error('Error exporting to Markdown:', error);
      throw new Error('Failed to export to Markdown');
    }
  }

  async exportToPDF(content, filename) {
    try {
      // For now, we'll create a simple HTML file that can be converted to PDF
      // In a production environment, you might want to use a service like wkhtmltopdf
      const htmlContent = this.markdownToHTML(content);
      const htmlPath = path.join(this.uploadDir, `${filename}.html`);
      
      await fs.writeFile(htmlPath, htmlContent, 'utf8');
      
      return {
        format: 'pdf',
        url: `/uploads/${filename}.html`,
        filePath: htmlPath,
        size: fs.statSync(htmlPath).size,
        note: 'HTML file generated. Use browser print to PDF or a PDF service.'
      };
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF');
    }
  }

  async exportToDOCX(content, filename) {
    try {
      const docxPath = path.join(this.uploadDir, `${filename}.docx`);
      
      // Convert markdown to DOCX
      const doc = this.markdownToDOCX(content);
      
      // Save the document
      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(docxPath, buffer);
      
      return {
        format: 'docx',
        url: `/uploads/${filename}.docx`,
        filePath: docxPath,
        size: fs.statSync(docxPath).size
      };
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
      throw new Error('Failed to export to DOCX');
    }
  }

  markdownToHTML(markdown) {
    // Configure marked for better HTML output
    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: true
    });
    
    const html = marked(markdown);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Documentation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
          h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
          h3 { font-size: 1.25em; }
          code {
            background-color: #f6f8fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
          }
          pre {
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
          }
          pre code {
            background-color: transparent;
            padding: 0;
          }
          blockquote {
            border-left: 4px solid #ddd;
            margin: 0;
            padding-left: 1em;
            color: #666;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f6f8fa;
            font-weight: 600;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          a {
            color: #0366d6;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
  }

  markdownToDOCX(markdown) {
    const children = [];
    
    // Split markdown into lines
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let codeBlockContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBlockContent.join('\n'),
                  font: 'Courier New',
                  size: 20
                })
              ],
              spacing: { before: 200, after: 200 }
            })
          );
          inCodeBlock = false;
          codeBlockContent = [];
        } else {
          // Start of code block
          inCodeBlock = true;
        }
        continue;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }
      
      // Handle headers
      if (line.startsWith('# ')) {
        children.push(
          new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          })
        );
      } else if (line.startsWith('## ')) {
        children.push(
          new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 }
          })
        );
      } else if (line.startsWith('### ')) {
        children.push(
          new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 200 }
          })
        );
      } else if (line.startsWith('#### ')) {
        children.push(
          new Paragraph({
            text: line.substring(5),
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 200, after: 200 }
          })
        );
      } else if (line.startsWith('##### ')) {
        children.push(
          new Paragraph({
            text: line.substring(6),
            heading: HeadingLevel.HEADING_5,
            spacing: { before: 200, after: 200 }
          })
        );
      } else if (line.startsWith('###### ')) {
        children.push(
          new Paragraph({
            text: line.substring(7),
            heading: HeadingLevel.HEADING_6,
            spacing: { before: 200, after: 200 }
          })
        );
      } else if (line.startsWith('> ')) {
        // Blockquote
        children.push(
          new Paragraph({
            text: line.substring(2),
            spacing: { before: 200, after: 200 },
            indent: { left: 720 } // 0.5 inch
          })
        );
      } else if (line.trim() === '') {
        // Empty line
        children.push(
          new Paragraph({
            spacing: { before: 200 }
          })
        );
      } else {
        // Regular paragraph
        children.push(
          new Paragraph({
            text: line,
            spacing: { before: 200, after: 200 }
          })
        );
      }
    }
    
    return new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });
  }

  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.uploadDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }

  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      return null;
    }
  }
}

module.exports = new ExportService(); 