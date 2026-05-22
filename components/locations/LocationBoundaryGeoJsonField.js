'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

const SUPPORTED_GEOMETRIES = new Set(['Polygon', 'MultiPolygon']);
const DEFAULT_CENTER = [38.5, 23.8];

function buildTemplateProperties(locationMeta = {}) {
  return {
    locationId: locationMeta.id ?? '',
    slug: locationMeta.slug ?? '',
    name: locationMeta.name ?? '',
    nameLocal: locationMeta.nameLocal ?? '',
  };
}

function buildTemplate(geometryType, locationMeta) {
  const polygonCoordinates = [
    [
      [23.72, 37.98],
      [23.73, 37.98],
      [23.73, 37.99],
      [23.72, 37.99],
      [23.72, 37.98]
    ]
  ];
  const geometry = geometryType === 'MultiPolygon'
    ? { type: 'MultiPolygon', coordinates: [polygonCoordinates] }
    : { type: 'Polygon', coordinates: polygonCoordinates };

  return {
    type: 'Feature',
    properties: buildTemplateProperties(locationMeta),
    geometry
  };
}

function stringifyGeojson(value) {
  if (!value || typeof value !== 'object') return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

function isCoordinatePair(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(Number(value[0]))
    && Number.isFinite(Number(value[1]));
}

function containsCoordinatePair(value) {
  if (!Array.isArray(value) || value.length === 0) return false;
  if (isCoordinatePair(value)) return true;
  return value.some((entry) => containsCoordinatePair(entry));
}

function validateGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') {
    return { isValid: false, message: 'GeoJSON geometry is missing.' };
  }
  if (!SUPPORTED_GEOMETRIES.has(geometry.type)) {
    return {
      isValid: false,
      message: 'Unsupported geometry type. Use Polygon or MultiPolygon.'
    };
  }
  if (!containsCoordinatePair(geometry.coordinates)) {
    return { isValid: false, message: 'Geometry coordinates are empty or invalid.' };
  }
  return { isValid: true };
}

function normalizeGeojson(value) {
  if (!value || typeof value !== 'object') {
    return { isValid: false, message: 'GeoJSON must be an object.' };
  }

  if (value.type === 'FeatureCollection') {
    if (!Array.isArray(value.features) || value.features.length === 0) {
      return { isValid: false, message: 'FeatureCollection must include at least one Feature.' };
    }
    for (const feature of value.features) {
      if (!feature || feature.type !== 'Feature') {
        return { isValid: false, message: 'FeatureCollection contains an invalid Feature.' };
      }
      const geometryValidation = validateGeometry(feature.geometry);
      if (!geometryValidation.isValid) return geometryValidation;
    }
    return { isValid: true, normalized: value };
  }

  if (value.type === 'Feature') {
    const geometryValidation = validateGeometry(value.geometry);
    if (!geometryValidation.isValid) return geometryValidation;
    return {
      isValid: true,
      normalized: { type: 'FeatureCollection', features: [value] }
    };
  }

  const geometryValidation = validateGeometry(value);
  if (!geometryValidation.isValid) {
    return {
      isValid: false,
      message: 'GeoJSON must be a FeatureCollection, Feature, Polygon, or MultiPolygon.'
    };
  }

  return {
    isValid: true,
    normalized: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: value }]
    }
  };
}

function collectBoundsCoordinates(value, collectedCoordinates) {
  if (!Array.isArray(value)) return;
  if (isCoordinatePair(value)) {
    collectedCoordinates.push([Number(value[0]), Number(value[1])]);
    return;
  }
  value.forEach((child) => collectBoundsCoordinates(child, collectedCoordinates));
}

function getGeojsonBounds(featureCollection) {
  const pairs = [];
  (featureCollection?.features || []).forEach((feature) => {
    collectBoundsCoordinates(feature?.geometry?.coordinates, pairs);
  });

  if (pairs.length === 0) return null;
  const lngs = pairs.map(([lng]) => lng);
  const lats = pairs.map(([, lat]) => lat);
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}

