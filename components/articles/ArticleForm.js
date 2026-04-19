'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { InformationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ConfirmDialog } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import AlertMessage from '@/components/ui/AlertMessage';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';
import TagInput from '@/components/ui/TagInput';
import VideoEmbedField from '@/components/articles/VideoEmbedField';
import { locationAPI, tagAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import { isCategoryRequired } from '@/lib/utils/articleTypes';
import Tooltip from '@/components/ui/Tooltip';
import { useAuth } from '@/lib/auth-context';

export default function ArticleForm({
  article = null,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
  submitError = ''
}) {
  const { user } = useAuth();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const isAdminOrModerator = user?.role === 'admin' || user?.role === 'moderator';
  const contentInputRef = useRef(null);
  const [contentSelection, setContentSelection] = useState({ start: 0, end: 0 });
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    bannerImageUrl: '',
    type: 'personal',
    category: '',
    tags: [],
    status: 'draft',
    hideAuthor: false,
    commentsEnabled: true,
    commentsLocked: false,
    approved: false,
    sourceUrl: '',
    sourceProvider: '',
    sourceMeta: null,
    embedUrl: '',
    embedHtml: '',
  });

  const [linkedLocations, setLinkedLocations] = useState([]);
  const [newLocationId, setNewLocationId] = useState(null);
  const [newLocation, setNewLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  // Track whether the title/summary fields have been manually edited by the user
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [isSummaryDirty, setIsSummaryDirty] = useState(false);
  // Embed preview data from VideoEmbedField
  const [embedPreview, setEmbedPreview] = useState(null);

  // Initialize form data from article prop (edit mode)
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        content: article.content || '',
        summary: article.summary || '',
        bannerImageUrl: article.bannerImageUrl || '',
        type: article.type || 'personal',
        category: article.category || '',
        tags: Array.isArray(article.tags) ? article.tags : [],
        status: article.status || 'draft',
        hideAuthor: Boolean(article.hideAuthor),
        commentsEnabled: article.commentsEnabled !== false,
        commentsLocked: Boolean(article.commentsLocked),
        approved: Boolean(article.newsApprovedAt),
        sourceUrl: article.sourceUrl || '',
        sourceProvider: article.sourceProvider || '',
        sourceMeta: article.sourceMeta || null,
        embedUrl: article.embedUrl || '',
        embedHtml: article.embedHtml || '',
      });
      // If article has a manually set title (no sourceUrl), mark title as dirty
      // so VideoEmbedField won't overwrite it if user pastes a new URL later.
      // If article has sourceUrl, the title came from the video - keep it auto-fillable.
      if (article.title && !article.sourceUrl) {
        setIsTitleDirty(true);
      }
      // Same logic for summary: if it was manually set without a video, mark dirty.
      if (article.summary && !article.sourceUrl) {
        setIsSummaryDirty(true);
      }

      // Load linked locations only when article.id exists (edit mode)
      if (article.id) {
        fetchLinkedLocations(article.id);
      }
    }
  }, [article]);

  // Fetch existing tag suggestions for autocomplete
  useEffect(() => {
    tagAPI.getSuggestions()
      .then((data) => {
        if (data?.tags) setTagSuggestions(data.tags.map((t) => t.name || t));
      })
      .catch(() => {});
  }, []);

  const handleTagSearch = useCallback((query) => {
    const params = query ? { q: query } : {};
    tagAPI.getSuggestions(params)
      .then((data) => {
        if (data?.tags) setTagSuggestions(data.tags.map((t) => t.name || t));
      })
      .catch(() => {});
  }, []);

  const fetchLinkedLocations = async (articleId) => {
    try {
      const response = await locationAPI.getEntityLocations('article', articleId);
      if (response.success) {
        setLinkedLocations(response.locations || []);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  // Fetch location details when newLocationId changes
  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (newLocationId) {
        try {
          const response = await locationAPI.getById(newLocationId);
          if (response.success) {
            setNewLocation(response.location);
          }
        } catch (err) {
          console.error('Failed to load location details:', err);
          setNewLocation(null);
        }
      } else {
        setNewLocation(null);
      }
    };
    
    fetchLocationDetails();
  }, [newLocationId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Track title dirty state - once user edits the title manually, don't auto-fill it
    if (name === 'title') {
      setIsTitleDirty(true);
    }

    // Track summary dirty state - once user edits the summary manually, don't auto-fill it
    if (name === 'summary') {
      setIsSummaryDirty(true);
    }

    // If changing article type, reset category
    if (name === 'type') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        category: '', // Reset category when type changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  /**
   * Called by VideoEmbedField when a preview is fetched.
   * Stores embed data into formData.
   */
  const handleEmbedChange = (previewData) => {
    setEmbedPreview(previewData);
    if (!previewData) {
      setFormData((prev) => ({
        ...prev,
        sourceUrl: '',
        sourceProvider: '',
        sourceMeta: null,
        embedUrl: '',
        embedHtml: ''
      }));
    } else {
      setFormData((prev) => {
        const updates = {
          ...prev,
          sourceUrl: previewData.url || '',
          sourceProvider: previewData.provider || '',
          sourceMeta: previewData,
          embedUrl: previewData.embedUrl || '',
          embedHtml: previewData.embedHtml || ''
        };
        // Auto-suggest summary from video author name if summary is not dirty
        if (!isSummaryDirty && !prev.summary && previewData.authorName) {
          updates.summary = previewData.authorName;
        }
        return updates;
      });
    }
  };

  /**
   * Called by VideoEmbedField to auto-suggest a title (only when title is not dirty).
   */
  const handleTitleSuggest = (suggestedTitle) => {
    if (!isTitleDirty) {
      setFormData((prev) => ({ ...prev, title: suggestedTitle }));
    }
  };

  const handleAddLocation = async () => {
    // Block adding international locations to articles
    if (!newLocationId || newLocation?.type === 'international' || !article?.id) return;

    try {
      const response = await locationAPI.link('article', article.id, newLocationId);
      if (response.success) {
        // Reload locations
        await fetchLinkedLocations(article.id);
        setNewLocationId(null);
        setLocationError('');
      }
    } catch (err) {
      setLocationError(`Αποτυχία σύνδεσης τοποθεσίας: ${err.message}`);
    }
  };

  const handleRemoveLocation = async (locationId) => {
    if (!article?.id) return;

    try {
      const response = await locationAPI.unlink('article', article.id, locationId);
      if (response.success) {
        setLinkedLocations(prev => prev.filter(loc => loc.id !== locationId));
        setLocationError('');
      }
    } catch (err) {
      setLocationError(`Αποτυχία αποσύνδεσης τοποθεσίας: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { approved, ...rest } = formData;
    onSubmit({ ...rest, newsApproved: approved });
  };

  const updateContent = (nextContent) => {
    setFormData((prev) => ({
      ...prev,
      content: nextContent,
    }));
  };

  const updateSelectionFromTextarea = () => {
    const textarea = contentInputRef.current;
    if (!textarea) return;

    setContentSelection({
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? 0,
    });
  };

  const insertAtCursor = (insertText) => {
    const textarea = contentInputRef.current;
    if (!textarea) {
      updateContent(`${formData.content}${insertText}`);
      return;
    }

    const isFocused = document.activeElement === textarea;
    const start = isFocused ? (textarea.selectionStart ?? formData.content.length) : contentSelection.start;
    const end = isFocused ? (textarea.selectionEnd ?? formData.content.length) : contentSelection.end;
    const before = formData.content.slice(0, start);
    const after = formData.content.slice(end);
    const nextValue = `${before}${insertText}${after}`;
    const scrollTop = textarea.scrollTop;

    updateContent(nextValue);

    requestAnimationFrame(() => {
      const nextPosition = start + insertText.length;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(nextPosition, nextPosition);
      textarea.scrollTop = scrollTop;
      setContentSelection({ start: nextPosition, end: nextPosition });
    });
  };

  const wrapSelection = (prefix, suffix, fallbackText = 'text') => {
    const textarea = contentInputRef.current;
    if (!textarea) {
      insertAtCursor(`${prefix}${fallbackText}${suffix}`);
      return;
    }

    const isFocused = document.activeElement === textarea;
    const start = isFocused ? (textarea.selectionStart ?? formData.content.length) : contentSelection.start;
    const end = isFocused ? (textarea.selectionEnd ?? formData.content.length) : contentSelection.end;
    const selectedText = formData.content.slice(start, end) || fallbackText;
    const before = formData.content.slice(0, start);
    const after = formData.content.slice(end);
    const insertion = `${prefix}${selectedText}${suffix}`;
    const nextValue = `${before}${insertion}${after}`;
    const scrollTop = textarea.scrollTop;

    updateContent(nextValue);

    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + selectedText.length;
      textarea.setSelectionRange(selectionStart, selectionEnd);
      textarea.scrollTop = scrollTop;
      setContentSelection({ start: selectionStart, end: selectionEnd });
    });
  };

  const insertHeading = (level) => {
    const prefix = `${'#'.repeat(level)} `;
    insertAtCursor(`\n${prefix}`);
  };

  const handleInsertBulletList = () => {
    insertAtCursor('\n- Item 1\n- Item 2\n');
  };

  const handleInsertNumberedList = () => {
    insertAtCursor('\n1. First item\n2. Second item\n');
  };

  const handleInsertQuote = () => {
    insertAtCursor('\n> Quoted text\n');
  };

  const handleInsertCodeBlock = () => {
    insertAtCursor('\n```\ncode here\n```\n');
  };

  const isSafeMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return false;

    const trimmed = url.trim();
    if (!trimmed) return false;

    try {
      const parsed = new URL(trimmed);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);

  const toYouTubeEmbedUrl = (url) => {
    try {
      const parsed = new URL(url);

      if (parsed.hostname === 'youtu.be') {
        const id = parsed.pathname.replace('/', '').trim();
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com' || parsed.hostname === 'm.youtube.com') {
        const pathParts = parsed.pathname.split('/').filter(Boolean);
        const id = parsed.searchParams.get('v')
          || (pathParts[0] === 'shorts' ? pathParts[1] : null)
          || (pathParts[0] === 'embed' ? pathParts[1] : null);
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      return null;
    } catch {
      return null;
    }
  };

  const toVimeoEmbedUrl = (url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== 'vimeo.com' && parsed.hostname !== 'www.vimeo.com' && parsed.hostname !== 'player.vimeo.com') return null;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    } catch {
      return null;
    }
  };

  const extractMediaUrls = () => {
    const lines = String(formData.content || '').split('\n');
    const medias = [];

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      const imageMatch = line.match(/^!\[(.*?)\]\((.+?)\)$/);
      if (imageMatch) {
        const src = imageMatch[2].trim();
        if (isSafeMediaUrl(src)) {
          medias.push({ type: 'image', src, alt: imageMatch[1] || 'Image' });
        }
      }

      const videoMatch = line.match(/^\[video\]\((.+?)\)$/i);
      if (videoMatch) {
        const src = videoMatch[1].trim();
        if (isSafeMediaUrl(src)) {
          medias.push({ type: 'video', src });
        }
      }
    });

    return medias.slice(0, 3);
  };

  const mediaPreviews = extractMediaUrls();

  const handleInsertLink = () => {
    const textarea = contentInputRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const selectedText = formData.content.slice(start, end).trim();
    const linkText = selectedText || window.prompt('Κείμενο συνδέσμου:', 'Διαβάστε περισσότερα');
    if (!linkText) return;

    const url = window.prompt('URL Συνδέσμου (https://...):', 'https://');
    if (!url) return;

    insertAtCursor(`[${linkText}](${url.trim()})`);
  };

  const handleInsertImage = () => {
    const url = window.prompt('URL Εικόνας (https://...):', 'https://');
    if (!url) return;

    const alt = window.prompt('Λεζάντα/εναλλακτικό κείμενο εικόνας:', 'Εικόνα') || 'Εικόνα';
    insertAtCursor(`\n![${alt}](${url.trim()})\n`);
  };

  const handleInsertVideo = () => {
    const url = window.prompt('URL Βίντεο (YouTube, Vimeo ή απευθείας .mp4):', 'https://');
    if (!url) return;

    insertAtCursor(`\n[video](${url.trim()})\n`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AlertMessage className="mb-6" message={submitError} />

      {/* Video Embed Field — paste a YouTube / TikTok URL to embed it */}
      <VideoEmbedField
        value={formData.sourceUrl}
        onChange={handleEmbedChange}
        onTitleSuggest={handleTitleSuggest}
        isTitleDirty={isTitleDirty}
      />

      <FormInput
        name="title"
        label="Τίτλος"
        value={formData.title}
        onChange={handleInputChange}
        required
        maxLength={200}
        showCharCount
        placeholder="Εισαγάγετε τον τίτλο του άρθρου"
        helpText="Ένας σαφής, περιγραφικός τίτλος για το άρθρο σας"
      />

      <FormInput
        name="summary"
        label="Περίληψη"
        value={formData.summary}
        onChange={handleInputChange}
        placeholder={formData.sourceUrl ? 'Δημιουργός βίντεο / σύντομη περιγραφή (προαιρετικό)' : 'Σύντομη περίληψη (προαιρετικό)'}
      />
 
      {!formData.sourceUrl && (
        <FormInput
          name="bannerImageUrl"
          label="URL Εικόνας Banner"
          value={formData.bannerImageUrl}
          onChange={handleInputChange}
          placeholder="https://example.com/banner.jpg ή /images/yourimage.png"
        />
      )}

      <TagInput
        label="Ετικέτες"
        value={formData.tags}
        onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
        suggestions={tagSuggestions}
        onSearch={handleTagSearch}
        placeholder="π.χ. Τεχνολογία, Έρευνα"
      />

      <FormInput
        name="content"
        type="textarea"
        label="Περιεχόμενο"
        rows={formData.sourceUrl ? 3 : 10}
        value={formData.content}
        onChange={handleInputChange}
        onSelect={updateSelectionFromTextarea}
        onKeyUp={updateSelectionFromTextarea}
        onClick={updateSelectionFromTextarea}
        ref={contentInputRef}
        required={!formData.sourceUrl}
        maxLength={50000}
        showCharCount
        placeholder={formData.sourceUrl ? 'Προσθέστε προαιρετικό σχόλιο για αυτό το βίντεο...' : 'Γράψτε το περιεχόμενο του άρθρου εδώ...'}
        helpText={formData.sourceUrl ? 'Το περιεχόμενο είναι προαιρετικό για αναρτήσεις βίντεο.' : 'Χρησιμοποιήστε τα κουμπιά μορφοποίησης για επικεφαλίδες, έντονο/πλάγιο κείμενο, συνδέσμους, εικόνες και βίντεο.'}
      />

      {!formData.sourceUrl && (
        <div className="-mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Γρήγορη μορφοποίηση</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => insertHeading(2)}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertHeading(3)}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('**', '**', 'bold text')}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Έντονα
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('*', '*', 'italic text')}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm italic text-gray-700 hover:bg-gray-100"
          >
            Πλάγια
          </button>
          <button
            type="button"
            onClick={handleInsertLink}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Σύνδεσμος
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Εικόνα
          </button>
          <button
            type="button"
            onClick={handleInsertVideo}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Βίντεο
          </button>
          <button
            type="button"
            onClick={handleInsertBulletList}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Λίστα
          </button>
          <button
            type="button"
            onClick={handleInsertNumberedList}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Αριθμημένη Λίστα
          </button>
          <button
            type="button"
            onClick={handleInsertQuote}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Παράθεση
          </button>
          <button
            type="button"
            onClick={handleInsertCodeBlock}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Κώδικας
          </button>
        </div>
      </div>
      )}

      {!formData.sourceUrl && mediaPreviews.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Προεπισκόπηση πολυμέσων</p>
          <div className="space-y-3">
            {mediaPreviews.map((media, index) => {
              if (media.type === 'image' && isImageUrl(media.src)) {
                return (
                  <img
                    key={`${media.src}-${index}`}
                    src={media.src}
                    alt={media.alt}
                    className="w-full max-h-48 object-cover rounded border border-gray-200"
                  />
                );
              }

              if (media.type === 'video') {
                const youtubeEmbed = toYouTubeEmbedUrl(media.src);
                const vimeoEmbed = toVimeoEmbedUrl(media.src);
                const embed = youtubeEmbed || vimeoEmbed;

                if (embed) {
                  return (
                    <div key={`${media.src}-${index}`} className="relative w-full overflow-hidden rounded-lg" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={embed}
                        title="Προεπισκόπηση βίντεο"
                        className="absolute left-0 top-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                }

                return (
                  <video key={`${media.src}-${index}`} controls className="w-full rounded border border-gray-200">
                    <source src={media.src} />
                  </video>
                );
              }

              return (
                <p key={`${media.src}-${index}`} className="text-sm text-gray-600 break-all">
                  URL Πολυμέσου: {media.src}
                </p>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Τύπος Άρθρου
            </label>
            <Tooltip content="Επιλέξτε τον τύπο του άρθρου. 'Νέα' για ειδήσεις, 'Άρθρα' για εκπαιδευτικό περιεχόμενο.">
              <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <FormSelect
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            showPlaceholder={false}
            options={Object.values(articleCategories.articleTypes).map((articleType) => ({
              value: articleType.value,
              label: `${articleType.labelEl} (${articleType.label})`
            }))}
            helpText={articleCategories.articleTypes[formData.type]?.description}
          />
        </div>

        {articleCategories.articleTypes[formData.type]?.categories.length > 0 ? (
          <FormSelect
            name="category"
            label="Κατηγορία"
            value={formData.category}
            onChange={handleInputChange}
            required={isCategoryRequired(formData.type, articleCategories)}
            options={articleCategories.articleTypes[formData.type].categories}
            placeholder="Επιλέξτε κατηγορία..."
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Κατηγορία
            </label>
            <input
              type="text"
              disabled
              value="Δεν απαιτείται"
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          name="status"
          label="Κατάσταση"
          value={formData.status}
          onChange={handleInputChange}
          showPlaceholder={false}
          options={[
            { value: 'draft', label: 'Πρόχειρο' },
            { value: 'published', label: 'Δημοσιευμένο' },
            { value: 'archived', label: 'Αρχειοθετημένο' }
          ]}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="hideAuthor"
          checked={formData.hideAuthor}
          onChange={handleInputChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">Απόκρυψη ονόματος συντάκτη σε αυτό το άρθρο</span>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Ρυθμίσεις Σχολίων</p>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="commentsEnabled"
            checked={formData.commentsEnabled}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Ενεργοποίηση σχολίων σε αυτό το άρθρο</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="commentsLocked"
            checked={formData.commentsLocked}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Κλείδωμα σχολίων (δεν επιτρέπονται νέα σχόλια)</span>
        </div>
      </div>

      {isAdminOrModerator && (
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-red-700">Ρυθμίσεις Έγκρισης</p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="approved"
              checked={formData.approved}
              onChange={handleInputChange}
              className="h-4 w-4 accent-red-600 border-red-300 rounded focus:ring-red-500"
            />
            <span className="text-sm font-medium text-red-700">Εγκεκριμένο</span>
          </div>
        </div>
      )}

      {/* Locations Section - Only show in edit mode when article.id exists */}
      {article?.id ? (
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Τοποθεσίες
          </label>
          
          {locationError && (
            <AlertMessage message={locationError} className="mb-3" />
          )}
          
          {/* Linked Locations */}
          {linkedLocations.length > 0 && (
            <div className="mb-3 space-y-2">
              {linkedLocations.map(location => (
                <div key={location.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div>
                    <span className="font-medium text-gray-900">{location.name}</span>
                    {location.name_local && (
                      <span className="text-gray-500 ml-2">({location.name_local})</span>
                    )}
                    <span className="ml-2">
                      <Badge variant="primary">{location.type}</Badge>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(location.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Αφαίρεση
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Location */}
          <div className="flex gap-2">
            <div className="flex-1">
              <CascadingLocationSelector
                value={newLocationId}
                onChange={setNewLocationId}
                placeholder="Επιλέξτε τοποθεσία"
                allowClear={true}
              />
            </div>
            <button
              type="button"
              onClick={handleAddLocation}
              disabled={!newLocationId || newLocation?.type === 'international'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Προσθήκη
            </button>
          </div>
        </div>
      ) : (
        /* Create mode - show informational message about locations */
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Τοποθεσίες
          </label>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold" aria-label="Information">ℹ️ Σημείωση:</span> Οι τοποθεσίες μπορούν να προστεθούν μετά τη δημιουργία του άρθρου. 
              Θα ανακατευθυνθείτε στη σελίδα επεξεργασίας όπου μπορείτε να συνδέσετε τοποθεσίες με το άρθρο σας.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSubmitting ? (article ? 'Αποθήκευση...' : 'Δημιουργία...') : (article ? 'Αποθήκευση Αλλαγών' : 'Δημιουργία Άρθρου')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition"
        >
          Ακύρωση
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="ml-auto flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
          >
            <TrashIcon className="h-4 w-4" />
            Διαγραφή Άρθρου
          </button>
        )}
      </div>

      {onDelete && (
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={onDelete}
          title="Διαγραφή Άρθρου"
          message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το άρθρο; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
          confirmText="Διαγραφή Άρθρου"
          cancelText="Ακύρωση"
          variant="danger"
        />
      )}
    </form>
  );
}
