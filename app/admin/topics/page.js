'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ToastProvider';
import { linkPreviewAPI, tagAPI, topicAPI } from '@/lib/api';

const EMPTY_TOPIC = {
  name: '',
  slug: '',
  tagName: '',
  description: '',
  aliases: '',
  heroImageUrl: '',
  status: 'active',
  isFeatured: false,
  externalLinks: [],
};

const EMPTY_LINK = {
  url: '',
  provider: 'website',
  sourceType: 'link',
  title: '',
  description: '',
  thumbnailUrl: '',
  embedUrl: '',
  embedHtml: '',
  status: 'approved',
};

function topicToForm(topic) {
  return {
    id: topic.id,
    name: topic.name || '',
    slug: topic.slug || '',
    tagName: topic.tagName || topic.name || '',
    description: topic.description || '',
    aliases: Array.isArray(topic.aliases) ? topic.aliases.join(', ') : '',
    heroImageUrl: topic.heroImageUrl || '',
    status: topic.status || 'active',
    isFeatured: Boolean(topic.isFeatured),
    externalLinks: Array.isArray(topic.externalLinks)
      ? topic.externalLinks.map((link) => ({
        url: link.url || '',
        provider: link.provider || 'website',
        sourceType: link.sourceType || 'link',
        title: link.title || '',
        description: link.description || '',
        thumbnailUrl: link.thumbnailUrl || '',
        embedUrl: link.embedUrl || '',
        embedHtml: link.embedHtml || '',
        status: link.status || 'approved',
      }))
      : [],
  };
}

function formToPayload(form) {
  return {
    name: form.name,
    slug: form.slug,
    tagName: form.tagName || form.name,
    description: form.description,
    aliases: form.aliases,
    heroImageUrl: form.heroImageUrl,
    status: form.status,
    isFeatured: form.isFeatured,
    externalLinks: form.externalLinks.filter((link) => link.url.trim()),
  };
}

function detectProvider(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'youtube';
    if (host.endsWith('tiktok.com')) return 'tiktok';
    if (host === 'x.com' || host.endsWith('.x.com')) return 'x';
    if (host === 'twitter.com' || host.endsWith('.twitter.com')) return 'twitter';
  } catch {
    return 'website';
  }
  return 'website';
}

