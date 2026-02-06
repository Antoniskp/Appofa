'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { locationAPI } from '@/lib/api';
import Badge from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import AdminTable from '@/components/admin/AdminTable';
import AdminHeader from '@/components/admin/AdminHeader';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

const LOCATION_TYPES = ['international', 'country', 'prefecture', 'municipality'];

function LocationManagementContent() {
  const { success, error: toastError } = useToast();
  const {
    filters,
    handleFilterChange,
  } = useFilters({
    search: '',
    type: '',
  });
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">Loading locations...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader
          title="Location Management"
          subtitle="Manage hierarchical locations for the platform"
          actionText="Add Location"
          onAction={() => handleOpenModal()}
        />

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
                onChange={handleInputChange}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Location ID
            </label>
            <input
              type="number"
              name="parent_id"
              value={formData.parent_id}
              onChange={handleInputChange}
              placeholder="Leave empty for top-level location"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the ID of the parent location (e.g., country for prefecture)
            </p>
          </div>

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
  );
}

export default function LocationManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <LocationManagementContent />
    </ProtectedRoute>
  );
}
