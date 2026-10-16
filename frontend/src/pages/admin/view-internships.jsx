import { useState } from 'react';
import { Pencil } from 'lucide-react';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { DirectoryBadge, DirectorySummary, DirectoryTable } from '@/components/directory-table';
import { RecordActions, RecordDetails, RecordEditor } from '@/components/record-actions';
import { useAuth, useClient } from '@/lib/dataContext';
import { useDirectoryData } from '@/hooks/use-directory-data';
import { collection, ensureSuccess, formatDate } from '@/lib/directory-utils';

export default function ViewInternships() {
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const directory = useDirectoryData(async () => {
    const [response, companiesResponse] = await Promise.all([client.internships.fetchAll(), client.companies.fetchAll()]);
    const companies = collection(companiesResponse);
    return collection(response, 'data').map(internship => ({ ...internship, companyName: companies.find(company => company._id === internship.company)?.name || internship.company, status: internship.isActive ? 'Active' : 'Closed' }));
  }, token);
  const columns = [
    { key: 'position', label: 'Opportunity', accessor: 'position', render: internship => <div className="max-w-64"><p className="truncate font-semibold text-slate-900">{internship.position}</p><p className="mt-1 truncate text-xs text-slate-400">{(internship.tags || []).join(' · ') || '—'}</p></div> },
    { key: 'company', label: 'Company', accessor: 'companyName' },
    { key: 'salary', label: 'Compensation', accessor: 'salary' },
    { key: 'deadline', label: 'Deadline', sortValue: internship => new Date(internship.applicationDeadline).getTime() || 0, render: internship => formatDate(internship.applicationDeadline) },
    { key: 'status', label: 'Status', accessor: 'status', render: internship => <DirectoryBadge tone={internship.isActive ? 'green' : 'neutral'}>{internship.status}</DirectoryBadge> },
    { key: 'actions', label: 'Actions', render: internship => <RecordActions label={internship.position} actions={[{ label: 'View details', onSelect: () => setViewing(internship) }, { label: 'Edit internship', icon: <Pencil className="size-4" />, onSelect: () => setEditing({ ...internship, applicationDeadline: internship.applicationDeadline?.slice(0, 10) }) }]} onDelete={async () => {
      ensureSuccess(await client.internships.deleteOne(internship._id));
      directory.setData(rows => rows.filter(row => row._id !== internship._id));
    }} /> },
  ];
  if (!currentUser) return null;
  return <Layout user={currentUser}>
    <Topbar title="Internship opportunities" description="Manage employer opportunities, application requirements, and deadlines." mode="read" link="/admin/create-internships" actionLabel="Create internship" />
    <DirectorySummary loading={directory.loading} updatedAt={directory.updatedAt} items={[{ label: 'opportunities', value: directory.data.length }, { label: 'active', value: directory.data.filter(row => row.isActive).length }, { label: 'closed', value: directory.data.filter(row => !row.isActive).length }]} />
    <DirectoryTable {...directory} columns={columns} noun="internships" searchPlaceholder="Search roles, companies, or skills" searchFields={['position', 'companyName', 'tags']} filters={[{ key: 'status', label: 'statuses' }, { key: 'companyName', label: 'companies' }]} onRefresh={directory.refresh} />
    <RecordDetails record={viewing} onClose={() => setViewing(null)} title="Internship details" fields={[{ label: 'Position', value: 'position' }, { label: 'Company', value: 'companyName' }, { label: 'Compensation', value: 'salary' }, { label: 'Requirements', value: 'requirements' }, { label: 'Responsibilities', value: 'responsibility' }, { label: 'Details', value: 'details' }, { label: 'Deadline', value: row => formatDate(row.applicationDeadline) }, { label: 'Skills', value: 'tags' }]} />
    <RecordEditor record={editing} onClose={() => setEditing(null)} title="Edit internship" fields={[{ key: 'position', label: 'Position', required: true }, { key: 'salary', label: 'Compensation', required: true }, { key: 'applicationDeadline', label: 'Application deadline', type: 'date', required: true }, { key: 'status', label: 'Status', options: ['Active', 'Closed'] }]} onSave={async ({ status, ...values }) => { ensureSuccess(await client.internships.update(editing._id, { ...values, isActive: status === 'Active' })); await directory.refresh(); }} />
  </Layout>;
}
