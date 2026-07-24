export const MAP_ISSUE_TYPES = [
  {
    value: 'pothole',
    label: 'Pothole',
    color: '#dc2626'
  },
  {
    value: 'neglected_building',
    label: 'Neglected building',
    color: '#7c3aed'
  },
  {
    value: 'broken_lighting',
    label: 'Broken lighting',
    color: '#ca8a04'
  },
  {
    value: 'sidewalk_access',
    label: 'Sidewalk access',
    color: '#0891b2'
  },
  {
    value: 'trash',
    label: 'Trash',
    color: '#16a34a'
  },
  {
    value: 'unsafe_crossing',
    label: 'Unsafe crossing',
    color: '#ea580c'
  },
  {
    value: 'flooding',
    label: 'Flooding',
    color: '#2563eb'
  },
  {
    value: 'illegal_dumping',
    label: 'Illegal dumping',
    color: '#4b5563'
  },
  {
    value: 'graffiti_vandalism',
    label: 'Graffiti / vandalism',
    color: '#db2777'
  },
  {
    value: 'abandoned_vehicle',
    label: 'Abandoned vehicle',
    color: '#475569'
  },
  {
    value: 'noise',
    label: 'Noise',
    color: '#9333ea'
  },
  {
    value: 'other',
    label: 'Other',
    color: '#0f766e'
  }
];

export const MAP_ISSUE_TYPE_LABELS = MAP_ISSUE_TYPES.reduce((acc, issue) => {
  acc[issue.value] = issue.label;
  return acc;
}, {});

export const MAP_ISSUE_TYPE_COLORS = MAP_ISSUE_TYPES.reduce((acc, issue) => {
  acc[issue.value] = issue.color;
  return acc;
}, {});
