'use client';

import { useEffect, useRef, useState } from 'react';
import AlertMessage from '@/components/ui/AlertMessage';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';
import { useAuth } from '@/lib/auth-context';

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
  const { user } = useAuth();
  const hasAutoFilledLocation = useRef(false);
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
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AlertMessage message={submitError} className="mb-2" />

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input name="title" required maxLength={200} value={formData.title} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />

        <label className="block text-sm font-medium text-gray-700">Original Link</label>
        <input name="originalLink" type="url" value={formData.originalLink} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />

        <label className="block text-sm font-medium text-gray-700">Source Type</label>
        <select name="sourceType" value={formData.sourceType} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
          {SOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>

        <label className="block text-sm font-medium text-gray-700">Source Name</label>
        <input name="sourceName" value={formData.sourceName} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />

        <label className="block text-sm font-medium text-gray-700">Simplified</label>
        <textarea name="simplified" rows={4} value={formData.simplified} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />

        <label className="block text-sm font-medium text-gray-700">Pros</label>
        <textarea name="pros" rows={3} value={formData.pros} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />

        <label className="block text-sm font-medium text-gray-700">Cons</label>
        <textarea name="cons" rows={3} value={formData.cons} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Asked</label>
            <input name="dateAsked" type="datetime-local" value={formData.dateAsked} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <input name="deadline" type="datetime-local" value={formData.deadline} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <CascadingLocationSelector
            value={formData.locationId}
            onChange={(locationId) => setFormData((prev) => ({ ...prev, locationId }))}
            required={false}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Visibility</label>
            <select name="visibility" value={formData.visibility} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="locals_only">locals_only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Vote Restriction</label>
            <select name="voteRestriction" value={formData.voteRestriction} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
              <option value="authenticated">authenticated</option>
              <option value="locals_only">locals_only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Results Visibility</label>
            <select name="resultsVisibility" value={formData.resultsVisibility} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
              <option value="always">always</option>
              <option value="after_vote">after_vote</option>
              <option value="after_deadline">after_deadline</option>
            </select>
          </div>
        </div>

        {mode === 'edit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input name="category" value={formData.category} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Official Identifier</label>
            <input name="officialIdentifier" value={formData.officialIdentifier} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="commentsEnabled" checked={formData.commentsEnabled} onChange={handleInputChange} />
          Comments enabled
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="commentsLocked" checked={formData.commentsLocked} onChange={handleInputChange} />
          Comments locked
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Civic Question' : 'Update Civic Question'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
        {mode === 'edit' && onDelete && (
          <button type="button" onClick={onDelete} className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Delete</button>
        )}
      </div>
    </form>
  );
}