function AdminTopicsContent() {
  const { addToast } = useToast();
  const [topics, setTopics] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [form, setForm] = useState(EMPTY_TOPIC);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewingIndex, setPreviewingIndex] = useState(null);

  const selectedId = form.id || null;

  const sortedTopics = useMemo(() => [...topics].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    return a.name.localeCompare(b.name);
  }), [topics]);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const [topicRes, tagRes] = await Promise.all([
        topicAPI.getAll({ includeHidden: true, limit: 200 }),
        tagAPI.getSuggestions(),
      ]);
      setTopics(Array.isArray(topicRes?.topics) ? topicRes.topics : []);
      setTagSuggestions(Array.isArray(tagRes?.tags) ? tagRes.tags.map((tag) => tag.name || tag).filter(Boolean) : []);
    } catch (error) {
      addToast(error.message || 'Failed to load topics.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateLink = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      externalLinks: prev.externalLinks.map((link, i) => i === index ? { ...link, ...patch } : link),
    }));
  };

  const addLink = () => {
    setForm((prev) => ({ ...prev, externalLinks: [...prev.externalLinks, { ...EMPTY_LINK }] }));
  };

  const removeLink = (index) => {
    setForm((prev) => ({ ...prev, externalLinks: prev.externalLinks.filter((_, i) => i !== index) }));
  };

  const handlePreview = async (index) => {
    const link = form.externalLinks[index];
    if (!link?.url) return;

    const provider = detectProvider(link.url);
    updateLink(index, {
      provider,
      sourceType: provider === 'youtube' || provider === 'tiktok' ? 'video' : 'link',
    });

    if (provider !== 'youtube' && provider !== 'tiktok') return;

    setPreviewingIndex(index);
    try {
      const res = await linkPreviewAPI.fetch(link.url);
      const data = res?.data || {};
      updateLink(index, {
        provider: data.provider || provider,
        title: data.title || link.title,
        thumbnailUrl: data.thumbnailUrl || link.thumbnailUrl,
        embedUrl: data.embedUrl || link.embedUrl,
        embedHtml: data.embedHtml || link.embedHtml,
      });
    } catch (error) {
      addToast(error.message || 'Preview failed. You can still save the link manually.', { type: 'warning' });
    } finally {
      setPreviewingIndex(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = formToPayload(form);
      const res = form.id
        ? await topicAPI.update(form.id, payload)
        : await topicAPI.create(payload);
      const saved = res?.topic;
      if (saved) {
        setTopics((prev) => {
          const next = prev.filter((topic) => topic.id !== saved.id);
          return [...next, saved];
        });
        setForm(topicToForm(saved));
      }
      addToast('Topic saved.', { type: 'success' });
    } catch (error) {
      addToast(error.message || 'Failed to save topic.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader title="Topics" />
      {loading ? (
        <div className="p-6">
          <SkeletonLoader count={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900">Topics</h2>
              <button
                type="button"
                onClick={() => setForm(EMPTY_TOPIC)}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                New
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {sortedTopics.map((topic) => (
                <button
                  key={topic.id || topic.slug}
                  type="button"
                  onClick={() => setForm(topicToForm(topic))}
                  className={`w-full text-left p-4 hover:bg-gray-50 ${selectedId === topic.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 truncate">{topic.name}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${topic.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {topic.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {topic.count} items · {topic.externalLinks?.length || 0} links
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Name" name="name" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
              <FormInput label="Slug" name="slug" value={form.slug} onChange={(event) => updateField('slug', event.target.value)} helpText="Leave empty on new topics to derive from name." />
              <div>
                <FormInput
                  label="Backing tag"
                  name="tagName"
                  value={form.tagName}
                  onChange={(event) => updateField('tagName', event.target.value)}
                  list="topic-tag-suggestions"
                  helpText="Content tagged with this value appears on the topic page."
                />
                <datalist id="topic-tag-suggestions">
                  {tagSuggestions.map((tag) => <option key={tag} value={tag} />)}
                </datalist>
              </div>
              <FormInput label="Hero image URL" name="heroImageUrl" value={form.heroImageUrl} onChange={(event) => updateField('heroImageUrl', event.target.value)} />
              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'hidden', label: 'Hidden' },
                  { value: 'merged', label: 'Merged' },
                ]}
                showPlaceholder={false}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 pt-7">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => updateField('isFeatured', event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Featured topic
              </label>
            </div>

            <FormInput
              label="Description"
              name="description"
              type="textarea"
              rows={4}
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
            />
            <FormInput
              label="Aliases"
              name="aliases"
              value={form.aliases}
              onChange={(event) => updateField('aliases', event.target.value)}
              helpText="Comma-separated search/merge hints for the next topic-search iteration."
            />

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">External links</h2>
                <button type="button" onClick={addLink} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50">
                  Add link
                </button>
              </div>

              <div className="space-y-4">
                {form.externalLinks.map((link, index) => (
                  <div key={`${link.url}-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
                      <FormInput
                        label="URL"
                        name={`link-url-${index}`}
                        value={link.url}
                        onChange={(event) => updateLink(index, { url: event.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => handlePreview(index)}
                        disabled={!link.url || previewingIndex === index}
                        className="self-end h-10 px-3 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                      >
                        {previewingIndex === index ? 'Previewing...' : 'Preview'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="self-end h-10 px-3 rounded-md border border-red-200 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormSelect
                        label="Provider"
                        name={`link-provider-${index}`}
                        value={link.provider}
                        onChange={(event) => updateLink(index, { provider: event.target.value })}
                        options={['website', 'youtube', 'tiktok', 'x', 'twitter']}
                        showPlaceholder={false}
                      />
                      <FormSelect
                        label="Type"
                        name={`link-type-${index}`}
                        value={link.sourceType}
                        onChange={(event) => updateLink(index, { sourceType: event.target.value })}
                        options={['link', 'video', 'post', 'article', 'official', 'dataset']}
                        showPlaceholder={false}
                      />
                      <FormSelect
                        label="Status"
                        name={`link-status-${index}`}
                        value={link.status}
                        onChange={(event) => updateLink(index, { status: event.target.value })}
                        options={['approved', 'pending', 'rejected']}
                        showPlaceholder={false}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormInput label="Title" name={`link-title-${index}`} value={link.title} onChange={(event) => updateLink(index, { title: event.target.value })} />
                      <FormInput label="Thumbnail URL" name={`link-thumb-${index}`} value={link.thumbnailUrl} onChange={(event) => updateLink(index, { thumbnailUrl: event.target.value })} />
                    </div>
                    <FormInput label="Description" name={`link-description-${index}`} value={link.description} onChange={(event) => updateLink(index, { description: event.target.value })} />
                  </div>
                ))}
                {form.externalLinks.length === 0 && (
                  <p className="text-sm text-gray-500">No external links yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save topic'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function AdminTopicsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminLayout>
        <AdminTopicsContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}
