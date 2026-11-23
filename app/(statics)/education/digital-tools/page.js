import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { getDirectoryContent } from './content';
import { directoryPath, reviewedOn, tools } from './tools';
import Directory from './Directory';
import ToolLogo from './ToolLogo';
import styles from './directory.module.css';

const featured = ['airbnb', 'inkscape', 'wikipedia', 'chatgpt'].map(id => tools.find(tool => tool.id === id));

export async function generateMetadata() {
  const copy = getDirectoryContent(await getLocale());
  return pageMetadata(copy.title, copy.intro, directoryPath);
}

export default async function DigitalToolsPage() {
  const locale = await getLocale();
  const { entries, ...copy } = getDirectoryContent(locale);
  const catalog = tools.map(tool => ({ ...tool, ...entries[tool.id] }));
  const reviewDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(reviewedOn));

  return (
    <div className={styles.page}>
      <div className="app-container">
        <nav className={styles.breadcrumb} aria-label={copy.education}>
          <Link href="/education">{copy.education}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{copy.title}</span>
        </nav>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
            <a className={styles.browse} href="#directory">{copy.browse}</a>
          </div>
          <div className={styles.art} aria-hidden="true">
            <div className={styles.artTiles}>
              {featured.map(tool => (
                <div className={styles.artTile} key={tool.id}>
                  <ToolLogo tool={tool} />
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </header>
        <Directory tools={catalog} copy={copy} locale={locale} />
        <div className={styles.note}>
          <p>{copy.checked} <time dateTime={reviewedOn}>{reviewDate}</time>. {copy.priceNote}</p>
          <Link href="/education#appofasistis">Appofasistis</Link>
        </div>
      </div>
    </div>
  );
}
