const { Op, fn, col } = require('sequelize');
const { Location, Suggestion, Poll, LocationSection, Article, LocationLink, VideoPin } = require('../models');

const fields = ['id', 'name', 'name_local', 'slug', 'type', 'parent_id', 'lat', 'lng'];
const point = item => item?.lat != null && item?.lng != null && item.lat !== '' && item.lng !== ''
  && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))
  && Math.abs(Number(item.lat)) <= 90 && Math.abs(Number(item.lng)) <= 180;
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const empty = () => ({ issues: 0, polls: 0, cameras: 0, news: 0, live: 0 });

// This feed is always public, including when the visitor is an administrator.
exports.list = async (req, res) => {
  const { locationId, search, layer = 'issues', detail = 'false', page = '1' } = req.query;
  const values = ['north', 'south', 'east', 'west'].map(key => req.query[key]);
  const hasBounds = values.some(value => value !== undefined);
  if ((locationId !== undefined && (typeof locationId !== 'string' || !/^\d+$/.test(locationId) || !Number.isSafeInteger(Number(locationId)) || Number(locationId) < 1))
    || (search !== undefined && (typeof search !== 'string' || search.length > 100))
    || !['issues', 'polls', 'cameras', 'news', 'live'].includes(layer) || !['true', 'false'].includes(detail)
    || typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page))
    || (detail === 'true' && !hasBounds)
    || (hasBounds && (values.some(value => typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)))
      || Math.abs(Number(values[0])) > 90 || Math.abs(Number(values[1])) > 90 || Number(values[0]) < Number(values[1])
      || Math.abs(Number(values[2])) > 180 || Math.abs(Number(values[3])) > 180))) {
    return res.status(400).json({ success: false, message: 'Invalid map query.' });
  }
  try {
    const all = await Location.findAll({ attributes: fields, raw: true });
    const country = all.find(location => location.type === 'country' && location.slug === 'greece')
      || await Location.findOne({ where: { type: 'country', code: 'GR' }, attributes: fields, raw: true });
    if (!country) return res.json({ success: true, location: null, areas: [], totals: empty(), items: [], pagination: { total: 0, page: 1, totalPages: 0 } });
    const children = new Map();
    all.forEach(location => children.set(location.parent_id, [...(children.get(location.parent_id) || []), location]));
    const descendants = root => {
      const ids = new Set([root]);
      const queue = [root];
      for (let i = 0; i < queue.length; i++) (children.get(queue[i]) || []).forEach(child => {
        if (!ids.has(child.id)) { ids.add(child.id); queue.push(child.id); }
      });
      return [...ids];
    };
    const countryIds = new Set(descendants(country.id));
    if (search !== undefined) {
      const term = normalize(search.trim());
      return res.json({ success: true, locations: term ? all.filter(location => countryIds.has(location.id)
        && normalize(`${location.name} ${location.name_local || ''}`).includes(term)).slice(0, 20) : [] });
    }
    const rootId = locationId ? Number(locationId) : country.id;
    if (!countryIds.has(rootId)) return res.status(404).json({ success: false, message: 'Location not found.' });
    const ids = descendants(rootId);
    const root = await Location.findByPk(rootId, { attributes: [...fields, 'boundary_geojson', 'bounding_box'], raw: true });
    // SQLite raw JSON columns are strings; consumers need a bounds object.
    if (typeof root.bounding_box === 'string') {
      try { root.bounding_box = JSON.parse(root.bounding_box); } catch { root.bounding_box = null; }
    }
    const issueWhere = { visibility: 'public', locationId: { [Op.in]: ids }, status: { [Op.in]: ['open', 'under_review'] },
      mapLat: { [Op.between]: [-90, 90] }, mapLng: { [Op.between]: [-180, 180] } };
    const pollWhere = { visibility: 'public', locationId: { [Op.in]: ids }, status: 'active',
      [Op.or]: [{ deadline: null }, { deadline: { [Op.gt]: new Date() } }] };
    const groupCount = (model, where) => model.findAll({ where, attributes: ['locationId', [fn('COUNT', col('id')), 'count']], group: ['locationId'], raw: true });
    const [issueCounts, pollCounts, sections, areaRows, newsArticles, livePins] = await Promise.all([
      groupCount(Suggestion, issueWhere), groupCount(Poll, pollWhere),
      LocationSection.findAll({ where: { locationId: { [Op.in]: ids }, type: 'webcams', isPublished: true }, attributes: ['id', 'locationId', 'content'], order: [['id', 'ASC']] }),
      Location.findAll({ where: { parent_id: rootId, type: { [Op.ne]: 'electoral_district' } }, attributes: [...fields, 'boundary_geojson', 'bounding_box'], raw: true }),
      Article.findAll({ where: { type: 'news', status: 'published', newsApprovedAt: { [Op.ne]: null } },
        attributes: ['id', 'title', 'newsApprovedAt'], order: [['newsApprovedAt', 'DESC'], ['id', 'DESC']], raw: true }),
      VideoPin.findAll({ where: { contentType: 'live', status: 'approved',
        [Op.and]: [
          { [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }] },
          { [Op.or]: [{ locationId: { [Op.in]: ids } }, ...(rootId === country.id ? [{ locationId: null, lat: { [Op.between]: [34.5, 42] }, lng: { [Op.between]: [19, 30] } }] : [])] },
        ] }, attributes: ['id', 'title', 'lat', 'lng', 'locationId', 'expiresAt'], order: [['createdAt', 'DESC'], ['id', 'DESC']], raw: true }),
    ]);
    const newsLinks = newsArticles.length ? await LocationLink.findAll({
      where: { entity_type: 'article', entity_id: { [Op.in]: newsArticles.map(article => article.id) }, location_id: { [Op.in]: ids } },
      attributes: ['entity_id', 'location_id'], raw: true,
    }) : [];
    const byId = new Map(all.map(location => [location.id, location]));
    const cameras = sections.flatMap(section => (Array.isArray(section.content?.webcams) ? section.content.webcams : []).map((camera, index) => {
      const exact = point(camera);
      const source = byId.get(section.locationId);
      return { id: `camera-${section.id}:${index}`, title: camera.label, href: camera.url, kind: 'cameras',
        locationId: section.locationId, location: source, lat: exact ? Number(camera.lat) : source?.lat,
        lng: exact ? Number(camera.lng) : source?.lng, approximate: !exact, isWorking: camera.isWorking !== false };
    }).filter(camera => {
      try { return ['https:', 'http:'].includes(new URL(camera.href).protocol); } catch { return false; }
    }));
    const counts = new Map(ids.map(id => [id, empty()]));
    issueCounts.forEach(row => { counts.get(row.locationId).issues = Number(row.count); });
    pollCounts.forEach(row => { counts.get(row.locationId).polls = Number(row.count); });
    cameras.forEach(camera => { counts.get(camera.locationId).cameras += 1; });
    livePins.forEach(pin => { counts.get(pin.locationId || country.id).live += 1; });
    const summarize = scope => scope.reduce((total, id) => {
      for (const key of Object.keys(total)) total[key] += counts.get(id)?.[key] || 0;
      return total;
    }, { ...empty(), news: new Set(newsLinks.filter(link => scope.includes(link.location_id)).map(link => link.entity_id)).size });
    const totals = summarize(ids);
    const areas = areaRows.map(area => {
      const scope = descendants(area.id);
      const points = scope.map(id => byId.get(id)).filter(point);
      return { ...area, ...(point(area) || !points.length ? {} : {
        lat: points.reduce((sum, item) => sum + Number(item.lat), 0) / points.length,
        lng: points.reduce((sum, item) => sum + Number(item.lng), 0) / points.length,
      }), totals: summarize(scope) };
    });
    if (!point(root) && !root.bounding_box) {
      const points = ids.map(id => byId.get(id)).filter(point);
      if (points.length) root.bounding_box = {
        north: Math.max(...points.map(item => Number(item.lat))) + 0.1,
        south: Math.min(...points.map(item => Number(item.lat))) - 0.1,
        east: Math.max(...points.map(item => Number(item.lng))) + 0.1,
        west: Math.min(...points.map(item => Number(item.lng))) - 0.1,
      };
    }
    let items = [], total = 0;
    const limit = 100;
    if (detail === 'true') {
      const [north, south, east, west] = values.map(Number);
      const coordinateWhere = (latKey, lngKey) => ({ [latKey]: { [Op.between]: [south, north] },
        ...(west <= east ? { [lngKey]: { [Op.between]: [west, east] } }
          : { [Op.or]: [{ [lngKey]: { [Op.gte]: west } }, { [lngKey]: { [Op.lte]: east } }] }) });
      const offset = (Number(page) - 1) * limit;
      if (layer === 'issues') {
        const result = await Suggestion.findAndCountAll({ where: { ...issueWhere, ...coordinateWhere('mapLat', 'mapLng') },
          attributes: ['id', 'title', 'mapLat', 'mapLng', 'mapIssueType', 'locationId', 'status'],
          order: [['createdAt', 'DESC'], ['id', 'DESC']], limit, offset, raw: true });
        total = result.count;
        items = result.rows.map(item => ({ id: `issue-${item.id}`, title: item.title, lat: item.mapLat, lng: item.mapLng,
          issueType: item.mapIssueType, kind: 'issues', status: item.status, location: byId.get(item.locationId), href: `/suggestions/${item.id}` }));
      } else if (layer === 'polls') {
        const result = await Poll.findAndCountAll({ where: pollWhere, attributes: ['id', 'title', 'locationId', 'deadline'],
          include: [{ model: Location, as: 'location', attributes: fields, required: true, where: coordinateWhere('lat', 'lng') }],
          order: [['createdAt', 'DESC'], ['id', 'DESC']], limit, offset });
        total = result.count;
        items = result.rows.map(item => ({ id: `poll-${item.id}`, title: item.title, lat: item.location.lat, lng: item.location.lng,
          kind: 'polls', approximate: true, deadline: item.deadline, location: item.location, href: `/polls/${item.id}` }));
      } else if (layer === 'news' || layer === 'live') {
        const visiblePoint = item => point(item) && Number(item.lat) >= south && Number(item.lat) <= north
          && (west <= east ? Number(item.lng) >= west && Number(item.lng) <= east : Number(item.lng) >= west || Number(item.lng) <= east);
        const candidates = layer === 'live' ? livePins.map(pin => ({ ...pin, id: `live-${pin.id}`, kind: 'live',
          location: byId.get(pin.locationId) || country, href: `/live?pin=${pin.id}` }))
          : newsArticles.flatMap(article => newsLinks.filter(link => link.entity_id === article.id).map(link => {
            const location = byId.get(link.location_id);
            return { id: `news-${article.id}-${link.location_id}`, title: article.title, kind: 'news',
              lat: location?.lat, lng: location?.lng, location, approximate: true, href: `/news/${article.id}` };
          }));
        const visible = candidates.filter(visiblePoint);
        total = visible.length;
        items = visible.slice(offset, offset + limit);
      } else {
        const visible = cameras.filter(camera => point(camera) && Number(camera.lat) >= south && Number(camera.lat) <= north
          && (west <= east ? Number(camera.lng) >= west && Number(camera.lng) <= east : Number(camera.lng) >= west || Number(camera.lng) <= east));
        total = visible.length;
        items = visible.slice(offset, offset + limit);
      }
    }
    res.set('Cache-Control', 'public, max-age=30');
    return res.json({ success: true, location: { ...root, totals }, areas, totals, items,
      pagination: { total, page: Number(page), totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Home map error:', error.message);
    return res.status(500).json({ success: false, message: 'Map activity unavailable.' });
  }
};
