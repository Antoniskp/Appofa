'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Reusable card component for consistent layouts
 * 
 * @param {React.ReactNode} children - Card content
 * @param {React.ReactNode} header - Optional header section
 * @param {React.ReactNode} footer - Optional footer section
 * @param {string} variant - Card style variant
 *   - 'default': White background with shadow (default)
 *   - 'outlined': White background with border, no shadow
 *   - 'elevated': Larger shadow for emphasis
 * @param {boolean} hoverable - Enable hover effect (lift + shadow increase)
 * @param {boolean} clickable - Make entire card clickable (cursor pointer)
 * @param {string} href - If provided, card becomes a link
 * @param {function} onClick - Click handler for card
 * @param {string} padding - Padding size (none, sm, md, lg)
 * @param {string} className - Additional CSS classes
 */
export default function Card({ 
  children,
  header,
  footer,
  variant = 'default',
  hoverable = false,
  clickable = false,
  href,
  onClick,
  padding = 'md',
  className = ''
}) {
  const variants = {
    default: 'bg-white rounded-lg shadow-md',
    outlined: 'bg-white rounded-lg border border-gray-200',
    elevated: 'bg-white rounded-lg shadow-lg'
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const hoverClasses = hoverable || href || onClick 
    ? 'hover:shadow-lg transition-shadow cursor-pointer' 
    : '';
  
  const baseClasses = `${variants[variant]} ${hoverClasses} ${className}`;
  
  const cardContent = (
    <>
      {header && (
        <div className={`border-b border-gray-200 ${paddings[padding]}`}>
          {header}
        </div>
      )}
      
      <div className={paddings[padding]}>
        {children}
      </div>
      
      {footer && (
        <div className={`border-t border-gray-200 bg-gray-50 ${paddings[padding]}`}>
          {footer}
        </div>
      )}
    </>
  );
  
  // Card as link
  if (href) {
    return (
      <Link href={href} className={`block ${baseClasses}`}>
        {cardContent}
      </Link>
    );
  }
  
  // Clickable card
  if (onClick) {
    return (
      <div 
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e);
          }
        }}
        role="button"
        tabIndex={0}
        className={baseClasses}
      >
        {cardContent}
      </div>
    );
  }
  
  // Regular card
  return (
    <div className={baseClasses}>
      {cardContent}
    </div>
  );
}

/**
 * Card with image on the left (for article lists, etc.)
 */
export function ImageCard({
  image,
  imageAlt,
  imageFallback,
  imageClassName = 'w-32 h-24',
  children,
  href,
  onClick,
  hoverable = true,
  className = ''
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = imageError && imageFallback ? imageFallback : image;
  
  const content = (
    <div className="flex">
      <div className={`flex-shrink-0 overflow-hidden ${imageClassName}`}>
        <img 
          src={imageSrc} 
          alt={imageAlt} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            if (!imageError && imageFallback) {
              setImageError(true);
            }
          }}
        />
      </div>
      <div className="p-6 flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
  
  return (
    <Card 
      hoverable={hoverable} 
      onClick={onClick}
      href={href}
      padding="none" 
      className={className}
    >
      {content}
    </Card>
  );
}

/**
 * Card with image on top (for grid layouts)
 */
export function ImageTopCard({
  image,
  imageAlt,
  imageFallback,
  imageClassName = 'h-48',
  children,
  footer,
  href,
  hoverable = true,
  className = ''
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = imageError && imageFallback ? imageFallback : image;
  
  const content = (
    <>
      <div className={`overflow-hidden ${imageClassName}`}>
        <img 
          src={imageSrc} 
          alt={imageAlt} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            if (!imageError && imageFallback) {
              setImageError(true);
            }
          }}
        />
      </div>
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 pb-6">
          {footer}
        </div>
      )}
    </>
  );
  
  return (
    <Card 
      hoverable={hoverable} 
      href={href}
      padding="none" 
      className={className}
    >
      {content}
    </Card>
  );
}

/**
 * Stats card (for dashboards, metrics)
 */
export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  className = ''
}) {
  return (
    <Card variant={variant} className={className}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="h-8 w-8 text-blue-600" />
          </div>
        )}
      </div>
    </Card>
  );
}
