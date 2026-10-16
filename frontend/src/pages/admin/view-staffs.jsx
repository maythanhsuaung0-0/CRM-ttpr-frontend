import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { Button } from '@/components/ui/button';
import { DirectoryBadge, DirectorySummary, DirectoryTable } from '@/components/directory-table';
import { RecordActions, RecordEditor } from '@/components/record-actions';
import { RecordIdentity, RecordLink } from '@/components/record-identity';
import { useAuth, useClient } from '@/lib/dataContext';
import { useDirectoryData } from '@/hooks/use-directory-data';
import { collection, ensureSuccess } from '@/lib/directory-utils';
import { validateRegisterationForm } from '@/lib/validations';

export default function ViewStaffs() {
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const directory = useDirectoryData(async () => {
    const [usersResponse, profilesResponse, departmentsResponse] = await Promise.all([
      client.user.fetchAll(), client.adminProfile.fetchAll(), client.departments.fetchAll(),
    ]);
    const users = collection(usersResponse).filter(user => ['admin', 'staff'].includes(user.role));
    const profiles = collection(profilesResponse);
    const departments = collection(departmentsResponse, 'departments');
    return users.map(user => {
      const profile = profiles.find(item => item.user_id === user._id);
      const department = departments.find(item => item._id === profile?.department_id);
      return { ...user, department: department?.name, position: profile?.position, linkedin: profile?.linkedin,
        profileImage: profile?.profileImage, profileId: profile?._id, phone: user.phone || user.phoneNumber,
        status: user.locked ? 'Locked' : user.verified ? 'Active' : 'Pending',
        incomplete: !profile?.department_id || !profile?.position,
      };
    });
  }, token);
  const removeStaff = async staff => {
    if (staff._id === currentUser._id) throw new Error('You cannot delete your signed-in account.');
    ensureSuccess(await client.user.deleteOne({ id: staff._id }, { credentials: 'include' }));
    directory.setData(rows => rows.filter(row => row._id !== staff._id));
    if (staff.profileId) {
      const result = await client.adminProfile.deleteOne({ id: staff.profileId }, { credentials: 'include' });
      if (result.status !== 200) toast.error('The account was deleted, but its profile could not be removed.');
    }
  };
  const columns = [
    { key: 'member', label: 'Staff member', accessor: 'name', render: staff => <RecordIdentity name={staff.name} email={staff.email} id={staff.id} image={staff.profileImage} to={`/admin/view-staff-details/${staff._id}`} /> },
    { key: 'department', label: 'Department', accessor: 'department', render: staff => <DirectoryBadge tone="cyan">{staff.department}</DirectoryBadge> },
    { key: 'position', label: 'Position', accessor: 'position', render: staff => <div className="flex items-center gap-2"><DirectoryBadge>{staff.position}</DirectoryBadge><RecordLink url={staff.linkedin} label={`${staff.name} on LinkedIn`} linkedin /></div> },
    { key: 'phone', label: 'Phone', accessor: 'phone' },
    { key: 'status', label: 'Status', accessor: 'status', render: staff => <DirectoryBadge tone={staff.status === 'Pending' ? 'orange' : staff.status === 'Active' ? 'green' : 'neutral'}>{staff.status}</DirectoryBadge> },
    { key: 'actions', label: 'Actions', render: staff => <RecordActions label={staff.name} actions={[{ label: 'View details', to: `/admin/view-staff-details/${staff._id}` }, { label: 'Edit account', icon: <Pencil className="size-4" />, onSelect: () => setEditing(staff) }]} onDelete={() => removeStaff(staff)} deleteDisabled={staff._id === currentUser?._id} /> },
  ];
  if (!currentUser) return null;
  return <Layout user={currentUser}>
    <Topbar title="Staff directory" description="Manage staff accounts, roles, and department access." actions={<Button onClick={() => setAdding(true)} className="bg-logo text-white hover:bg-logo/90"><Plus className="size-4" />Add staff member</Button>} />
    <DirectorySummary loading={directory.loading} updatedAt={directory.updatedAt} items={[
      { label: 'total staff', value: directory.data.length },
      { label: 'administrators', value: directory.data.filter(row => row.role === 'admin').length },
      { label: 'incomplete profiles', value: directory.data.filter(row => row.incomplete).length },
    ]} />
    <DirectoryTable {...directory} columns={columns} noun="staff" searchFields={['name', 'email', 'id']} searchPlaceholder="Search staff by name, email, or ID" filters={[{ key: 'department', label: 'departments' }, { key: 'position', label: 'positions' }, { key: 'role', label: 'roles' }]} onRefresh={directory.refresh} />
    <RecordEditor record={editing} onClose={() => setEditing(null)} title="Edit staff account" fields={[
      { key: 'name', label: 'Full name', required: true, minLength: 3 }, { key: 'email', label: 'Email', type: 'email', required: true }, { key: 'phone', label: 'Phone', type: 'tel' },
    ]} onSave={async values => { ensureSuccess(await client.user.update({ _id: editing._id, data: values })); await directory.refresh(); }} />
    <RecordEditor record={adding ? {} : null} onClose={() => setAdding(false)} title="Add staff member" description="Create an administrator account. New accounts appear in staff requests for approval." fields={[
      { key: 'name', label: 'Full name', required: true, minLength: 3 }, { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'id', label: 'Employee ID (8 digits)', required: true, pattern: '[0-9]{8}', maxLength: 8 },
      { key: 'password', label: 'Password', type: 'password', required: true, minLength: 8 }, { key: 'confirmPassword', label: 'Confirm password', type: 'password', required: true },
    ]} onSave={async values => {
      const validated = await validateRegisterationForm.validate({ ...values, role: 'admin' });
      const response = await client.user.create({ name: validated.name, email: validated.email, id: validated.id, password: validated.password, role: 'admin' });
      if (response.status === 201) throw new Error(response.data?.message || 'An account with this email already exists.');
      ensureSuccess(response);
      await directory.refresh();
    }} />
  </Layout>;
}
