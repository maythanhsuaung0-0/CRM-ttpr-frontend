import assert from 'node:assert/strict';
import { test } from 'node:test';
import { departmentPayload, degreeOptions, internshipPayload, majorFormValues, majorPayload, savedResource, splitList } from './resource-payloads.js';
import { validateDepartmentForm, validateInternshipForm, validateMajorsForm } from './validations.js';

test('department form values persist the roomNo field expected by the model', () => {
  assert.deepEqual(departmentPayload({ name: ' Career Services ', roomNo: ' N604 ' }), { name: 'Career Services', roomNo: 'N604' });
});

test('room numbers are optional and accept short room identifiers', async () => {
  await validateDepartmentForm.validate({ name: 'Computing', roomNo: '' });
  await validateDepartmentForm.validate({ name: 'Computing', roomNo: 'N5' });
  assert.deepEqual(departmentPayload({ name: 'Computing' }), { name: 'Computing', roomNo: '' });
});

test('major form values use the actual model field names and array tracks', () => {
  const payload = majorPayload({ name: ' Computer Systems ', degree: 'bachelor', department: 'department-1', track: 'Software, Networking, Software', description: ' Program details. ' });
  assert.deepEqual(payload, { major_name: 'Computer Systems', degree: 'bachelor', department_id: 'department-1', track: ['Software', 'Networking'], description: 'Program details.' });
  assert.deepEqual(majorPayload(majorFormValues(payload)), payload);
});

test('all supported degree choices pass validation without requiring optional tracks', async () => {
  for (const { value } of degreeOptions) {
    await validateMajorsForm.validate({ name: 'Computer Systems', degree: value, department: 'department-1', track: '', description: '' });
  }
});

test('majors require a real degree choice and a selected department', async () => {
  const data = { name: 'Computer Systems', degree: 'bachelor', department: 'department-1' };
  await assert.rejects(validateMajorsForm.validateAt('degree', { ...data, degree: 'invalid' }), { path: 'degree' });
  await assert.rejects(validateMajorsForm.validateAt('department', { ...data, department: '' }), { path: 'department' });
});

test('internship creation sends the selected company ID and structured lists', () => {
  assert.deepEqual(internshipPayload({ name: 'company-1', position: ' Intern ', salary: ' $20/hr ', requirements: 'React\nJavaScript', responsibility: 'Build features, Review code', details: ' Learn on the job. ', applicationDeadline: '2027-01-31', tags: 'React, JavaScript' }), {
    company: 'company-1', position: 'Intern', salary: '$20/hr', requirements: ['React', 'JavaScript'], responsibility: ['Build features', 'Review code'], details: 'Learn on the job.', applicationDeadline: '2027-01-31', tags: ['React', 'JavaScript'],
  });
});

test('internship validation rejects lists that contain only separators', async () => {
  for (const field of ['requirements', 'responsibility', 'tags']) {
    await assert.rejects(validateInternshipForm.validateAt(field, { [field]: ', ,\n' }), { path: field });
  }
});

test('list parsing removes empty and duplicate entries', () => {
  assert.deepEqual(splitList('React, , Node\nReact'), ['React', 'Node']);
  assert.deepEqual(splitList(['Software', ' Networking ', 'Software']), ['Software', 'Networking']);
  assert.deepEqual(splitList(undefined), []);
});

test('duplicate saves stay on the form instead of being reported as success', () => {
  assert.throws(() => savedResource({ status: 201, data: { message: 'Department already exists' } }), /already exists/);
  assert.throws(() => savedResource({ status: 400, error: 'Validation failed' }), /Validation failed/);
  assert.deepEqual(savedResource({ status: 200, data: { departments: { _id: 'new' } } }), { departments: { _id: 'new' } });
});
