'use client';

import { useRef, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ToolLogo from './ToolLogo';
import styles from './directory.module.css';

function normalize(value, locale) {
  return value.toLocaleLowerCase(locale).normalize('NFD').replace(/\p{M}/gu, '').replaceAll('ς', 'σ');
}

function ToolCard({ tool, copy }) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <ToolLogo tool={tool} />
        <div>
          <p className={styles.cardCategory}>{copy.categories[tool.category]}</p>
          <h3>{tool.name}</h3>
        </div>
      </header>
      <p className={styles.description}>{tool.description}</p>
      <div className={styles.model} data-model={tool.model}>{copy.models[tool.model]}</div>
      <dl className={styles.facts}>
        <div>
          <dt>{copy.price}</dt>
          <dd>{tool.price}</dd>
        </div>
        <div>
          <dt>{copy.analysis}</dt>
          <dd>{tool.analysis}</dd>
        </div>
      </dl>
      <div className={styles.cardFoot}>
        <a className={styles.visit} href={tool.url} aria-label={`${tool.domain} · ${copy.visit} ${tool.name}`}>{tool.domain}</a>
        <ul className={styles.sources}>
          {tool.sources.map(([label, url]) => <li key={url}><a href={url}>{copy.sources[label]}</a></li>)}
        </ul>
      </div>
    </article>
  );
}

export default function Directory({ tools, copy, locale }) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const searchInput = useRef(null);
  const categories = { all: copy.all, ...copy.categories };
  const terms = normalize(query.trim(), locale).split(/\s+/).filter(Boolean);
  const results = tools.filter(tool => {
    if (category !== 'all' && tool.category !== category) return false;
    const searchable = normalize([
      tool.name, tool.domain, tool.description, tool.price, copy.categories[tool.category], copy.models[tool.model],
    ].join(' '), locale);
    return terms.every(term => searchable.includes(term));
  });

  function clearFilters() {
    setCategory('all');
    setQuery('');
    searchInput.current.focus();
  }

  return (
    <section className={styles.directory} id="directory" aria-labelledby="directory-heading">
      <div className={styles.directoryHeader}>
        <h2 id="directory-heading">{copy.heading}</h2>
        <label className={styles.search}>
          <span className="sr-only">{copy.search}</span>
          <MagnifyingGlassIcon aria-hidden="true" />
          <input ref={searchInput} type="search" value={query} placeholder={copy.placeholder} onChange={event => setQuery(event.target.value)} />
        </label>
      </div>
      <div className={styles.filterBar}>
        <div className={styles.filters} role="group" aria-label={copy.filter}>
          {Object.entries(categories).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={value === category} onClick={() => setCategory(value)}>{label}</button>
          ))}
        </div>
        <p className={styles.count} role="status">{results.length} {copy.results[results.length === 1 ? 0 : 1]}</p>
      </div>
      {results.length ? (
        <div className={styles.cards}>
          {results.map(tool => <ToolCard key={tool.id} tool={tool} copy={copy} />)}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>{copy.empty}</p>
          <button type="button" onClick={clearFilters}>{copy.reset}</button>
        </div>
      )}
    </section>
  );
}
