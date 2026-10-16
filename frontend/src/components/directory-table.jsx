import { useId, useState } from 'react';
import { ArrowDownUp, ChevronLeft, ChevronRight, Inbox, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { displayValue, getValue, pageRows, queryRows } from '@/lib/directory-utils';

export function DirectorySummary({ items, updatedAt, loading }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
      {items.map(item => <span key={item.label}><strong className="mr-1.5 text-sm font-semibold text-slate-900">{loading ? '—' : item.value}</strong>{item.label}</span>)}
      {updatedAt && <span className="ml-auto text-slate-400">Last refreshed {updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
    </div>
  );
}

export function DirectoryBadge({ children, tone = 'neutral' }) {
  const colors = {
    neutral: 'bg-slate-100 text-slate-600', blue: 'bg-blue-50 text-blue-700',
    cyan: 'bg-cyan-50 text-cyan-800', orange: 'bg-orange-50 text-orange-700', green: 'bg-emerald-50 text-emerald-700',
  };
  if (displayValue(children) === '—') return <span className="text-slate-400">—</span>;
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ${colors[tone] || colors.neutral}`}>{children}</span>;
}

export function DirectoryTable({ data, columns, searchFields, searchPlaceholder, filters = [], noun = 'records', loading, error, onRefresh, emptyMessage }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState({});
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const sortable = columns.filter(column => column.sortValue || column.accessor);
  const [sortKey, direction] = sort.split(':');
  const sortColumn = sortable.find(column => column.key === sortKey);
  const rows = queryRows(data, {
    query, searchFields: searchFields || columns.filter(column => column.accessor).map(column => column.accessor),
    filters, selected, sort: sortColumn?.sortValue || sortColumn?.accessor, direction,
  });
  const pagination = pageRows(rows, page, pageSize);
  const activeFilters = query || Object.values(selected).some(Boolean);
  const clearFilters = () => { setQuery(''); setSelected({}); setPage(1); };
  const selectClass = 'h-9 max-w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100';

  return (
    <section aria-label={`${noun} directory`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
        <label className="flex h-10 min-w-0 flex-1 basis-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-slate-400 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">{searchPlaceholder || `Search ${noun}`}</span>
          <input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} type="search" placeholder={searchPlaceholder || `Search ${noun}`} className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
        </label>
        {filters.map(filter => {
          const options = filter.options || [...new Set(data.map(row => displayValue(getValue(row, filter.accessor ?? filter.key))).filter(value => value !== '—'))].sort();
          return <label key={filter.key} className="max-w-full">
            <span className="sr-only">Filter by {filter.label}</span>
            <select className={`${selectClass} ${selected[filter.key] ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : ''}`} value={selected[filter.key] || ''} onChange={event => { setSelected({ ...selected, [filter.key]: event.target.value }); setPage(1); }}>
              <option value="">All {filter.label}</option>
              {options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>;
        })}
        {sortable.length > 0 && <label className="flex max-w-full items-center gap-2 text-slate-400">
          <ArrowDownUp size={15} aria-hidden="true" /><span className="sr-only">Sort {noun}</span>
          <select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }} className={selectClass}>
            <option value="">Sort by</option>
            {sortable.map(column => <optgroup key={column.key} label={column.label}>
              <option value={`${column.key}:asc`}>{column.label} ↑</option><option value={`${column.key}:desc`}>{column.label} ↓</option>
            </optgroup>)}
          </select>
        </label>}
        {onRefresh && <Button type="button" variant="ghost" size="icon" onClick={onRefresh} disabled={loading} aria-label={`Refresh ${noun}`} title="Refresh"><RefreshCw className={`size-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} /></Button>}
        <span className="ml-auto text-xs text-slate-500" aria-live="polite">{loading ? 'Loading…' : `${rows.length} ${rows.length === 1 ? 'result' : 'results'}`}</span>
        {activeFilters && <button type="button" onClick={clearFilters} className="flex items-center gap-1 rounded px-1 text-xs text-cyan-700 hover:text-cyan-900 focus-visible:outline-2 focus-visible:outline-cyan-500"><X size={13} />Clear filters</button>}
      </div>
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-orange-50 px-5 py-3 text-sm text-orange-800"><p>{error}</p>{onRefresh && <button type="button" onClick={onRefresh} className="font-semibold underline">Try again</button>}</div>}
      <Table aria-describedby={`${id}-range`}>
        <TableHeader className="bg-slate-50/80"><TableRow className="hover:bg-transparent">
          {columns.map(column => <TableHead key={column.key} scope="col" className={`h-11 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${column.key === 'actions' ? 'text-right' : ''}`}>{column.label}</TableHead>)}
        </TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={columns.length} className="h-40 text-center text-sm text-slate-500" role="status">Loading {noun}…</TableCell></TableRow>
            : pagination.rows.length === 0 ? <TableRow><TableCell colSpan={columns.length} className="h-44 text-center"><Inbox className="mx-auto mb-3 size-6 text-slate-300" aria-hidden="true" /><p className="font-medium text-slate-700">{error ? 'Records are unavailable' : activeFilters ? 'No matching results' : emptyMessage || `No ${noun} yet`}</p><p className="mt-1 text-xs text-slate-500">{activeFilters ? 'Try a different search or clear your filters.' : error ? 'Refresh the list to try again.' : 'New records will appear here.'}</p></TableCell></TableRow>
              : pagination.rows.map((row, index) => <TableRow key={row._id || row.id || index} className="h-16 border-slate-100 hover:bg-cyan-50/40">
                {columns.map(column => <TableCell key={column.key} className={`px-5 py-3 text-[13px] text-slate-600 ${column.key === 'actions' ? 'text-right' : ''}`}>{column.render ? column.render(row) : displayValue(getValue(row, column.accessor || column.key))}</TableCell>)}
              </TableRow>)}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
        <p id={`${id}-range`} className="text-xs text-slate-500">{loading ? `Loading ${noun}…` : `Showing ${pagination.start}–${pagination.end} of ${rows.length} ${noun}`}</p>
        {rows.length > pageSize && !loading && <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500">Rows per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className={selectClass}>{[10, 25, 50].map(size => <option key={size}>{size}</option>)}</select></label>
          <span className="text-xs text-slate-500">Page {pagination.page} of {pagination.pages}</span>
          <Button type="button" size="icon" variant="outline" disabled={pagination.page === 1} onClick={() => setPage(pagination.page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
          <Button type="button" size="icon" variant="outline" disabled={pagination.page === pagination.pages} onClick={() => setPage(pagination.page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></Button>
        </div>}
      </div>
    </section>
  );
}
