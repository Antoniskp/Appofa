'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { locationAPI } from '@/lib/api';
import AlertMessage from '@/components/AlertMessage';
import { useAsyncData } from '@/hooks/useAsyncData';

const LOCATION_TYPES = ['international', 'country', 'prefecture', 'municipality'];

function LocationManagementContent() {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: locations, loading, refetch } = useAsyncData(
    async () => {
      const params = {};
      if (filterType) params.type = filterType;
      
      const response = await locationAPI.getAll(params);
      if (response.success) {
        return response.locations || [];
      }
      return [];
    },
    [filterType],
    {
      initialData: [],
      onError: (err) => {
        setError(err || 'Failed to load locations');
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
      });
    }
    setShowModal(true);
    setError('');
    setSuccessMessage('');
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
    setError('');

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
        setSuccessMessage(editingLocation ? 'Location updated successfully!' : 'Location created successfully!');
        handleCloseModal();
        refetch();
      }
    } catch (err) {
      setError(err.message || 'Failed to save location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (location) => {
    if (deleteConfirm !== location.id) {
      setDeleteConfirm(location.id);
      return;
    }

    setError('');
    try {
      const response = await locationAPI.delete(location.id);
      if (response.success) {
        setSuccessMessage('Location deleted successfully!');
        setDeleteConfirm(null);
        refetch();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete location');
      setDeleteConfirm(null);
    }
  };

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = !searchTerm || 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.name_local && loc.name_local.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (loc.code && loc.code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Build hierarchical structure for display
  const buildHierarchy = (locs) => {
    const locMap = new Map(locs.map(loc => [loc.id, { ...loc, children: [] }]));
    const roots = [];

    locs.forEach(loc => {
      const node = locMap.get(loc.id);
      if (loc.parent_id && locMap.has(loc.parent_id)) {
        locMap.get(loc.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const hierarchicalLocations = buildHierarchy(filteredLocations);

  const renderLocationTree = (location, level = 0) => {
    return (
      <div key={location.id}>
        <div className={`border-b border-gray-200 hover:bg-gray-50 ${level > 0 ? 'bg-gray-50' : ''}`}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ paddingLeft: `${1.5 + level * 2}rem` }}>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-gray-900">
                  {location.name}
                  {location.name_local && (
                    <span className="text-gray-500 font-normal ml-2">({location.name_local})</span>
                  )}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {location.type}
                </span>
                {location.code && (
                  <span className="text-xs text-gray-500">Code: {location.code}</span>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {location.lat && location.lng && (
                  <span>Coordinates: {location.lat}, {location.lng}</span>
                )}
                {location.children && location.children.length > 0 && (
                  <span className="ml-4">• {location.children.length} child location{location.children.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenModal(location)}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(location)}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  deleteConfirm === location.id
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-red-600 hover:text-red-800'
                }`}
              >
                {deleteConfirm === location.id ? 'Confirm Delete?' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
        {location.children && location.children.map(child => renderLocationTree(child, level + 1))}
      </div>
    );
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="mt-2 text-gray-600">Manage hierarchical locations for the platform</p>
        </div>

        {error && <AlertMessage message={error} tone="error" className="mb-6" />}
        {successMessage && <AlertMessage message={successMessage} tone="success" className="mb-6" />}

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 flex gap-4 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {LOCATION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Add Location
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredLocations.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No locations found
              </div>
            ) : (
              hierarchicalLocations.map(location => renderLocationTree(location))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
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
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {submitting ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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
