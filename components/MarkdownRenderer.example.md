# MarkdownRenderer Component

A safe markdown renderer component with GitHub Flavored Markdown support and XSS protection.

## Usage

```jsx
import MarkdownRenderer from '@/components/MarkdownRenderer';

function MyComponent() {
  const content = `
# Hello World

This is **bold** and this is *italic*.

- List item 1
- List item 2

[Link to example](https://example.com)
  `;

  return <MarkdownRenderer content={content} />;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | - | The markdown content to render (required) |
| `className` | `string` | `''` | Additional CSS classes to apply |

## Features

### ✅ Supported Markdown Features

- **Headers** (H1-H6)
- **Bold** and *italic* text
- Links (internal and external)
- Images (with lazy loading and responsive sizing)
- Videos (iframe embeds from YouTube/Vimeo, and video tags)
- Ordered and unordered lists
- Line breaks
- Blockquotes
- Code blocks (inline and block)
- Tables (GitHub Flavored Markdown)
- Strikethrough (GitHub Flavored Markdown)
- Task lists (GitHub Flavored Markdown)
- Horizontal rules

### 🔒 Security Features

1. **XSS Protection**: Blocks dangerous HTML elements (`<script>`, `<style>`, `<object>`, `<embed>`)
2. **JavaScript URL Blocking**: Prevents `javascript:` URLs in links and images
3. **Data URI Blocking**: Blocks `data:` URIs in images and videos
4. **Iframe Whitelist**: Only allows iframes from YouTube and Vimeo domains
5. **Safe Attributes**: Sanitizes and validates all element attributes

### 🎨 Styling

- Uses Tailwind's `prose` utility for consistent typography
- Responsive images: `max-w-full h-auto`
- Responsive iframe containers: 16:9 aspect ratio
- Custom styles for all markdown elements
- Matches project design system

## Examples

### Basic Content

```jsx
<MarkdownRenderer 
  content="# Hello\n\nThis is **markdown** content." 
/>
```

### With Custom Classes

```jsx
<MarkdownRenderer 
  content={articleContent}
  className="bg-white p-6 rounded-lg"
/>
```

### YouTube Embed

```jsx
const content = `
Check out this video:

<iframe 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
  title="YouTube video"
  allowFullScreen
></iframe>
`;

<MarkdownRenderer content={content} />
```

### Vimeo Embed

```jsx
const content = `
<iframe 
  src="https://player.vimeo.com/video/123456789" 
  title="Vimeo video"
></iframe>
`;

<MarkdownRenderer content={content} />
```

### Tables (GFM)

```jsx
const content = `
| Feature | Supported |
|---------|-----------|
| Tables  | ✅        |
| Images  | ✅        |
| Videos  | ✅        |
`;

<MarkdownRenderer content={content} />
```

## Security Notes

### Blocked Content Examples

The following will be automatically blocked or sanitized:

```markdown
<!-- Blocked: Script tags -->
<script>alert('XSS')</script>

<!-- Blocked: JavaScript URLs -->
<a href="javascript:alert('XSS')">Click me</a>

<!-- Blocked: Data URIs in images -->
<img src="data:image/svg+xml,<svg>...</svg>" />

<!-- Blocked: Untrusted iframe sources -->
<iframe src="https://malicious-site.com/embed"></iframe>

<!-- Allowed: YouTube/Vimeo only -->
<iframe src="https://www.youtube.com/embed/VIDEO_ID"></iframe>
```

## Edge Cases Handled

- ✅ Empty or null content (renders nothing)
- ✅ Non-string content (renders nothing)
- ✅ Malformed URLs (blocked)
- ✅ Missing image src (renders nothing)
- ✅ Untrusted iframe sources (shows warning message)
- ✅ External links (open in new tab with `noopener noreferrer`)

## Integration with Other Components

### With Card Component

```jsx
import Card from '@/components/Card';
import MarkdownRenderer from '@/components/MarkdownRenderer';

function ArticleCard({ article }) {
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">{article.title}</h2>
      <MarkdownRenderer content={article.content} />
    </Card>
  );
}
```

### With Modal

```jsx
import Modal from '@/components/Modal';
import MarkdownRenderer from '@/components/MarkdownRenderer';

function ArticleModal({ article, isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={article.title}>
      <MarkdownRenderer content={article.content} />
    </Modal>
  );
}
```

## Performance

- Images use lazy loading by default
- Iframes use lazy loading
- Component returns `null` for invalid content (no unnecessary renders)
- Minimal re-renders (memoization could be added if needed)

## Dependencies

- `react-markdown` - Markdown rendering
- `remark-gfm` - GitHub Flavored Markdown support (tables, strikethrough, task lists, etc.)
