'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopNav from '@/components/TopNav';
import AlertMessage from '@/components/AlertMessage';

export default function LocationsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <LocationsManagement />
    </ProtectedRoute>
  );
}

function LocationsManagement() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    name_local: '',
    type: 'country',
    parent_id: '',
    code: '',
    slug: '',
    lat: '',
    lng: ''
  });

  useEffect(() => {
    loadLocations();
  }, [filterType, searchTerm]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '1000');
      
      const response = await fetch(`/api/locations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLocations(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const url = editingLocation 
        ? `/api/locations/${editingLocation.id}`
        : '/api/locations';
      const method = editingLocation ? 'PUT' : 'POST';
      
      const body = { ...formData };
      Object.keys(body).forEach(key => {
        if (body[key] === '') body[key] = null;
      });
      if (body.parent_id) body.parent_id = parseInt(body.parent_id);
      if (body.lat) body.lat = parseFloat(body.lat);
      if (body.lng) body.lng = parseFloat(body.lng);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingLocation ? 'Location updated successfully' : 'Location created successfully');
        setShowForm(false);
        setEditingLocation(null);
        resetForm();
        loadLocations();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save location');
    }
  };

  const handleDelete = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': getCsrfToken()
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Location deleted successfully');
        loadLocations();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete location');
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name || '',
      name_local: location.name_local || '',
      type: location.type || 'country',
      parent_id: location.parent_id || '',
      code: location.code || '',
      slug: location.slug || '',
      lat: location.lat || '',
      lng: location.lng || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_local: '',
      type: 'country',
      parent_id: '',
      code: '',
      slug: '',
      lat: '',
      lng: ''
    });
  };

  const getCsrfToken = () => {
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(c => c.trim().startsWith('csrf_token='));
    return csrfCookie ? csrfCookie.split('=')[1] : '';
  };

  const typeLabels = {
    international: 'International',
    country: 'Country',
    prefecture: 'Prefecture/State',
    municipality: 'Municipality/City'
  };

  return (
    <>
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="mt-2 text-gray-600">
            Manage hierarchical locations for the application
          </p>
        </div>

        {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
        {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => {
              setEditingLocation(null);
              resetForm();
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add New Location'}
          </button>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Types</option>
            <option value="international">International</option>
            <option value="country">Country</option>
            <option value="prefecture">Prefecture/State</option>
            <option value="municipality">Municipality/City</option>
          </select>
          
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {showForm && (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local Name</label>
                <input type="text" value={formData.name_local} onChange={(e) => setFormData({ ...formData, name_local: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="international">International</option>
                  <option value="country">Country</option>
                  <option value="prefecture">Prefecture/State</option>
                  <option value="municipality">Municipality/City</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Location ID</label>
                <input type="number" value={formData.parent_id} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Leave empty for top-level" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code (ISO/Official)</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input type="number" step="any" value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input type="number" step="any" value={formData.lng} onChange={(e) => setFormData({ ...formData, lng: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingLocation ? 'Update' : 'Create'} Location</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingLocation(null); resetForm(); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No locations found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map(location => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      {location.name_local && (<div className="text-sm text-gray-500">{location.name_local}</div>)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{typeLabels[location.type]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.code || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.parent ? location.parent.name : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(location)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                      <button onClick={() => handleDelete(location.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
