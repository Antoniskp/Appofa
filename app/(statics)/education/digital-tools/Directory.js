'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { isValidCountryCode, resolveCountry } from '@/lib/geo/countryResolver';
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
          <p className={styles.cardCategory}>{copy.categories[tool.category]} · {tool.coverageLabel}</p>
          <h4>{tool.name}</h4>
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

function applyMarketPricing(tool, country, locale, copy) {
  const pricing = tool.marketPricing?.[country];
  if (!pricing) return tool;

  const amount = new Intl.NumberFormat(locale, { style: 'currency', currency: pricing.currency }).format(pricing.amount);
  return {
    ...tool,
    price: `${copy.freeAccess} ${tool.marketPricing.plan} · ${amount} / ${copy.month}`,
    sources: [['marketPricing', pricing.url], ...tool.sources.filter(([label]) => label !== 'pricing')],
  };
}

export default function Directory({ tools, copy, locale }) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [preferredCountry, setPreferredCountry] = useState(null);
  const searchInput = useRef(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    setPreferredCountry(resolveCountry({ user }).code);
  }, [user]);

  const countryNames = new Intl.DisplayNames([locale], { type: 'region' });
  const supportedCountries = [...new Set(tools.flatMap(tool => tool.countries ?? []))];
  const countryLabels = Object.fromEntries(supportedCountries.map(code => [code, countryNames.of(code)]));
  const requestedCountry = searchParams.get('country')?.trim().toUpperCase();
  const market = isValidCountryCode(requestedCountry) ? requestedCountry : preferredCountry;
  let country = 'international';
  if (requestedCountry === 'ALL') country = 'all';
  else if (requestedCountry !== 'INTERNATIONAL' && supportedCountries.includes(market)) country = market;

  const countryOptions = { ...countryLabels, international: copy.international, all: copy.allCountries };
  const categories = { all: copy.all, ...copy.categories };
  const terms = normalize(query, locale).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const localTools = [];
  const internationalTools = [];

  for (const tool of tools) {
    if (category !== 'all' && tool.category !== category) continue;
    if (tool.countries && country !== 'all' && !tool.countries.includes(country)) continue;

    const entry = applyMarketPricing(tool, country, locale, copy);
    const coverageLabel = tool.countries?.map(code => countryLabels[code]).join(', ') ?? copy.international;
    const searchable = normalize([
      entry.name, entry.domain, entry.aliases, entry.description, entry.price,
      copy.categories[entry.category], copy.models[entry.model], coverageLabel,
    ].join(' '), locale);
    if (!terms.every(term => searchable.includes(term))) continue;

    const group = tool.countries ? localTools : internationalTools;
    group.push({ ...entry, coverageLabel });
  }

  const groups = [
    { id: 'local-tools', label: countryLabels[country] ?? copy.localTools, tools: localTools },
    { id: 'international-tools', label: copy.international, tools: internationalTools },
  ].filter(group => group.tools.length);
  const resultCount = localTools.length + internationalTools.length;

  function changeCountry(value) {
    const url = new URL(window.location.href);
    if (url.searchParams.get('country') === value) return;
    url.searchParams.set('country', value);
    window.history.pushState(null, '', url);
  }

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
        <div className={styles.countryRow}>
          <div className={styles.filters} role="group" aria-label={copy.countryFilter}>
            {Object.entries(countryOptions).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={value === country} onClick={() => changeCountry(value)}>{label}</button>
            ))}
          </div>
          <p className={styles.count} role="status">{resultCount} {copy.results[resultCount === 1 ? 0 : 1]}</p>
        </div>
        <div className={styles.filters} role="group" aria-label={copy.filter}>
          {Object.entries(categories).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={value === category} onClick={() => setCategory(value)}>{label}</button>
          ))}
        </div>
      </div>
      {groups.length ? (
        groups.map(group => (
          <section key={group.id} className={styles.resultGroup} aria-labelledby={group.id}>
            <h3 id={group.id}>{group.label}</h3>
            <div className={styles.cards}>
              {group.tools.map(tool => <ToolCard key={tool.id} tool={tool} copy={copy} />)}
            </div>
          </section>
        ))
      ) : (
        <div className={styles.empty}>
          <p>{copy.empty}</p>
          <button type="button" onClick={clearFilters}>{copy.reset}</button>
        </div>
      )}
    </section>
  );
}
