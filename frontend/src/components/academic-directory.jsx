import { useState } from 'react';
import { Pencil } from 'lucide-react';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { DirectoryBadge, DirectorySummary, DirectoryTable } from '@/components/directory-table';
import { RecordActions, RecordDetails } from '@/components/record-actions';
import { RecordIdentity } from '@/components/record-identity';
import { useAuth, useClient } from '@/lib/dataContext';
import { useDirectoryData } from '@/hooks/use-directory-data';
import { collection, ensureSuccess, formatDate } from '@/lib/directory-utils';
import { degreeOptions, splitList } from '@/lib/resource-payloads';

export function AcademicDirectory({ kind }) {
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const [viewing, setViewing] = useState(null);
  const isMajor = kind === 'major';
  const resource = isMajor ? 'majors' : 'departments';
  const service = isMajor ? client.majors : client.departments;
  const directory = useDirectoryData(async () => {
    if (!isMajor) return collection(await service.fetchAll(), 'departments');
    const [majorResponse, departmentResponse] = await Promise.all([service.fetchAll(), client.departments.fetchAll()]);
    const departments = collection(departmentResponse, 'departments');
    return collection(majorResponse, 'majors').map(major => ({
      ...major,
      departmentName: departments.find(department => department._id === major.department_id)?.name,
      degreeLabel: degreeOptions.find(option => option.value === major.degree)?.label || major.degree,
      track: splitList(major.track),
    }));
  }, token);
  const actions = record => (
    <RecordActions
      label={isMajor ? record.major_name : record.name}
      actions={[
        { label: 'View details', onSelect: () => setViewing(record) },
        { label: `Edit ${kind}`, to: `/admin/view-${resource}/${record._id}`, icon: <Pencil className="size-4" /> },
      ]}
      onDelete={async () => {
        ensureSuccess(await service.deleteOne(record._id));
        directory.setData(rows => rows.filter(row => row._id !== record._id));
      }}
      deleteDescription={`This permanently removes this ${kind}. This action cannot be undone.`}
    />
  );
  const columns = isMajor ? [
    { key: 'name', label: 'Major', accessor: 'major_name', render: major => <div className="max-w-64"><RecordIdentity name={major.major_name} to={`/admin/view-majors/${major._id}`} /><p className="mt-1 truncate text-xs text-slate-400" title={major.description}>{major.description}</p></div> },
    { key: 'degree', label: 'Degree', accessor: 'degreeLabel', render: major => <DirectoryBadge tone="blue">{major.degreeLabel}</DirectoryBadge> },
    { key: 'department', label: 'Department', accessor: 'departmentName', render: major => <DirectoryBadge tone="cyan">{major.departmentName}</DirectoryBadge> },
    { key: 'tracks', label: 'Tracks', render: major => <div className="flex flex-wrap gap-1.5">{major.track.length ? <>{major.track.slice(0, 2).map(track => <DirectoryBadge key={track}>{track}</DirectoryBadge>)}{major.track.length > 2 && <DirectoryBadge>+{major.track.length - 2}</DirectoryBadge>}</> : <span className="text-slate-400">—</span>}</div> },
    { key: 'actions', label: 'Actions', render: actions },
  ] : [
    { key: 'name', label: 'Department', accessor: 'name', render: department => <RecordIdentity name={department.name} to={`/admin/view-departments/${department._id}`} /> },
    { key: 'room', label: 'Room number', accessor: 'roomNo' },
    { key: 'created', label: 'Created', sortValue: department => new Date(department.createdAt).getTime() || 0, render: department => formatDate(department.createdAt) },
    { key: 'updated', label: 'Last updated', sortValue: department => new Date(department.updatedAt).getTime() || 0, render: department => formatDate(department.updatedAt) },
    { key: 'actions', label: 'Actions', render: actions },
  ];
  const stats = isMajor ? [
    { label: 'majors', value: directory.data.length },
    { label: 'departments represented', value: new Set(directory.data.map(major => major.department_id)).size },
    { label: 'academic tracks', value: new Set(directory.data.flatMap(major => major.track)).size },
  ] : [
    { label: 'departments', value: directory.data.length },
    { label: 'with a room assigned', value: directory.data.filter(department => department.roomNo).length },
  ];
  if (!currentUser) return null;

  return (
    <Layout user={currentUser}>
      <Topbar title={isMajor ? 'Major directory' : 'Department directory'} description={isMajor ? 'Manage academic programs, degrees, departments, and learning tracks.' : 'Organize departments and keep room locations up to date.'} mode="read" link={`/admin/create-${resource}`} actionLabel={`Add ${kind}`} />
      <DirectorySummary loading={directory.loading || (!directory.updatedAt && Boolean(directory.error))} updatedAt={directory.updatedAt} items={stats} />
      <DirectoryTable
        {...directory}
        columns={columns}
        noun={resource}
        searchPlaceholder={isMajor ? 'Search majors, departments, or tracks' : 'Search departments or room numbers'}
        searchFields={isMajor ? ['major_name', 'departmentName', 'degreeLabel', 'track'] : ['name', 'roomNo']}
        filters={isMajor ? [{ key: 'degreeLabel', label: 'degrees' }, { key: 'departmentName', label: 'departments' }] : []}
        onRefresh={directory.refresh}
      />
      <RecordDetails record={viewing} onClose={() => setViewing(null)} title={isMajor ? 'Major details' : 'Department details'} fields={isMajor ? [
        { label: 'Major', value: 'major_name' }, { label: 'Degree', value: 'degreeLabel' },
        { label: 'Department', value: 'departmentName' }, { label: 'Tracks', value: 'track' },
        { label: 'Description', value: 'description' },
      ] : [
        { label: 'Department', value: 'name' }, { label: 'Room number', value: 'roomNo' },
        { label: 'Created', value: department => formatDate(department.createdAt) },
        { label: 'Last updated', value: department => formatDate(department.updatedAt) },
      ]} />
    </Layout>
  );
}
