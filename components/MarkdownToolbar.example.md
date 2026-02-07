# MarkdownToolbar Component

A responsive markdown toolbar component with desktop and mobile views that provides buttons to insert markdown syntax at the cursor position in a textarea.

## Features

- **Desktop View**: Horizontal toolbar with icon buttons and visual separators
- **Mobile View**: Collapsible menu with labeled sections and larger touch targets
- **Dialog Support**: Popup dialogs for complex insertions (links, images, videos)
- **Video Support**: Automatically handles YouTube, Vimeo, and direct video URLs
- **Auto-close**: Mobile menu closes automatically after inserting content
- **Cursor Management**: Inserts markdown at the current cursor position

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onInsert` | `(start, end, text) => void` | Yes | Callback function called when markdown is inserted. Receives the start position, end position, and the text to insert. |
| `textareaRef` | `React.RefObject` | Yes | Reference to the textarea element where markdown will be inserted. |

## Usage

```jsx
'use client';

import { useRef, useState } from 'react';
import MarkdownToolbar from '@/components/MarkdownToolbar';

export default function MarkdownEditor() {
  const textareaRef = useRef(null);
  const [content, setContent] = useState('');

  const handleInsert = (start, end, text) => {
    // Insert the text at the cursor position
    const before = content.substring(0, start);
    const after = content.substring(end);
    setContent(before + text + after);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Markdown Editor</h1>
      
      <div className="mb-4">
        <MarkdownToolbar 
          onInsert={handleInsert}
          textareaRef={textareaRef}
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[400px] p-4 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Start typing or use the toolbar to add markdown..."
        />
      </div>

      {/* Preview */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Preview</h2>
        <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
          <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
        </div>
      </div>
    </div>
  );
}
```

## Supported Markdown

### Headers
- **H1**: `# Heading 1`
- **H2**: `## Heading 2`
- **H3**: `### Heading 3`

### Text Formatting
- **Bold**: `**bold text**`
- **Italic**: `*italic text*`

### Lists
- **Bullet List**: `- list item`
- **Numbered List**: `1. list item`

### Media
- **Link**: `[text](url)` - Opens a dialog to input URL and link text
- **Image**: `![alt](url)` - Opens a dialog to input URL and alt text
- **Video**: Automatically formats based on URL:
  - YouTube: Embeds as iframe
  - Vimeo: Embeds as iframe
  - Direct URL: Uses HTML5 video tag with width="100%"

## Responsive Breakpoints

- **Desktop (≥640px)**: Horizontal toolbar visible
- **Mobile (<640px)**: Collapsible menu with toggle button

## Styling

The component uses Tailwind CSS classes and matches the existing design system:
- Gray-50 backgrounds (`bg-gray-50`)
- Blue-600 primary colors (`bg-blue-600`, `text-blue-600`)
- Rounded top corners (`rounded-t-md`) to pair with textarea having `rounded-b-md`
- Border styles matching other components
- Mobile touch targets are minimum 44x44px for accessibility

## Accessibility

- All buttons have proper `aria-label` and `title` attributes
- Dialogs have proper modal behavior with backdrop
- Focus management for keyboard navigation
- Semantic HTML structure

## Video URL Examples

### YouTube
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

### Vimeo
- `https://vimeo.com/VIDEO_ID`

### Direct Video
- `https://example.com/video.mp4`

## Icons Used

From `@heroicons/react/24/outline`:
- Menu toggle: `Bars3Icon`, `XMarkIcon`
- Headers: Text-based "H1", "H2", "H3"
- Bold: Text-based "B"
- Italic: Text-based "I"
- Lists: `ListBulletIcon`, text-based "1."
- Media: `LinkIcon`, `PhotoIcon`, `VideoCameraIcon`
