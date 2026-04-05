'use client';

import { useState, useEffect, useCallback } from 'react';
import { locationSectionAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SECTION_TYPES = [
  { value: 'official_links', label: 'Official Links' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'webcams', label: 'Webcams' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'news_sources', label: 'News Sources' },
];

const SECTION_DESCRIPTIONS = {
  official_links: 'Add links to official websites and portals',
  contacts: 'Phone numbers and email addresses',
  news_sources: 'Local news outlet URLs',
  webcams: 'Live camera feeds for the location',
  announcements: 'Time-limited notices and alerts',
};

const SECTION_EMOJIS = {
  official_links: '🔗',
  contacts: '📞',
  news_sources: '📰',
  webcams: '📷',
  announcements: '📢',
};

const EMPTY_CONTENT = {
  official_links: { links: [{ label: '', url: '' }] },
  contacts: { phones: [], emails: [] },
  webcams: { webcams: [{ label: '', url: '' }] },
  announcements: { items: [{ title: '', priority: 0 }] },
  news_sources: { sources: [{ name: '', url: '' }] },
};

// ---------------------------------------------------------------------------
// Content editors per section type
// ---------------------------------------------------------------------------

function RepeatingRows({ items, setItems, renderRow, newRow }) {
  const add = () => setItems([...items, { ...newRow }]);
  const remove = (i) => setItems(items.filter((_, idx) => idx !== i));
  const update = (i, field, value) =>
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1">{renderRow(item, i, update)}</div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-1 p-1 text-red-400 hover:text-red-600 flex-shrink-0"
            title="Remove"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
      >
        <PlusIcon className="w-4 h-4" /> Add row
      </button>
    </div>
  );
}

