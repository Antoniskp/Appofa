'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { locationAPI, locationRequestAPI } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import AdminTable from '@/components/admin/AdminTable';
import AdminHeader from '@/components/admin/AdminHeader';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import AdminLayout from '@/components/admin/AdminLayout';
import LocationSelector from '@/components/ui/LocationSelector';

const LOCATION_TYPES = ['international', 'country', 'prefecture', 'municipality'];

const PARENT_TYPE_MAP = {
  country: 'international',
  prefecture: 'country',
  municipality: 'prefecture',
  international: null,
};

const PARENT_HINT_MAP = {
  country: 'Select the international region this country belongs to',
  prefecture: 'Select the country this prefecture belongs to',
  municipality: 'Select the prefecture this municipality belongs to',
};

function LocationManagementContent() {
  const { success, error: toastError } = useToast();
  const {
    filters,
    handleFilterChange,
  } = useFilters({
    search: '',
    type: '',
  });
  const [activeTab, setActiveTab] = useState('locations');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_local: '',
    type: 'municipality',
    parent_id: '',
    code: '',
    lat: '',
    lng: '',
    wikipedia_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('pending');

  const { data: locations, loading, refetch } = useAsyncData(
    async () => {
      const params = {};
      if (filters.type) params.type = filters.type;
      
      const response = await locationAPI.getAll(params);
      if (response.success) {
        return response.locations || [];
      }
      return [];
    },
    [filters.type],
    {
      initialData: [],
      onError: (err) => {
        toastError(err || 'Failed to load locations');
      }
    }
  );

  const { data: locationRequests, loading: requestsLoading, refetch: refetchRequests } = useAsyncData(
    async () => {
      const params = {};
      if (requestStatusFilter) params.status = requestStatusFilter;
      const response = await locationRequestAPI.getAll(params);
      if (response.success) {
        return response.requests || [];
      }
      return [];
    },
    [requestStatusFilter],
    {
      initialData: [],
      onError: (err) => {
        toastError(err || 'Failed to load country requests');
      }
    }
  );

  const handleRequestStatusUpdate = async (requestId, status) => {
    try {
      const response = await locationRequestAPI.update(requestId, { status });
      if (response.success) {
        success(`Request marked as ${status}`);
        refetchRequests();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update request');
    }
  };

  const handleOpenModal = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name || '',
        name_local: location.name_local || '',
        type: location.type || 'municipality',
        parent_id: location.parent_id || '',
        code: location.code || '',
        lat: location.lat || '',
        lng: location.lng || '',
        wikipedia_url: location.wikipedia_url || '',
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        name_local: '',
        type: 'municipality',
        parent_id: '',
        code: '',
        lat: '',
        lng: '',
        wikipedia_url: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocation(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({ ...prev, type: newType, parent_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
      };

      if (payload.type !== 'international' && !payload.parent_id) {
        toastError(`A ${payload.type} requires a parent location.`);
        setSubmitting(false);
        return;
      }

      let response;
      if (editingLocation) {
        response = await locationAPI.update(editingLocation.id, payload);
      } else {
        response = await locationAPI.create(payload);
      }

      if (response.success) {
        success(editingLocation ? 'Location updated successfully!' : 'Location created successfully!');
        handleCloseModal();
        refetch();
      }
    } catch (err) {
      toastError(err.message || 'Failed to save location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (location) => {
    try {
      const response = await locationAPI.delete(location.id);
      if (response.success) {
        success('Location deleted successfully!');
        refetch();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete location');
    }
  };

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = !filters.search || 
      loc.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (loc.name_local && loc.name_local.toLowerCase().includes(filters.search.toLowerCase())) ||
      (loc.code && loc.code.toLowerCase().includes(filters.search.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading && activeTab === 'locations') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">Loading locations...</p>
      </div>
    );
  }

  const pendingRequestsCount = locationRequests.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout>
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader
          title="Location Management"
          subtitle="Manage hierarchical locations for the platform"
          actionText={activeTab === 'locations' ? 'Add Location' : undefined}
          onAction={activeTab === 'locations' ? () => handleOpenModal() : undefined}
        />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'locations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Locations
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'requests'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Country Requests
            {pendingRequestsCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'locations' && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input
                type="text"
                placeholder="Search locations..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {LOCATION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <AdminTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'name_local', header: 'Local Name' },
              {
                key: 'type',
                header: 'Type',
                render: (loc) => <Badge variant="primary">{loc.type}</Badge>
              },
              {
                key: 'parent',
                header: 'Parent',
                render: (loc) => loc.parent?.name || '-'
              },
              {
                key: 'code',
                header: 'Code',
                render: (loc) => loc.code || '-'
              },
              {
                key: 'coordinates',
                header: 'Coordinates',
                render: (loc) => (
                  loc.lat && loc.lng ? `${loc.lat}, ${loc.lng}` : '-'
                )
              },
            ]}
            data={filteredLocations}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            loading={loading}
            emptyMessage="No locations found. Create one to get started."
          />
        </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200 flex items-center gap-4">
              <select
                value={requestStatusFilter}
                onChange={e => setRequestStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <span className="text-sm text-gray-500">
                {locationRequests.length} request{locationRequests.length !== 1 ? 's' : ''}
              </span>
            </div>

            {requestsLoading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading requests...</div>
            ) : locationRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No country requests found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {locationRequests.map(req => (
                  <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{req.countryName}</span>
                        {req.countryNameLocal && (
                          <span className="text-sm text-gray-500">({req.countryNameLocal})</span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.notes && (
                        <p className="text-sm text-gray-600 mb-1">{req.notes}</p>
                      )}
                      <div className="text-xs text-gray-400">
                        Submitted by{' '}
                        {req.requestedBy
                          ? (req.requestedBy.username || `user #${req.requestedBy.id}`)
                          : 'anonymous'}{' '}
                        · {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleRequestStatusUpdate(req.id, 'approved')}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestStatusUpdate(req.id, 'rejected')}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              form="location-form"
              loading={submitting}
            >
              {editingLocation ? 'Update Location' : 'Create Location'}
            </Button>
          </>
        }
      >
        <form id="location-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (English) *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local Name
              </label>
              <input
                type="text"
                name="name_local"
                value={formData.name_local}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              >
                {LOCATION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., JP-13"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {formData.type !== 'international' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Location <span className="text-red-500">*</span>
            </label>
            <LocationSelector
              value={formData.parent_id || null}
              onChange={(id) => setFormData(prev => ({ ...prev, parent_id: id ?? '' }))}
              filterType={PARENT_TYPE_MAP[formData.type]}
              placeholder={`Select parent ${PARENT_TYPE_MAP[formData.type] || 'location'}...`}
              allowClear={true}
            />
            <p className="mt-1 text-xs text-gray-500">
              {PARENT_HINT_MAP[formData.type]}
            </p>
          </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                name="lat"
                value={formData.lat}
                onChange={handleInputChange}
                placeholder="35.6762"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                name="lng"
                value={formData.lng}
                onChange={handleInputChange}
                placeholder="139.6503"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wikipedia URL
            </label>
            <input
              type="url"
              name="wikipedia_url"
              value={formData.wikipedia_url}
              onChange={handleInputChange}
              placeholder="https://en.wikipedia.org/wiki/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Link to the Wikipedia article for this location
            </p>
          </div>
        </form>
      </Modal>
    </div>
    </AdminLayout>
  );
}

export default function LocationManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <LocationManagementContent />
    </ProtectedRoute>
  );
}