export default function LocationBoundaryGeoJsonField({
  value,
  onChange,
  onValidationChange,
  locationMeta = {},
  sectionTitle = 'Boundary / GeoJSON'
}) {
  const [inputValue, setInputValue] = useState(() => stringifyGeojson(value));
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const lastExternalTextRef = useRef(stringifyGeojson(value));

  useEffect(() => {
    const externalText = stringifyGeojson(value);
    if (externalText !== lastExternalTextRef.current) {
      lastExternalTextRef.current = externalText;
      setInputValue(externalText);
    }
  }, [value]);

  const validation = useMemo(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return {
        isValid: true,
        message: 'No boundary provided yet. You can add one gradually per location.',
        normalized: null
      };
    }
    try {
      const parsed = JSON.parse(trimmed);
      const normalized = normalizeGeojson(parsed);
      if (!normalized.isValid) {
        return { isValid: false, message: normalized.message, normalized: null };
      }
      return {
        isValid: true,
        message: 'GeoJSON is valid. Preview below before saving.',
        normalized: normalized.normalized
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Invalid JSON: ${error.message}`,
        normalized: null
      };
    }
  }, [inputValue]);

  useEffect(() => {
    onValidationChange?.({
      isValid: validation.isValid,
      hasValue: Boolean(inputValue.trim()),
      message: validation.message
    });
  }, [inputValue, onValidationChange, validation.isValid, validation.message]);

  const previewBounds = useMemo(() => getGeojsonBounds(validation.normalized), [validation.normalized]);
  const previewCenter = previewBounds
    ? [(previewBounds.north + previewBounds.south) / 2, (previewBounds.east + previewBounds.west) / 2]
    : DEFAULT_CENTER;

  const updateWithParsedText = (text) => {
    setInputValue(text);
    try {
      const parsed = JSON.parse(text);
      const normalized = normalizeGeojson(parsed);
      if (normalized.isValid) {
        onChange(normalized.normalized);
      }
    } catch {
      // keep previous valid value in parent until JSON is corrected
    }
  };

  const handleLoadTemplate = (geometryType) => {
    const template = buildTemplate(geometryType, locationMeta);
    const nextText = JSON.stringify(template, null, 2);
    setUploadError('');
    updateWithParsedText(nextText);
  };

  const handleCopyTemplate = async () => {
    const template = buildTemplate('Polygon', locationMeta);
    try {
      await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    } catch {
      setUploadError('Could not copy template automatically. Please copy from the textarea.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.geojson$|\.json$/i.test(file.name)) {
      setUploadError('Unsupported file type. Use .geojson or .json.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const text = await file.text();
      setUploadError('');
      updateWithParsedText(text);
    } catch {
      setUploadError('Failed to read file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{sectionTitle}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLoadTemplate('Polygon')}
            className="px-2.5 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-white"
          >
            Load Polygon Template
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('MultiPolygon')}
            className="px-2.5 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-white"
          >
            Load MultiPolygon Template
          </button>
          <button
            type="button"
            onClick={handleCopyTemplate}
            className="px-2.5 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-white"
          >
            Copy Starter Template
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-600 mb-3 space-y-1">
        <p>Use this section to improve boundaries one location at a time (paste or upload GeoJSON).</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>GeoJSON coordinates must be in <span className="font-medium">[longitude, latitude]</span> order.</li>
          <li>Supported geometry types: <span className="font-medium">Polygon</span> and <span className="font-medium">MultiPolygon</span>.</li>
          <li>You can save a location without boundary data and come back later.</li>
        </ul>
      </div>

      <textarea
        value={inputValue}
        onChange={(event) => updateWithParsedText(event.target.value)}
        rows={12}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Paste GeoJSON here..."
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-white"
        >
          Upload .geojson / .json
        </button>
        {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
      </div>

      <div className={`mt-3 text-xs rounded-md px-3 py-2 border ${
        validation.isValid
          ? 'text-green-800 bg-green-50 border-green-200'
          : 'text-red-800 bg-red-50 border-red-200'
      }`}>
        {validation.message}
      </div>

      {validation.normalized && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-2">Boundary preview</p>
          <BaseMap
            center={previewCenter}
            bounds={previewBounds || undefined}
            zoom={7}
            className="h-64 w-full rounded-lg overflow-hidden border border-gray-200"
            polygonLayers={[
              {
                id: 'location-boundary-preview',
                geojson: validation.normalized,
                fitBoundsOnClick: true,
                getTooltip: () => locationMeta.name || locationMeta.nameLocal || 'Location boundary'
              }
            ]}
          />
        </div>
      )}
    </div>
  );
}
