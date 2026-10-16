export function displayValue(value) {
  if (value == null || value === '' || value === 'N/A' || value === '#') return '—';
  if (Array.isArray(value)) return value.map(displayValue).filter(item => item !== '—').join(', ') || '—';
  if (typeof value === 'object') return displayValue(value.name ?? value.title ?? value.label);
  return String(value);
}

export function getValue(row, accessor) {
  return typeof accessor === 'function' ? accessor(row) : row[accessor];
}

export function queryRows(data, { query = '', searchFields = [], filters = [], selected = {}, sort, direction = 'asc' } = {}) {
  const term = query.trim().toLocaleLowerCase();
  const rows = data.filter(row => {
    const matchesSearch = !term || searchFields.some(field => {
      const text = displayValue(getValue(row, field));
      return text !== '—' && text.toLocaleLowerCase().includes(term);
    });
    return matchesSearch && filters.every(filter =>
      !selected[filter.key] || displayValue(getValue(row, filter.accessor ?? filter.key)) === selected[filter.key],
    );
  });
  if (sort) rows.sort((a, b) => {
    const first = getValue(a, sort);
    const second = getValue(b, sort);
    const result = typeof first === 'number' && typeof second === 'number'
      ? first - second
      : displayValue(first).localeCompare(displayValue(second), undefined, { numeric: true, sensitivity: 'base' });
    return direction === 'desc' ? -result : result;
  });
  return rows;
}

export function pageRows(rows, requestedPage = 1, pageSize = 10) {
  const size = Math.max(1, Number(pageSize) || 10);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(Math.max(1, Number(requestedPage) || 1), pages);
  const offset = (page - 1) * size;
  return { rows: rows.slice(offset, offset + size), page, pages, start: rows.length ? offset + 1 : 0, end: Math.min(offset + size, rows.length) };
}

export function ensureSuccess(response) {
  if (!response || !Number.isFinite(response.status) || response.status < 200 || response.status >= 300) {
    throw new Error(response?.error || response?.message || 'The request could not be completed. Please try again.');
  }
  return response.data;
}

export function collection(response, key) {
  const body = ensureSuccess(response);
  const data = key ? body?.[key] : body;
  if (!Array.isArray(data)) throw new Error('The server returned an unexpected list response.');
  return data;
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', ...options });
}
