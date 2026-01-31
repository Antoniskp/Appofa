import Link from 'next/link';

/**
 * Hero section for the homepage
 */
export default function HomeHero() {
  return (
    <section className="bg-blue-600 text-white py-20">
      <div className="app-container text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to News App
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          Your trusted source for the latest news and articles
        </p>
        <Link href="/articles" className="btn-secondary bg-white">
          Browse All Articles
        </Link>
      </div>
    </section>
  );
}
