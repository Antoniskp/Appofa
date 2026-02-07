'use client';

import { useState } from 'react';
import {
  Bars3Icon,
  XMarkIcon,
  LinkIcon,
  PhotoIcon,
  VideoCameraIcon,
  ListBulletIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline';

/**
 * Markdown toolbar component with desktop and mobile views
 * Provides buttons to insert markdown syntax at cursor position
 * 
 * @param {function} onInsert - Callback (start, end, text) => void
 * @param {React.RefObject} textareaRef - Reference to the textarea element
 */
export default function MarkdownToolbar({ onInsert, textareaRef }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [linkDialog, setLinkDialog] = useState({ open: false, url: '', text: '' });
  const [imageDialog, setImageDialog] = useState({ open: false, url: '', alt: '' });
  const [videoDialog, setVideoDialog] = useState({ open: false, url: '' });

  // Insert markdown at cursor position
  const insertMarkdown = (before, after = '', placeholder = '') => {
    if (!textareaRef?.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const text = selectedText || placeholder;

    // Call the onInsert callback with positions and new text
    onInsert(start, end, before + text + after);

    // Close mobile menu after insertion
    setIsMenuOpen(false);

    // Set cursor position after inserted content
    setTimeout(() => {
      const newPosition = selectedText 
        ? start + before.length + text.length + after.length
        : start + before.length;
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Sanitize video ID (only allow alphanumeric, hyphens, underscores)
  const sanitizeVideoId = (id) => {
    return id.replace(/[^a-zA-Z0-9_-]/g, '');
  };

  // Validate and sanitize URL
  const isValidUrl = (urlString) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  // Get video file type from URL
  const getVideoType = (url) => {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    const typeMap = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'mov': 'video/quicktime'
    };
    return typeMap[extension] || 'video/mp4';
  };

  // Handle link insertion
  const handleLinkInsert = () => {
    if (!linkDialog.url || !isValidUrl(linkDialog.url)) return;
    const text = linkDialog.text || linkDialog.url;
    insertMarkdown(`[${text}](${linkDialog.url})`);
    setLinkDialog({ open: false, url: '', text: '' });
  };

  // Handle image insertion
  const handleImageInsert = () => {
    if (!imageDialog.url || !isValidUrl(imageDialog.url)) return;
    const alt = imageDialog.alt || 'image';
    insertMarkdown(`![${alt}](${imageDialog.url})`);
    setImageDialog({ open: false, url: '', alt: '' });
  };

  // Handle video insertion
  const handleVideoInsert = () => {
    if (!videoDialog.url || !isValidUrl(videoDialog.url)) return;
    let videoMarkdown = '';

    try {
      // YouTube
      if (videoDialog.url.includes('youtube.com') || videoDialog.url.includes('youtu.be')) {
        let videoId = '';
        if (videoDialog.url.includes('youtu.be/')) {
          videoId = videoDialog.url.split('youtu.be/')[1].split(/[?#]/)[0];
        } else if (videoDialog.url.includes('youtube.com')) {
          const urlParams = new URLSearchParams(new URL(videoDialog.url).search);
          videoId = urlParams.get('v') || '';
        }
        videoId = sanitizeVideoId(videoId);
        if (!videoId) return;
        videoMarkdown = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" style="border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      }
      // Vimeo
      else if (videoDialog.url.includes('vimeo.com')) {
        let videoId = videoDialog.url.split('vimeo.com/')[1].split(/[?#]/)[0];
        videoId = sanitizeVideoId(videoId);
        if (!videoId) return;
        videoMarkdown = `<iframe width="100%" height="400" src="https://player.vimeo.com/video/${videoId}" style="border:0;" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      }
      // Direct video URL
      else {
        const videoType = getVideoType(videoDialog.url);
        videoMarkdown = `<video width="100%" controls><source src="${videoDialog.url}" type="${videoType}">Your browser does not support the video tag.</video>`;
      }

      insertMarkdown(videoMarkdown);
      setVideoDialog({ open: false, url: '' });
    } catch (error) {
      console.error('Error processing video URL:', error);
      // Could show user feedback here
    }
  };

  // Toolbar button component
  const ToolbarButton = ({ onClick, children, label, className = '' }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {children}
    </button>
  );

  // Mobile button with larger touch target
  const MobileButton = ({ onClick, children, label }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </button>
  );

  // Separator component
  const Separator = () => <div className="w-px h-6 bg-gray-300" />;

  return (
    <>
      {/* Desktop Toolbar */}
      <div className="hidden sm:flex items-center gap-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-t-md border-b-0">
        {/* Headers Group */}
        <ToolbarButton
          onClick={() => insertMarkdown('# ', '', 'Heading 1')}
          label="Heading 1"
        >
          <span className="text-sm font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => insertMarkdown('## ', '', 'Heading 2')}
          label="Heading 2"
        >
          <span className="text-sm font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => insertMarkdown('### ', '', 'Heading 3')}
          label="Heading 3"
        >
          <span className="text-sm font-bold">H3</span>
        </ToolbarButton>

        <Separator />

        {/* Text Formatting Group */}
        <ToolbarButton
          onClick={() => insertMarkdown('**', '**', 'bold text')}
          label="Bold"
        >
          <span className="text-base font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => insertMarkdown('*', '*', 'italic text')}
          label="Italic"
        >
          <span className="text-base italic">I</span>
        </ToolbarButton>

        <Separator />

        {/* Lists Group */}
        <ToolbarButton
          onClick={() => insertMarkdown('- ', '', 'list item')}
          label="Bullet List"
        >
          <ListBulletIcon className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => insertMarkdown('1. ', '', 'list item')}
          label="Numbered List"
        >
          <span className="text-sm font-bold">1.</span>
        </ToolbarButton>

        <Separator />

        {/* Media Group */}
        <ToolbarButton
          onClick={() => setLinkDialog({ open: true, url: '', text: '' })}
          label="Insert Link"
        >
          <LinkIcon className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setImageDialog({ open: true, url: '', alt: '' })}
          label="Insert Image"
        >
          <PhotoIcon className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setVideoDialog({ open: true, url: '' })}
          label="Insert Video"
        >
          <VideoCameraIcon className="h-5 w-5" />
        </ToolbarButton>
      </div>

      {/* Mobile Toolbar */}
      <div className="sm:hidden">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-300 rounded-t-md border-b-0 text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label={isMenuOpen ? 'Close toolbar' : 'Open toolbar'}
          aria-expanded={isMenuOpen}
        >
          <span className="text-sm font-medium">Markdown Formatting</span>
          {isMenuOpen ? (
            <XMarkIcon className="h-5 w-5" />
          ) : (
            <Bars3Icon className="h-5 w-5" />
          )}
        </button>

        {/* Collapsible Menu */}
        {isMenuOpen && (
          <div className="px-4 py-3 bg-gray-50 border-x border-gray-300 space-y-4">
            {/* Headers Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Headers
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <MobileButton
                  onClick={() => insertMarkdown('# ', '', 'Heading 1')}
                  label="Heading 1"
                >
                  <span className="text-sm font-bold">H1</span>
                  <span className="text-xs text-gray-500 mt-1">Heading 1</span>
                </MobileButton>
                <MobileButton
                  onClick={() => insertMarkdown('## ', '', 'Heading 2')}
                  label="Heading 2"
                >
                  <span className="text-sm font-bold">H2</span>
                  <span className="text-xs text-gray-500 mt-1">Heading 2</span>
                </MobileButton>
                <MobileButton
                  onClick={() => insertMarkdown('### ', '', 'Heading 3')}
                  label="Heading 3"
                >
                  <span className="text-sm font-bold">H3</span>
                  <span className="text-xs text-gray-500 mt-1">Heading 3</span>
                </MobileButton>
              </div>
            </div>

            {/* Text Formatting Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Text Formatting
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <MobileButton
                  onClick={() => insertMarkdown('**', '**', 'bold text')}
                  label="Bold"
                >
                  <span className="text-base font-bold">B</span>
                  <span className="text-xs text-gray-500 mt-1">Bold</span>
                </MobileButton>
                <MobileButton
                  onClick={() => insertMarkdown('*', '*', 'italic text')}
                  label="Italic"
                >
                  <span className="text-base italic">I</span>
                  <span className="text-xs text-gray-500 mt-1">Italic</span>
                </MobileButton>
              </div>
            </div>

            {/* Lists Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Lists
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <MobileButton
                  onClick={() => insertMarkdown('- ', '', 'list item')}
                  label="Bullet List"
                >
                  <ListBulletIcon className="h-6 w-6" />
                  <span className="text-xs text-gray-500 mt-1">Bullet</span>
                </MobileButton>
                <MobileButton
                  onClick={() => insertMarkdown('1. ', '', 'list item')}
                  label="Numbered List"
                >
                  <span className="text-base font-bold">1.</span>
                  <span className="text-xs text-gray-500 mt-1">Numbered</span>
                </MobileButton>
              </div>
            </div>

            {/* Media Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Media
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <MobileButton
                  onClick={() => setLinkDialog({ open: true, url: '', text: '' })}
                  label="Insert Link"
                >
                  <LinkIcon className="h-6 w-6" />
                  <span className="text-xs text-gray-500 mt-1">Link</span>
                </MobileButton>
                <MobileButton
                  onClick={() => setImageDialog({ open: true, url: '', alt: '' })}
                  label="Insert Image"
                >
                  <PhotoIcon className="h-6 w-6" />
                  <span className="text-xs text-gray-500 mt-1">Image</span>
                </MobileButton>
                <MobileButton
                  onClick={() => setVideoDialog({ open: true, url: '' })}
                  label="Insert Video"
                >
                  <VideoCameraIcon className="h-6 w-6" />
                  <span className="text-xs text-gray-500 mt-1">Video</span>
                </MobileButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Link Dialog */}
      {linkDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="link-text" className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  id="link-text"
                  type="text"
                  value={linkDialog.text}
                  onChange={(e) => setLinkDialog({ ...linkDialog, text: e.target.value })}
                  placeholder="Click here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="link-url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  id="link-url"
                  type="url"
                  value={linkDialog.url}
                  onChange={(e) => setLinkDialog({ ...linkDialog, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setLinkDialog({ open: false, url: '', text: '' })}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLinkInsert}
                disabled={!linkDialog.url}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {imageDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  id="image-url"
                  type="url"
                  value={imageDialog.url}
                  onChange={(e) => setImageDialog({ ...imageDialog, url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="image-alt" className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (Description)
                </label>
                <input
                  id="image-alt"
                  type="text"
                  value={imageDialog.alt}
                  onChange={(e) => setImageDialog({ ...imageDialog, alt: e.target.value })}
                  placeholder="Image description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setImageDialog({ open: false, url: '', alt: '' })}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImageInsert}
                disabled={!imageDialog.url}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Dialog */}
      {videoDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Insert Video</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Video URL
                </label>
                <input
                  id="video-url"
                  type="url"
                  value={videoDialog.url}
                  onChange={(e) => setVideoDialog({ ...videoDialog, url: e.target.value })}
                  placeholder="YouTube, Vimeo, or direct video URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports YouTube, Vimeo, and direct video URLs
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setVideoDialog({ open: false, url: '' })}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVideoInsert}
                disabled={!videoDialog.url}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
