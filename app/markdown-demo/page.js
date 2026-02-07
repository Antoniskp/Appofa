'use client';

import { useRef, useState } from 'react';
import MarkdownToolbar from '@/components/MarkdownToolbar';
import MarkdownRenderer from '@/components/MarkdownRenderer';

/**
 * Demo page for the MarkdownToolbar and MarkdownRenderer components
 * Shows both desktop and mobile views with live preview
 */
const DEFAULT_CONTENT = `# Welcome to the Markdown Editor

Try using the toolbar above to format your text!

## Features
- Easy formatting
- Insert links and images
- Add videos from YouTube, Vimeo, or direct URLs

Start typing or select text and click toolbar buttons...`;

export default function MarkdownDemo() {
  const textareaRef = useRef(null);
  const [content, setContent] = useState(DEFAULT_CONTENT);

  const handleInsert = (start, end, text) => {
    // Insert the text at the cursor position
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + text + after;
    setContent(newContent);
    
    // Update textarea value and cursor position
    if (textareaRef.current) {
      textareaRef.current.value = newContent;
      const newCursorPos = start + text.length;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Markdown Toolbar Demo</h1>
          <p className="text-gray-600">
            Try the toolbar on desktop (horizontal layout) and mobile (collapsible menu). 
            Resize your browser to see the responsive behavior!
          </p>
        </div>

        {/* Editor Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Editor</h2>
          </div>
          
          <div className="p-4">
            <MarkdownToolbar 
              onInsert={handleInsert}
              textareaRef={textareaRef}
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] p-4 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
              placeholder="Start typing or use the toolbar to add markdown..."
            />
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
          </div>
          <div className="p-6">
            <MarkdownRenderer content={content} />
          </div>
        </div>

        {/* Markdown Source Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Markdown Source</h2>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-gray-50 p-4 rounded-md overflow-x-auto">
              {content || '(empty)'}
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Desktop (≥640px):</strong> Horizontal toolbar with grouped buttons</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Mobile (&lt;640px):</strong> Collapsible menu with labeled sections and larger touch targets</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Headers:</strong> Click H1, H2, or H3 to insert heading syntax</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Formatting:</strong> Select text and click Bold or Italic to wrap it</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Lists:</strong> Click bullet or numbered list buttons to start a list</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Media:</strong> Click Link, Image, or Video buttons to open dialogs</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>Videos:</strong> Supports YouTube, Vimeo, and direct video URLs</span>
            </li>
          </ul>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Characters</div>
            <div className="text-2xl font-bold text-gray-900">{content.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Words</div>
            <div className="text-2xl font-bold text-gray-900">
              {content.trim() ? content.trim().split(/\s+/).length : 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Lines</div>
            <div className="text-2xl font-bold text-gray-900">
              {content.split('\n').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
