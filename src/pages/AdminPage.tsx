import { useState } from 'react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Download } from 'lucide-react';

export const AdminPage = () => {
  const [content, setContent] = useState('# Welcome to Marki Editor\n\nStart typing...');
  
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Editor</h1>
        <button 
          onClick={handleDownload}
          className="flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 transition-colors"
        >
          <Download className="mr-2 h-4 w-4" /> Download Markdown
        </button>
      </div>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <div className="flex flex-col h-full">
          <label className="mb-2 font-medium text-gray-700 dark:text-gray-300">Markdown Source</label>
          <textarea
            className="flex-1 w-full p-4 border border-border rounded-lg bg-surface font-mono text-sm resize-none focus:ring-2 focus:ring-primary outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="flex flex-col h-full overflow-hidden">
          <label className="mb-2 font-medium text-gray-700 dark:text-gray-300">Preview</label>
          <div className="flex-1 overflow-y-auto border border-border rounded-lg p-4 bg-background">
            <MarkdownRenderer content={content} filePath="/admin/preview.md" />
          </div>
        </div>
      </div>
    </div>
  );
};
