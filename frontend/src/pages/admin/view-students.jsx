import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { Button } from '@/components/ui/button';
import { DirectoryBadge, DirectorySummary, DirectoryTable } from '@/components/directory-table';
import { RecordActions, RecordDetails, RecordEditor } from '@/components/record-actions';
import { RecordIdentity, RecordLink } from '@/components/record-identity';
import { useAuth, useClient } from '@/lib/dataContext';
import { useDirectoryData } from '@/hooks/use-directory-data';
import { collection, ensureSuccess } from '@/lib/directory-utils';
import { validateRegisterationForm } from '@/lib/validations';

export default function ViewStudents() {
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const directory = useDirectoryData(async () => collection(await client.user.fetchStudents({ credentials: 'include' })), token);
  const columns = [
    { key: 'student', label: 'Student', accessor: 'name', render: student => <RecordIdentity name={student.name} email={student.email} id={student.id} image={student.profileImage} /> },
    { key: 'major', label: 'Major', accessor: 'major', render: student => <DirectoryBadge tone="cyan">{student.major?.name || student.major}</DirectoryBadge> },
    { key: 'track', label: 'Track', accessor: 'track', render: student => <DirectoryBadge>{student.track?.name || student.track}</DirectoryBadge> },
    { key: 'graduation', label: 'Graduation', accessor: 'graduationYear' },
    { key: 'linkedin', label: 'LinkedIn', render: student => <RecordLink url={student.linkedin || student.LinkedIn} label={`${student.name} on LinkedIn`} linkedin /> },
    { key: 'status', label: 'Status', accessor: student => student.locked ? 'Locked' : 'Active', render: student => <DirectoryBadge tone={student.locked ? 'neutral' : 'green'}>{student.locked ? 'Locked' : 'Active'}</DirectoryBadge> },
    { key: 'actions', label: 'Actions', render: student => <RecordActions label={student.name} actions={[{ label: 'View details', onSelect: () => setViewing(student) }, { label: 'Edit account', icon: <Pencil className="size-4" />, onSelect: () => setEditing(student) }]} onDelete={async () => {
      ensureSuccess(await client.user.deleteOne({ id: student._id }, { credentials: 'include' }));
      directory.setData(rows => rows.filter(row => row._id !== student._id));
    }} /> },
  ];
  if (!currentUser) return null;
  return <Layout user={currentUser}>
    <Topbar title="Student directory" description="Manage student accounts, academic information, and progress." actions={<Button onClick={() => setAdding(true)} className="bg-logo text-white hover:bg-logo/90"><Plus className="size-4" />Add student</Button>} />
    <DirectorySummary loading={directory.loading} updatedAt={directory.updatedAt} items={[
      { label: 'students', value: directory.data.length }, { label: 'active accounts', value: directory.data.filter(row => !row.locked).length }, { label: 'with graduation details', value: directory.data.filter(row => row.graduationYear).length },
    ]} />
    <DirectoryTable {...directory} columns={columns} noun="students" searchPlaceholder="Search students by name, email, or ID" searchFields={['name', 'email', 'id']} filters={[{ key: 'major', label: 'majors' }, { key: 'track', label: 'tracks' }]} onRefresh={directory.refresh} />
    <RecordDetails record={viewing} onClose={() => setViewing(null)} title="Student details" fields={[{ label: 'Name', value: 'name' }, { label: 'Email', value: 'email' }, { label: 'Student ID', value: 'id' }, { label: 'Major', value: 'major' }, { label: 'Track', value: 'track' }, { label: 'Graduation year', value: 'graduationYear' }]} />
    <RecordEditor record={editing} onClose={() => setEditing(null)} title="Edit student account" fields={[{ key: 'name', label: 'Full name', required: true, minLength: 3 }, { key: 'email', label: 'Email', type: 'email', required: true }]} onSave={async values => { ensureSuccess(await client.user.update({ _id: editing._id, data: values })); await directory.refresh(); }} />
    <RecordEditor record={adding ? {} : null} onClose={() => setAdding(false)} title="Add student" description="Create a student account. Academic details can be completed during onboarding." fields={[
      { key: 'name', label: 'Full name', required: true, minLength: 3 }, { key: 'email', label: 'Email', type: 'email', required: true }, { key: 'id', label: 'Student ID (8 digits)', required: true, pattern: '[0-9]{8}', maxLength: 8 },
      { key: 'password', label: 'Password', type: 'password', required: true, minLength: 8 }, { key: 'confirmPassword', label: 'Confirm password', type: 'password', required: true },
    ]} onSave={async values => {
      const validated = await validateRegisterationForm.validate({ ...values, role: 'student' });
      const response = await client.user.create({ name: validated.name, email: validated.email, id: validated.id, password: validated.password, role: 'student' });
      if (response.status === 201) throw new Error(response.data?.message || 'An account with this email already exists.');
      ensureSuccess(response);
      await directory.refresh();
    }} />
  </Layout>;
}
