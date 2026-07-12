const EUROSTAT_BASE_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const EUROSTAT_REVALIDATE_SECONDS = 6 * 60 * 60;

function formatMonthStart(date = new Date(), monthsBack = 18) {
  const month = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - monthsBack, 1));
  return `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatQuarterStart(date = new Date(), quartersBack = 8) {
  const currentQuarter = Math.floor(date.getUTCMonth() / 3);
  const totalQuarterIndex = date.getUTCFullYear() * 4 + currentQuarter - quartersBack;
  const year = Math.floor(totalQuarterIndex / 4);
  const quarter = (totalQuarterIndex % 4) + 1;
  return `${year}-Q${quarter}`;
}

function buildEurostatUrl(dataset, params) {
  const url = new URL(`${EUROSTAT_BASE_URL}/${dataset}`);

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item));
      return;
    }

    url.searchParams.set(key, value);
  });

  return url.toString();
}

async function fetchEurostatDataset(dataset, params) {
  const response = await fetch(buildEurostatUrl(dataset, params), {
    next: { revalidate: EUROSTAT_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Eurostat ${dataset} returned ${response.status}`);
  }

  return response.json();
}

function getCategoryIndex(data, dimensionId, code) {
  return data?.dimension?.[dimensionId]?.category?.index?.[code];
}

function getTimeCodes(data) {
  const timeIndex = data?.dimension?.time?.category?.index || {};
  return Object.entries(timeIndex)
    .sort(([, left], [, right]) => left - right)
    .map(([code]) => code);
}

function getDefaultDimensionCode(data, dimensionId) {
  const index = data?.dimension?.[dimensionId]?.category?.index || {};
  const firstEntry = Object.entries(index).sort(([, left], [, right]) => left - right)[0];
  return firstEntry?.[0] || null;
}

function getFlatIndex(data, coordinates) {
  if (!Array.isArray(data?.id) || !Array.isArray(data?.size)) {
    return null;
  }

  let flatIndex = 0;

  for (let index = 0; index < data.id.length; index += 1) {
    const dimensionId = data.id[index];
    const code = coordinates[dimensionId] || getDefaultDimensionCode(data, dimensionId);
    const position = getCategoryIndex(data, dimensionId, code);

    if (position === undefined) {
      return null;
    }

    flatIndex = flatIndex * data.size[index] + position;
  }

  return flatIndex;
}

export function extractSeries(data, geoCode) {
  return getTimeCodes(data)
    .map((timeCode) => {
      const flatIndex = getFlatIndex(data, { geo: geoCode, time: timeCode });
      const value = flatIndex === null ? undefined : data?.value?.[flatIndex];

      if (typeof value !== 'number') {
        return null;
      }

      return {
        period: timeCode,
        value,
        status: data?.status?.[flatIndex] || null,
      };
    })
    .filter(Boolean);
}

function getUpdatedAt(data) {
  const updateAnnotation = data?.extension?.annotation?.find((annotation) => annotation.type === 'UPDATE_DATA');
  return updateAnnotation?.date || data?.updated || null;
}

function getLatestPair(data, primaryGeo, comparisonGeo) {
  const primarySeries = extractSeries(data, primaryGeo);
  const comparisonSeries = extractSeries(data, comparisonGeo);
  const primaryLatest = primarySeries.at(-1);

  if (!primaryLatest) {
    return null;
  }

  const comparisonLatest =
    comparisonSeries.find((point) => point.period === primaryLatest.period) || comparisonSeries.at(-1) || null;

  return {
    primary: primaryLatest,
    comparison: comparisonLatest,
    series: primarySeries.slice(-6),
    updatedAt: getUpdatedAt(data),
  };
}

function buildMetric(config, pair) {
  if (!pair) {
    return {
      ...config,
      unavailable: true,
      primary: null,
      comparison: null,
      series: [],
    };
  }

  const difference =
    pair.comparison && typeof pair.comparison.value === 'number'
      ? Number((pair.primary.value - pair.comparison.value).toFixed(1))
      : null;

  return {
    ...config,
    primary: pair.primary,
    comparison: pair.comparison,
    difference,
    series: pair.series,
    updatedAt: pair.updatedAt,
  };
}

