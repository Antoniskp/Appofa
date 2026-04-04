'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { saveReturnTo } from '@/lib/auth-redirect';

/**
 * A drop-in replacement for `<Link href="/login">` that saves the current
 * page path to localStorage before navigating, so the user is returned to
 * their original page after a successful login.
 */
export default function LoginLink({ children, className, ...props }) {
  const pathname = usePathname();

  const handleClick = () => {
    saveReturnTo(pathname);
  };

  return (
    <Link href="/login" onClick={handleClick} className={className} {...props}>
      {children}
    </Link>
  );
}
