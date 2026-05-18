'use client';

import { useEffect, useRef, useState } from 'react';
import AlertMessage from '@/components/ui/AlertMessage';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';

const SOURCE_TYPES = ['parliament', 'european_commission', 'municipal_council', 'regional_council', 'other'];
const STATUSES = ['open', 'closed', 'archived'];

export default function CivicQuestionForm({
  civicQuestion = null,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
  submitError = '',
  mode = 'create',
}) {
  const t = useTranslations('civicQuestions');
  const { user } = useAuth();
  const hasAutoFilledLocation = useRef(false);
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    originalLink: '',
    sourceType: 'other',
    sourceName: '',
    simplified: '',
    pros: '',
    cons: '',
    dateAsked: '',
    deadline: '',
    status: 'open',
    locationId: null,
    visibility: 'public',
    voteRestriction: 'authenticated',
    resultsVisibility: 'always',
    category: '',
    officialIdentifier: '',
    commissionRequirement: '',
    commentsEnabled: true,
    commentsLocked: false,
  });

  useEffect(() => {
    if (!civicQuestion) return;
    setFormData({
      title: civicQuestion.title || '',
      originalLink: civicQuestion.originalLink || '',
      sourceType: civicQuestion.sourceType || 'other',
      sourceName: civicQuestion.sourceName || '',
      simplified: civicQuestion.simplified || '',
      pros: civicQuestion.pros || '',
      cons: civicQuestion.cons || '',
      dateAsked: civicQuestion.dateAsked ? new Date(civicQuestion.dateAsked).toISOString().slice(0, 16) : '',
      deadline: civicQuestion.deadline ? new Date(civicQuestion.deadline).toISOString().slice(0, 16) : '',
      status: civicQuestion.status || 'open',
      locationId: civicQuestion.locationId || null,
      visibility: civicQuestion.visibility || 'public',
      voteRestriction: civicQuestion.voteRestriction || 'authenticated',
      resultsVisibility: civicQuestion.resultsVisibility || 'always',
      category: civicQuestion.category || '',
      officialIdentifier: civicQuestion.officialIdentifier || '',
      commissionRequirement: civicQuestion.commissionRequirement || '',
      commentsEnabled: civicQuestion.commentsEnabled !== false,
      commentsLocked: civicQuestion.commentsLocked === true,
    });
  }, [civicQuestion]);

  useEffect(() => {
    if (!hasAutoFilledLocation.current && mode === 'create' && user?.homeLocationId && formData.locationId === null) {
      hasAutoFilledLocation.current = true;
      setFormData((prev) => ({ ...prev, locationId: user.homeLocationId }));
    }
  }, [mode, user?.homeLocationId, formData.locationId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (formData.dateAsked && formData.deadline) {
      const askedAt = new Date(formData.dateAsked).getTime();
      const deadlineAt = new Date(formData.deadline).getTime();
      if (Number.isFinite(askedAt) && Number.isFinite(deadlineAt) && deadlineAt <= askedAt) {
        setValidationError(t('form.date_validation_error'));
        return;
      }
    }

    onSubmit({
      ...formData,
      dateAsked: formData.dateAsked || null,
      deadline: formData.deadline || null,
      locationId: formData.locationId || null,
      originalLink: formData.originalLink || null,
      sourceName: formData.sourceName || null,
      simplified: formData.simplified || null,
      pros: formData.pros || null,
      cons: formData.cons || null,
      category: formData.category || null,
      officialIdentifier: formData.officialIdentifier || null,
      commissionRequirement: formData.commissionRequirement || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AlertMessage message={submitError} className="mb-2" />
      <AlertMessage message={validationError} className="mb-2" />

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('form.basic_information')}</h3>
        <div>
          <label htmlFor="civic-question-title" className="block text-sm font-medium text-gray-700">{t('form.title')}</label>
          <input id="civic-question-title" name="title" required maxLength={200} value={formData.title} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label htmlFor="civic-question-original-link" className="block text-sm font-medium text-gray-700">{t('form.original_link')}</label>
          <input id="civic-question-original-link" name="originalLink" type="url" value={formData.originalLink} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label htmlFor="civic-question-source-type" className="block text-sm font-medium text-gray-700">{t('form.source_type')}</label>
          <select id="civic-question-source-type" name="sourceType" value={formData.sourceType} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
            {SOURCE_TYPES.map((type) => <option key={type} value={type}>{t(`source_types.${type}`)}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-500">{t('form.source_type_help')}</p>
        </div>

        <div>
          <label htmlFor="civic-question-source-name" className="block text-sm font-medium text-gray-700">{t('form.source_name')}</label>
          <input id="civic-question-source-name" name="sourceName" value={formData.sourceName} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label htmlFor="civic-question-simplified" className="block text-sm font-medium text-gray-700">{t('form.simplified')}</label>
          <textarea id="civic-question-simplified" name="simplified" rows={4} value={formData.simplified} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          <p className="mt-1 text-xs text-gray-500">{t('form.simplified_help')}</p>
        </div>

        <div>
          <label htmlFor="civic-question-pros" className="block text-sm font-medium text-gray-700">{t('form.pros')}</label>
          <textarea id="civic-question-pros" name="pros" rows={3} value={formData.pros} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          <p className="mt-1 text-xs text-gray-500">{t('form.pros_help')}</p>
        </div>

        <div>
          <label htmlFor="civic-question-cons" className="block text-sm font-medium text-gray-700">{t('form.cons')}</label>
          <textarea id="civic-question-cons" name="cons" rows={3} value={formData.cons} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          <p className="mt-1 text-xs text-gray-500">{t('form.cons_help')}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('form.settings')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="civic-question-date-asked" className="block text-sm font-medium text-gray-700">{t('form.date_asked')}</label>
            <input id="civic-question-date-asked" name="dateAsked" type="datetime-local" max={formData.deadline || undefined} value={formData.dateAsked} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label htmlFor="civic-question-deadline" className="block text-sm font-medium text-gray-700">{t('form.deadline')}</label>
            <input id="civic-question-deadline" name="deadline" type="datetime-local" min={formData.dateAsked || undefined} value={formData.deadline} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
            <p className="mt-1 text-xs text-gray-500">{t('form.deadline_help')}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.location')}</label>
          <CascadingLocationSelector
            value={formData.locationId}
            onChange={(locationId) => setFormData((prev) => ({ ...prev, locationId }))}
            required={false}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="civic-question-visibility" className="block text-sm font-medium text-gray-700">{t('form.visibility')}</label>
            <select id="civic-question-visibility" name="visibility" value={formData.visibility} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
              <option value="public">{t('visibility.public')}</option>
              <option value="private">{t('visibility.private')}</option>
              <option value="locals_only">{t('visibility.locals_only')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="civic-question-vote-restriction" className="block text-sm font-medium text-gray-700">{t('form.vote_restriction')}</label>
            <select id="civic-question-vote-restriction" name="voteRestriction" value={formData.voteRestriction} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
              <option value="anyone">{t('vote_restrictions.anyone')}</option>
              <option value="authenticated">{t('vote_restrictions.authenticated')}</option>
              <option value="locals_only">{t('vote_restrictions.locals_only')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="civic-question-results-visibility" className="block text-sm font-medium text-gray-700">{t('form.results_visibility')}</label>
            <select id="civic-question-results-visibility" name="resultsVisibility" value={formData.resultsVisibility} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
              <option value="always">{t('results_visibility.always')}</option>
              <option value="after_vote">{t('results_visibility.after_vote')}</option>
              <option value="after_deadline">{t('results_visibility.after_deadline')}</option>
            </select>
          </div>
        </div>

        {mode === 'edit' && (
          <div>
            <label htmlFor="civic-question-status" className="block text-sm font-medium text-gray-700">{t('form.status')}</label>
            <select id="civic-question-status" name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
              {STATUSES.map((status) => <option key={status} value={status}>{t(`status.${status}`)}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="civic-question-category" className="block text-sm font-medium text-gray-700">{t('form.category')}</label>
            <input id="civic-question-category" name="category" value={formData.category} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label htmlFor="civic-question-official-identifier" className="block text-sm font-medium text-gray-700">{t('form.official_identifier')}</label>
            <input id="civic-question-official-identifier" name="officialIdentifier" value={formData.officialIdentifier} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <label htmlFor="civic-question-commission-requirement" className="block text-sm font-medium text-gray-700">{t('form.commission_requirement')}</label>
          <input id="civic-question-commission-requirement" name="commissionRequirement" value={formData.commissionRequirement} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" placeholder={t('form.commission_requirement_placeholder')} />
          <p className="mt-1 text-xs text-gray-500">{t('form.commission_requirement_help')}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <input id="civic-question-comments-enabled" type="checkbox" name="commentsEnabled" checked={formData.commentsEnabled} onChange={handleInputChange} />
          <label htmlFor="civic-question-comments-enabled">{t('form.comments_enabled')}</label>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <input id="civic-question-comments-locked" type="checkbox" name="commentsLocked" checked={formData.commentsLocked} onChange={handleInputChange} />
          <label htmlFor="civic-question-comments-locked">{t('form.comments_locked')}</label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? t('form.saving') : mode === 'create' ? t('form.create') : t('form.update')}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">{t('form.cancel')}</button>
        {mode === 'edit' && onDelete && (
          <button type="button" onClick={onDelete} className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">{t('form.delete')}</button>
        )}
      </div>
    </form>
  );
}