export async function getEconomyMetrics() {
  const monthStart = formatMonthStart();
  const quarterStart = formatQuarterStart();

  const metricRequests = [
    {
      config: {
        id: 'inflation',
        label: 'Πληθωρισμός',
        valueLabel: 'Ελλάδα',
        comparisonLabel: 'Ευρωζώνη',
        unit: '%',
        direction: 'lower',
        explainer: 'Δείχνει πόσο ακριβότερο είναι το καλάθι αγαθών και υπηρεσιών σε σχέση με πέρσι.',
        sourceName: 'Eurostat HICP',
        sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_minr/default/table',
      },
      dataset: 'prc_hicp_minr',
      params: {
        format: 'JSON',
        lang: 'en',
        freq: 'M',
        unit: 'RCH_A',
        coicop18: 'TOTAL',
        geo: ['EL', 'EA20'],
        sinceTimePeriod: monthStart,
      },
      primaryGeo: 'EL',
      comparisonGeo: 'EA20',
    },
    {
      config: {
        id: 'unemployment',
        label: 'Ανεργία',
        valueLabel: 'Ελλάδα',
        comparisonLabel: 'ΕΕ',
        unit: '%',
        direction: 'lower',
        explainer: 'Μετρά το ποσοστό του εργατικού δυναμικού που αναζητά δουλειά και δεν βρίσκει.',
        sourceName: 'Eurostat unemployment',
        sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/une_rt_m/default/table',
      },
      dataset: 'une_rt_m',
      params: {
        format: 'JSON',
        lang: 'en',
        freq: 'M',
        s_adj: 'SA',
        age: 'TOTAL',
        sex: 'T',
        unit: 'PC_ACT',
        geo: ['EL', 'EU27_2020'],
        sinceTimePeriod: monthStart,
      },
      primaryGeo: 'EL',
      comparisonGeo: 'EU27_2020',
    },
    {
      config: {
        id: 'gdp-growth',
        label: 'Ανάπτυξη ΑΕΠ',
        valueLabel: 'Ελλάδα',
        comparisonLabel: 'Ευρωζώνη',
        unit: '%',
        direction: 'higher',
        explainer: 'Δείχνει αν η οικονομία μεγάλωσε ή μίκρυνε σε σχέση με το προηγούμενο τρίμηνο.',
        sourceName: 'Eurostat GDP',
        sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/namq_10_gdp/default/table',
      },
      dataset: 'namq_10_gdp',
      params: {
        format: 'JSON',
        lang: 'en',
        freq: 'Q',
        s_adj: 'SCA',
        unit: 'CLV_PCH_PRE',
        na_item: 'B1GQ',
        geo: ['EL', 'EA20'],
        sinceTimePeriod: quarterStart,
      },
      primaryGeo: 'EL',
      comparisonGeo: 'EA20',
    },
    {
      config: {
        id: 'debt',
        label: 'Δημόσιο χρέος',
        valueLabel: 'Ελλάδα',
        comparisonLabel: 'Ευρωζώνη',
        unit: '% ΑΕΠ',
        direction: 'lower',
        explainer: 'Δείχνει το χρέος της γενικής κυβέρνησης ως ποσοστό της ετήσιας παραγωγής της οικονομίας.',
        sourceName: 'Eurostat government debt',
        sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10q_ggdebt/default/table',
      },
      dataset: 'gov_10q_ggdebt',
      params: {
        format: 'JSON',
        lang: 'en',
        freq: 'Q',
        na_item: 'GD',
        sector: 'S13',
        unit: 'PC_GDP',
        geo: ['EL', 'EA20'],
        sinceTimePeriod: quarterStart,
      },
      primaryGeo: 'EL',
      comparisonGeo: 'EA20',
    },
  ];

  const settledMetrics = await Promise.all(
    metricRequests.map(async ({ config, dataset, params, primaryGeo, comparisonGeo }) => {
      try {
        const data = await fetchEurostatDataset(dataset, params);
        return buildMetric(config, getLatestPair(data, primaryGeo, comparisonGeo));
      } catch {
        return buildMetric(config, null);
      }
    }),
  );

  return settledMetrics;
}