function OfficialLinksEditor({ content, onChange }) {
  const links = content?.links || [];
  const setLinks = (l) => onChange({ links: l });
  return (
    <RepeatingRows
      items={links}
      setItems={setLinks}
      newRow={{ label: '', url: '' }}
      renderRow={(item, i, update) => (
        <div className="grid grid-cols-2 gap-2">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Label (e.g. Municipality website)"
            value={item.label}
            onChange={(e) => update(i, 'label', e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="https://..."
            value={item.url}
            onChange={(e) => update(i, 'url', e.target.value)}
          />
        </div>
      )}
    />
  );
}

function ContactsEditor({ content, onChange }) {
  const phones = content?.phones || [];
  const emails = content?.emails || [];

  const phoneRowRenderer = (item, i, update) => (
    <div className="grid grid-cols-2 gap-2">
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="e.g. Town Hall"
        value={item.label}
        onChange={(e) => update(i, 'label', e.target.value)}
      />
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="e.g. +30 210 000 0000"
        value={item.value}
        onChange={(e) => update(i, 'value', e.target.value)}
      />
    </div>
  );

  const emailRowRenderer = (item, i, update) => (
    <div className="grid grid-cols-2 gap-2">
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="e.g. General enquiries"
        value={item.label}
        onChange={(e) => update(i, 'label', e.target.value)}
      />
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="e.g. info@municipality.gr"
        value={item.value}
        onChange={(e) => update(i, 'value', e.target.value)}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Phones</p>
        <RepeatingRows
          items={phones}
          setItems={(p) => onChange({ phones: p, emails })}
          newRow={{ label: '', value: '' }}
          renderRow={phoneRowRenderer}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Emails</p>
        <RepeatingRows
          items={emails}
          setItems={(e) => onChange({ phones, emails: e })}
          newRow={{ label: '', value: '' }}
          renderRow={emailRowRenderer}
        />
      </div>
    </div>
  );
}

function WebcamsEditor({ content, onChange }) {
  const webcams = content?.webcams || [];
  const setWebcams = (w) => onChange({ webcams: w });
  return (
    <RepeatingRows
      items={webcams}
      setItems={setWebcams}
      newRow={{ label: '', url: '' }}
      renderRow={(item, i, update) => (
        <div className="grid grid-cols-2 gap-2">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Label"
            value={item.label}
            onChange={(e) => update(i, 'label', e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="https://..."
            value={item.url}
            onChange={(e) => update(i, 'url', e.target.value)}
          />
        </div>
      )}
    />
  );
}

function AnnouncementsEditor({ content, onChange }) {
  const items = content?.items || [];
  const setItems = (arr) => onChange({ items: arr });
  return (
    <RepeatingRows
      items={items}
      setItems={setItems}
      newRow={{ title: '', priority: 0 }}
      renderRow={(item, i, update) => (
        <div className="space-y-2">
          <input
            className="border rounded px-2 py-1 text-sm w-full"
            placeholder="Title"
            value={item.title}
            onChange={(e) => update(i, 'title', e.target.value)}
          />
          <textarea
            className="border rounded px-2 py-1 text-sm w-full"
            placeholder="Body (optional)"
            rows={2}
            value={item.body || ''}
            onChange={(e) => update(i, 'body', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Show from <span className="text-gray-400">(optional)</span></label>
              <input
                className="border rounded px-2 py-1 text-sm w-full"
                type="date"
                value={item.startsAt ? item.startsAt.slice(0, 10) : ''}
                onChange={(e) => update(i, 'startsAt', e.target.value || '')}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Show until <span className="text-gray-400">(optional)</span></label>
              <input
                className="border rounded px-2 py-1 text-sm w-full"
                type="date"
                value={item.endsAt ? item.endsAt.slice(0, 10) : ''}
                onChange={(e) => update(i, 'endsAt', e.target.value || '')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priority</label>
              <select
                className="border rounded px-2 py-1 text-sm w-full"
                value={item.priority ?? 0}
                onChange={(e) => update(i, 'priority', parseInt(e.target.value, 10))}
              >
                <option value={0}>⚪ Normal</option>
                <option value={3}>🟡 Important</option>
                <option value={5}>🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Link URL <span className="text-gray-400">(optional)</span></label>
              <input
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder="https://..."
                value={item.linkUrl || ''}
                onChange={(e) => update(i, 'linkUrl', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    />
  );
}

function NewsSourcesEditor({ content, onChange }) {
  const sources = content?.sources || [];
  const setSources = (arr) => onChange({ sources: arr });
  return (
    <RepeatingRows
      items={sources}
      setItems={setSources}
      newRow={{ name: '', url: '' }}
      renderRow={(item, i, update) => (
        <div className="grid grid-cols-2 gap-2">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Outlet name"
            value={item.name}
            onChange={(e) => update(i, 'name', e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="https://..."
            value={item.url}
            onChange={(e) => update(i, 'url', e.target.value)}
          />
        </div>
      )}
    />
  );
}

function ContentEditor({ type, content, onChange }) {
  switch (type) {
    case 'official_links': return <OfficialLinksEditor content={content} onChange={onChange} />;
    case 'contacts': return <ContactsEditor content={content} onChange={onChange} />;
    case 'webcams': return <WebcamsEditor content={content} onChange={onChange} />;
    case 'announcements': return <AnnouncementsEditor content={content} onChange={onChange} />;
    case 'news_sources': return <NewsSourcesEditor content={content} onChange={onChange} />;
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Section form (create / edit)
// ---------------------------------------------------------------------------
function SectionForm({ locationId, initial, onSave, onCancel }) {
  const isNew = !initial;
  const [type, setType] = useState(initial?.type || null);
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(
    initial?.content || null
  );
  const [isPublished, setIsPublished] = useState(initial?.isPublished || false);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { error: toastError } = useToast();

  // For existing sections, type is always set; initialize content from initial prop.
  const resolvedType = type || (initial?.type ?? 'official_links');

  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    setContent(EMPTY_CONTENT[selectedType] || {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let response;
      if (isNew) {
        response = await locationSectionAPI.createSection(locationId, {
          type: resolvedType, title: title || null, content, isPublished
        });
      } else {
        response = await locationSectionAPI.updateSection(locationId, initial.id, {
          title: title || null, content, isPublished
        });
      }
      if (response.success) {
        onSave(response.section);
      } else {
        toastError(response.message || 'Failed to save section');
      }
    } catch (err) {
      toastError(err.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  // When adding a new section, show type picker first
  if (isNew && !type) {
    return (
      <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Choose Section Type</h4>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeSelect(t.value)}
              className="flex flex-col items-start gap-1 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
            >
              <span className="text-2xl">{SECTION_EMOJIS[t.value]}</span>
              <span className="text-sm font-semibold text-gray-900">{t.label}</span>
              <span className="text-xs text-gray-500 leading-snug">{SECTION_DESCRIPTIONS[t.value]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentTypeLabel = SECTION_TYPES.find(t => t.value === resolvedType)?.label || resolvedType;

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
      <h4 className="font-semibold text-gray-800 mb-3">
        {isNew
          ? <>{SECTION_EMOJIS[resolvedType]} {currentTypeLabel}</>
          : 'Edit Section'}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <ContentEditor type={resolvedType} content={content} onChange={setContent} />
        </div>

        {/* Advanced options (title override) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            ⚙️ Advanced options {showAdvanced ? '▲' : '▼'}
          </button>
          {showAdvanced && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Override <span className="text-gray-400">(optional)</span>
              </label>
              <input
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder={`Leave blank to use default: "${currentTypeLabel}"`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-2">
          <input
            id="isPublished"
            type="checkbox"
            className="w-4 h-4"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <label htmlFor="isPublished" className="text-sm text-gray-700">
            Published (visible to public)
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckIcon className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={isNew ? () => setType(null) : onCancel}
            className="flex items-center gap-1 bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200"
          >
            <XMarkIcon className="w-4 h-4" />
            {isNew ? 'Back' : 'Cancel'}
          </button>
          {isNew && (
            <button
              type="button"
              onClick={onCancel}
              className="ml-auto text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section row (in the list)
// ---------------------------------------------------------------------------
function SectionRow({ section, onEdit, onDelete, onTogglePublish, onMoveUp, onMoveDown, isFirst, isLast }) {
  const typeLabel = SECTION_TYPES.find(t => t.value === section.type)?.label || section.type;
  const displayTitle = section.title || typeLabel;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${section.isPublished ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
      {/* Reorder */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-25"
          title="Move up"
        >
          <ChevronUpIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-25"
          title="Move down"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{displayTitle}</p>
        <p className="text-xs text-gray-400">{typeLabel}</p>
      </div>

      {/* Status badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${section.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {section.isPublished ? 'Published' : 'Draft'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePublish}
          className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          title={section.isPublished ? 'Unpublish' : 'Publish'}
        >
          {section.isPublished ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          title="Edit"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
          title="Delete"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main manager component
// ---------------------------------------------------------------------------
export default function LocationSectionManager({ locationId }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const { error: toastError, success: toastSuccess } = useToast();

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await locationSectionAPI.getSections(locationId);
      if (res.success) {
        setSections(res.sections || []);
      }
    } catch (err) {
      toastError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, [locationId, toastError]);

  useEffect(() => {
    if (locationId) loadSections();
  }, [locationId, loadSections]);

  const handleSaved = (section) => {
    setSections(prev => {
      const existing = prev.findIndex(s => s.id === section.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = section;
        return updated;
      }
      return [...prev, section];
    });
    setShowForm(false);
    setEditingSection(null);
    toastSuccess('Section saved');
  };

  const handleDelete = async (section) => {
    if (!window.confirm(`Delete section "${section.title || section.type}"?`)) return;
    try {
      const res = await locationSectionAPI.deleteSection(locationId, section.id);
      if (res.success) {
        setSections(prev => prev.filter(s => s.id !== section.id));
        toastSuccess('Section deleted');
      } else {
        toastError(res.message || 'Failed to delete');
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete');
    }
  };

  const handleTogglePublish = async (section) => {
    try {
      const res = await locationSectionAPI.updateSection(locationId, section.id, {
        isPublished: !section.isPublished
      });
      if (res.success) {
        setSections(prev => prev.map(s => s.id === section.id ? res.section : s));
      } else {
        toastError(res.message || 'Failed to update');
      }
    } catch (err) {
      toastError(err.message || 'Failed to update');
    }
  };

  const handleMove = async (index, direction) => {
    const newSections = [...sections];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];

    // Update sortOrder values to reflect new positions
    const updated = newSections.map((s, i) => ({ ...s, sortOrder: i }));
    setSections(updated);

    try {
      await locationSectionAPI.reorderSections(
        locationId,
        updated.map(s => ({ id: s.id, sortOrder: s.sortOrder }))
      );
    } catch (err) {
      toastError('Failed to save new order');
      loadSections(); // Restore from server
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading sections...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Location Sections</h3>
        {!showForm && !editingSection && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> Add Section
          </button>
        )}
      </div>

      {/* Add new section form */}
      {showForm && (
        <SectionForm
          locationId={locationId}
          onSave={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Section list */}
      {sections.length === 0 && !showForm ? (
        <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-300 rounded-lg">
          No sections yet. Click &ldquo;Add Section&rdquo; to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={section.id}>
              {editingSection?.id === section.id ? (
                <SectionForm
                  locationId={locationId}
                  initial={section}
                  onSave={handleSaved}
                  onCancel={() => setEditingSection(null)}
                />
              ) : (
                <SectionRow
                  section={section}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                  onEdit={() => setEditingSection(section)}
                  onDelete={() => handleDelete(section)}
                  onTogglePublish={() => handleTogglePublish(section)}
                  onMoveUp={() => handleMove(index, -1)}
                  onMoveDown={() => handleMove(index, 1)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
