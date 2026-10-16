import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { build } from 'esbuild';

const compiled = await build({
  stdin: {
    contents: `export { UserClient } from './user.js'; export { AppointmentClient } from './appointment.js'; export { InternshipClient } from './internships.js'; export { CompaniesClient } from './companies.js'; export { DepartmentClient } from './departments.js'; export { MajorClient } from './majors.js';`,
    resolveDir: new URL('.', import.meta.url).pathname,
  },
  bundle: true, write: false, platform: 'node', format: 'cjs',
  define: { 'import.meta.env.VITE_API_URI': JSON.stringify('https://crm.example.test/') },
});
const calls = [];
const sandbox = {
  module: { exports: {} }, URL, console,
  fetch: async (url, config) => {
    calls.push({ url, ...config });
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  },
};
vm.runInNewContext(compiled.outputFiles[0].text, sandbox);
const { UserClient, AppointmentClient, InternshipClient, CompaniesClient, DepartmentClient, MajorClient } = sandbox.module.exports;

test('editing an account sends its identifier and fields to the existing user endpoint', async () => {
  const payload = { _id: 'staff-1', data: { name: 'Updated Name' } };
  await new UserClient('token').update(payload);
  const call = calls.pop();
  assert.equal(call.url, 'https://crm.example.test/api/users/update');
  assert.equal(call.method, 'POST');
  assert.deepEqual(JSON.parse(call.body), payload);
  assert.equal(call.headers.authorization, 'Bearer token');
});

test('appointment pagination requests all pages using the server query parameters', async () => {
  await new AppointmentClient('token').fetchPage(2, 100);
  assert.equal(calls.pop().url, 'https://crm.example.test/api/appointment?page=2&limit=100');
});

test('appointment edits use the actual identifier route', async () => {
  await new AppointmentClient('token').update({ _id: 'meeting-1', title: 'Updated meeting' });
  const call = calls.pop();
  assert.equal(call.url, 'https://crm.example.test/api/appointment/meeting-1');
  assert.equal(call.method, 'PATCH');
  assert.deepEqual(JSON.parse(call.body), { title: 'Updated meeting' });
});

test('appointment deletion keeps request options out of the JSON body', async () => {
  await new AppointmentClient('token').deleteOne('meeting-1', { credentials: 'include' });
  const call = calls.pop();
  assert.equal(call.url, 'https://crm.example.test/api/appointment/meeting-1');
  assert.equal(call.method, 'DELETE');
  assert.equal(call.credentials, 'include');
  assert.equal(call.body, undefined);
});

test('company deletion preserves credentials as request options', async () => {
  await new CompaniesClient('token').deleteOne('company-1', { credentials: 'include' });
  const call = calls.pop();
  assert.equal(call.url, 'https://crm.example.test/api/company/delete/company-1');
  assert.equal(call.method, 'DELETE');
  assert.equal(call.credentials, 'include');
  assert.equal(call.body, undefined);
});

test('internship editing and deletion use real server routes', async () => {
  const client = new InternshipClient('token');
  await client.update('role-1', { position: 'Updated role' });
  const edit = calls.pop();
  assert.equal(edit.url, 'https://crm.example.test/api/internship/role-1');
  assert.equal(edit.method, 'PATCH');
  assert.deepEqual(JSON.parse(edit.body), { position: 'Updated role' });
  await client.deleteOne('role-1');
  const deletion = calls.pop();
  assert.equal(deletion.method, 'DELETE');
  assert.equal(deletion.url, edit.url);
});

test('department creation, updates, and deletion use the identifier API', async () => {
  const client = new DepartmentClient('token');
  const payload = { name: 'Computing', roomNo: 'N604' };
  await client.create(payload);
  const creation = calls.pop();
  assert.equal(creation.url, 'https://crm.example.test/api/department/create');
  assert.deepEqual(JSON.parse(creation.body), payload);
  await client.update('department-1', payload);
  const update = calls.pop();
  assert.equal(update.url, 'https://crm.example.test/api/department/department-1');
  assert.equal(update.method, 'PATCH');
  await client.deleteOne('department-1');
  const deletion = calls.pop();
  assert.equal(deletion.url, update.url);
  assert.equal(deletion.method, 'DELETE');
});

test('major management uses the canonical major mount and complete payload', async () => {
  const client = new MajorClient('token');
  const payload = { major_name: 'Computer Systems', degree: 'bachelor', department_id: 'department-1', track: ['Software'] };
  await client.fetchAll();
  assert.equal(calls.pop().url, 'https://crm.example.test/api/major');
  await client.create(payload);
  const creation = calls.pop();
  assert.equal(creation.url, 'https://crm.example.test/api/major');
  assert.equal(creation.method, 'POST');
  assert.deepEqual(JSON.parse(creation.body), payload);
  await client.update('major-1', payload);
  const update = calls.pop();
  assert.equal(update.url, 'https://crm.example.test/api/major/major-1');
  assert.equal(update.method, 'PATCH');
  await client.deleteOne('major-1');
  assert.equal(calls.pop().method, 'DELETE');
});

test('internship creation forwards the company and list fields', async () => {
  const payload = { company: 'company-1', position: 'Intern', requirements: ['React'], responsibility: ['Build UI'], tags: ['React'] };
  await new InternshipClient('token').create(payload);
  const creation = calls.pop();
  assert.equal(creation.url, 'https://crm.example.test/api/internship/create');
  assert.equal(creation.method, 'POST');
  assert.deepEqual(JSON.parse(creation.body), payload);
});
