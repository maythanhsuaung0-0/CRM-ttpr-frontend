import { ensureSuccess } from './directory-utils.js';

export const degreeOptions = [
  { value: 'associate', label: 'Associate degree' },
  { value: 'bachelor', label: "Bachelor's degree" },
  { value: 'master', label: "Master's degree" },
  { value: 'phd', label: 'Doctorate (PhD)' },
];

export function splitList(value) {
  return [...new Set((Array.isArray(value) ? value : String(value || '').split(/[,\n]/))
    .map(item => item.trim()).filter(Boolean))];
}

export function departmentPayload(values) {
  return { name: values.name.trim(), roomNo: (values.roomNo || '').trim() };
}

export function majorPayload(values) {
  return {
    major_name: values.name.trim(),
    degree: values.degree,
    department_id: values.department,
    track: splitList(values.track),
    description: (values.description || '').trim(),
  };
}

export function majorFormValues(record) {
  return {
    name: record.major_name || record.name || '',
    degree: record.degree || '',
    department: record.department_id || '',
    track: splitList(record.track).join(', '),
    description: record.description || '',
  };
}

export function internshipPayload(values) {
  return {
    company: values.name,
    position: values.position.trim(),
    salary: values.salary.trim(),
    requirements: splitList(values.requirements),
    responsibility: splitList(values.responsibility),
    details: values.details.trim(),
    applicationDeadline: values.applicationDeadline,
    tags: splitList(values.tags),
  };
}

// These existing creation endpoints use 201 for a duplicate, and 200 for a save.
export function savedResource(response) {
  const body = ensureSuccess(response);
  if (response.status === 201) throw new Error(body?.message || 'This record already exists.');
  return body;
}
