import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collection, displayValue, ensureSuccess, pageRows, queryRows, safeExternalUrl } from './directory-utils.js';

const staff = [
  { _id: 'a', name: 'Zoe', email: 'zoe@school.edu', id: '00000010', department: 'Advising', role: 'admin' },
  { _id: 'b', name: 'Adam', email: 'adam@school.edu', id: '00000002', department: 'Advising', role: 'staff' },
  { _id: 'c', name: 'Maya', email: 'maya@school.edu', id: '00000003', department: 'Computing', role: 'staff' },
];

test('search matches names, emails, and IDs without changing the source records', () => {
  for (const term of ['  ZOE ', 'zoe@school', '00000010']) {
    assert.deepEqual(queryRows(staff, { query: term, searchFields: ['name', 'email', 'id'] }).map(row => row._id), ['a']);
  }
  assert.deepEqual(staff.map(row => row._id), ['a', 'b', 'c']);
});

test('department and role filters combine with search', () => {
  assert.deepEqual(queryRows(staff, {
    query: 'school', searchFields: ['email'],
    filters: [{ key: 'department' }, { key: 'role' }], selected: { department: 'Advising', role: 'staff' },
  }).map(row => row._id), ['b']);
});

test('ascending and descending sorts preserve the source array', () => {
  assert.deepEqual(queryRows(staff, { sort: 'name' }).map(row => row.name), ['Adam', 'Maya', 'Zoe']);
  assert.deepEqual(queryRows(staff, { sort: 'name', direction: 'desc' }).map(row => row.name), ['Zoe', 'Maya', 'Adam']);
  assert.deepEqual(staff.map(row => row.name), ['Zoe', 'Adam', 'Maya']);
});

test('numeric and computed values sort correctly', () => {
  assert.deepEqual(queryRows([{ n: 100 }, { n: 2 }, { n: 10 }], { sort: row => row.n }).map(row => row.n), [2, 10, 100]);
});

test('pagination returns the exact visible range', () => {
  const result = pageRows(Array.from({ length: 23 }, (_, index) => index), 3, 10);
  assert.deepEqual(result, { rows: [20, 21, 22], page: 3, pages: 3, start: 21, end: 23 });
});

test('pagination clamps the current page after deletion or filtering', () => {
  const result = pageRows(staff.slice(0, 1), 3, 2);
  assert.equal(result.page, 1);
  assert.equal(result.start, 1);
  assert.equal(result.end, 1);
  assert.equal(result.rows[0]._id, 'a');
});

test('empty results have a zero range and no extra pages', () => {
  assert.deepEqual(pageRows([], 5, 10), { rows: [], page: 1, pages: 1, start: 0, end: 0 });
});

test('missing fields use an em dash and populated references show their name', () => {
  for (const value of [undefined, null, '', 'N/A', '#']) assert.equal(displayValue(value), '—');
  assert.equal(displayValue({ name: 'Computing' }), 'Computing');
  assert.equal(displayValue(['React', 'Node']), 'React, Node');
  assert.equal(displayValue(0), '0');
});

test('external links reject unsafe protocols and placeholders', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'N/A', '#', undefined]) assert.equal(safeExternalUrl(value), null);
  assert.equal(safeExternalUrl('https://linkedin.com/in/example'), 'https://linkedin.com/in/example');
});

test('failed requests retain their error and cannot become empty successful tables', () => {
  assert.throws(() => collection({ status: 500, error: 'Database unavailable' }), /Database unavailable/);
  assert.throws(() => collection({ status: 200, data: {} }), /unexpected list/);
  assert.throws(() => ensureSuccess({}), /could not be completed/);
  assert.deepEqual(collection({ status: 200, data: { pendingStaffs: staff } }, 'pendingStaffs'), staff);
});

test('successful no-content deletion responses are accepted', () => {
  assert.equal(ensureSuccess({ status: 204, data: null }), null);
});
