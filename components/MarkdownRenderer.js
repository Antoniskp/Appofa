'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Safe Markdown Renderer Component
 * 
 * Renders markdown content with GitHub Flavored Markdown support while
 * preventing XSS attacks through careful sanitization of HTML elements.
 * 
 * @param {string} content - The markdown content to render
 * @param {string} className - Optional additional CSS classes
 * 
 * Features:
 * - GitHub Flavored Markdown support (tables, strikethrough, task lists, etc.)
 * - Responsive images with lazy loading
 * - Responsive iframe embeds (YouTube, Vimeo)
 * - XSS protection through allowlist-based sanitization
 * - Tailwind typography styling
 */
export default function MarkdownRenderer({ content, className = '' }) {
  // Allowed base domains for iframe embeds
  // The validation logic will also allow proper subdomains (e.g., www.youtube.com)
  const ALLOWED_IFRAME_DOMAINS = [
    'youtube.com',
    'youtube-nocookie.com',
    'player.vimeo.com',
    'vimeo.com'
  ];

  /**
   * Check if an iframe source is from an allowed domain
   * Allows exact domain match or proper subdomains (e.g., www.youtube.com)
   * Prevents evil.com and evilyoutube.com from passing
   */
  const isAllowedIframeSrc = (src) => {
    if (!src) return false;
    
    try {
      const url = new URL(src);
      const hostname = url.hostname;
      
      return ALLOWED_IFRAME_DOMAINS.some(domain => {
        // Exact match (e.g., youtube.com)
        if (hostname === domain) return true;
        
        // Proper subdomain (e.g., www.youtube.com, m.youtube.com)
        // Must end with .domain to prevent evilyoutube.com from passing
        if (hostname.endsWith('.' + domain)) return true;
        
        return false;
      });
    } catch {
      return false;
    }
  };

  /**
   * Sanitize and validate iframe attributes
   */
  const sanitizeIframeProps = (props) => {
    const { src, width, height, title, allowFullScreen, frameBorder, allow } = props;
    
    // Only allow iframes from trusted domains
    if (!isAllowedIframeSrc(src)) {
      return null;
    }

    return {
      src,
      width: width || '100%',
      height: height || '315',
      title: title || 'Embedded content',
      allowFullScreen: allowFullScreen !== false,
      frameBorder: '0',
      allow: allow || 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      loading: 'lazy'
    };
  };

  /**
   * Custom components for enhanced rendering and security
   */
  const components = {
    // Make images responsive and add lazy loading
    img: ({ node, alt, src, title, ...props }) => {
      // Block dangerous URL schemes for security (case-insensitive)
      if (!src) return null;
      
      const lowerSrc = src.toLowerCase();
      if (lowerSrc.startsWith('javascript:') || lowerSrc.startsWith('data:') || lowerSrc.startsWith('vbscript:')) {
        return null;
      }

      return (
        <img
          src={src}
          alt={alt || ''}
          title={title}
          className="max-w-full h-auto rounded-lg my-4"
          loading="lazy"
          {...props}
        />
      );
    },

    // Handle iframes (for video embeds)
    iframe: ({ node, ...props }) => {
      const sanitizedProps = sanitizeIframeProps(props);
      
      if (!sanitizedProps) {
        // Return a message for blocked iframes
        return (
          <div className="border border-yellow-300 bg-yellow-50 text-yellow-800 p-4 rounded-lg my-4">
            <p className="text-sm">
              ⚠️ Embedded content from untrusted source was blocked for security.
            </p>
          </div>
        );
      }

      return (
        <div className="relative my-6 pb-[56.25%] h-0 overflow-hidden rounded-lg">
          <iframe
            {...sanitizedProps}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      );
    },

    // Handle video tags
    video: ({ node, src, poster, controls, ...props }) => {
      // Block dangerous URL schemes for security (case-insensitive)
      if (!src) return null;
      
      const lowerSrc = src.toLowerCase();
      if (lowerSrc.startsWith('javascript:') || lowerSrc.startsWith('data:') || lowerSrc.startsWith('vbscript:')) {
        return null;
      }

      return (
        <div className="my-6">
          <video
            src={src}
            poster={poster}
            controls={controls !== false}
            className="max-w-full h-auto rounded-lg"
            {...props}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    },

    // Style links
    a: ({ node, href, children, ...props }) => {
      // Block dangerous URL schemes for security (case-insensitive)
      if (!href) return <span>{children}</span>;
      
      const lowerHref = href.toLowerCase();
      if (lowerHref.startsWith('javascript:') || lowerHref.startsWith('data:') || lowerHref.startsWith('vbscript:')) {
        return <span>{children}</span>;
      }

      // Open external links in new tab
      // Check for http://, https://, and protocol-relative URLs (//)
      const isExternal = href.startsWith('http://') || 
                        href.startsWith('https://') || 
                        href.startsWith('//');
      
      return (
        <a
          href={href}
          className="text-blue-600 hover:text-blue-800 underline"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },

    // Style headings
    h1: ({ node, children, ...props }) => (
      <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900" {...props}>
        {children}
      </h1>
    ),
    h2: ({ node, children, ...props }) => (
      <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900" {...props}>
        {children}
      </h2>
    ),
    h3: ({ node, children, ...props }) => (
      <h3 className="text-xl font-bold mt-5 mb-2 text-gray-900" {...props}>
        {children}
      </h3>
    ),
    h4: ({ node, children, ...props }) => (
      <h4 className="text-lg font-bold mt-4 mb-2 text-gray-900" {...props}>
        {children}
      </h4>
    ),
    h5: ({ node, children, ...props }) => (
      <h5 className="text-base font-bold mt-3 mb-2 text-gray-900" {...props}>
        {children}
      </h5>
    ),
    h6: ({ node, children, ...props }) => (
      <h6 className="text-sm font-bold mt-3 mb-2 text-gray-900" {...props}>
        {children}
      </h6>
    ),

    // Style paragraphs
    p: ({ node, children, ...props }) => (
      <p className="mb-4 leading-7 text-gray-700" {...props}>
        {children}
      </p>
    ),

    // Style lists
    ul: ({ node, children, ...props }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props}>
        {children}
      </ul>
    ),
    ol: ({ node, children, ...props }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props}>
        {children}
      </ol>
    ),
    li: ({ node, children, ...props }) => (
      <li className="ml-4" {...props}>
        {children}
      </li>
    ),

    // Style blockquotes
    blockquote: ({ node, children, ...props }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-4 italic text-gray-600" {...props}>
        {children}
      </blockquote>
    ),

    // Style code blocks
    code: ({ node, inline, className, children, ...props }) => {
      if (inline) {
        return (
          <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }
      
      return (
        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ node, children, ...props }) => (
      <pre className="my-4" {...props}>
        {children}
      </pre>
    ),

    // Style tables (GFM feature)
    table: ({ node, children, ...props }) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ node, children, ...props }) => (
      <thead className="bg-gray-50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ node, children, ...props }) => (
      <tbody className="bg-white divide-y divide-gray-200" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ node, children, ...props }) => (
      <tr {...props}>
        {children}
      </tr>
    ),
    th: ({ node, children, ...props }) => (
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" {...props}>
        {children}
      </th>
    ),
    td: ({ node, children, ...props }) => (
      <td className="px-4 py-3 text-sm text-gray-700" {...props}>
        {children}
      </td>
    ),

    // Style horizontal rules
    hr: ({ node, ...props }) => (
      <hr className="my-8 border-t border-gray-300" {...props} />
    ),

    // Block potentially dangerous elements
    script: () => null,
    style: () => null,
    object: () => null,
    embed: () => null,
  };

  // Handle empty or invalid content
  if (!content || typeof content !== 'string') {
    return null;
  }

  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
