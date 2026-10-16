import { useState } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { DirectoryBadge, DirectorySummary, DirectoryTable } from '@/components/directory-table';
import { RecordActions, RecordDetails } from '@/components/record-actions';
import { RecordIdentity } from '@/components/record-identity';
import { useAuth, useClient } from '@/lib/dataContext';
import { useDirectoryData } from '@/hooks/use-directory-data';
import { collection, ensureSuccess, formatDate } from '@/lib/directory-utils';

export default function ViewStaffRequests() {
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(null);
  const directory = useDirectoryData(async () => {
    const pageSize = 100;
    const firstResponse = await client.user.fetchPendingStaffs({ page: 1, pageSize });
    const first = ensureSuccess(firstResponse);
    const totalPages = Math.ceil((first.metadata?.totalCount || 0) / pageSize);
    const remaining = await Promise.all(Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => client.user.fetchPendingStaffs({ page: index + 2, pageSize })));
    return [...collection(firstResponse, 'pendingStaffs'), ...remaining.flatMap(response => collection(response, 'pendingStaffs'))];
  }, token);
  const handleAction = async (staff, action) => {
    setBusy(staff._id);
    try {
      ensureSuccess(await client.user.actionPendingStaff(staff._id, { action }, { credentials: 'include' }));
      directory.setData(rows => rows.filter(row => row._id !== staff._id));
      const notification = await client.email.send({ to: staff.email, action });
      if (notification.status !== 200) toast.error('The account was updated, but its notification email could not be sent.');
    } finally {
      setBusy(null);
    }
  };
  const columns = [
    { key: 'member', label: 'Staff member', accessor: 'name', render: staff => <RecordIdentity name={staff.name} email={staff.email} id={staff.id} /> },
    { key: 'role', label: 'Requested role', accessor: 'role', render: staff => <DirectoryBadge tone="cyan">{staff.role}</DirectoryBadge> },
    { key: 'created', label: 'Requested on', sortValue: staff => new Date(staff.createdAt).getTime() || 0, render: staff => formatDate(staff.createdAt) },
    { key: 'status', label: 'Status', render: () => <DirectoryBadge tone="orange">Pending approval</DirectoryBadge> },
    { key: 'actions', label: 'Actions', render: staff => <RecordActions label={staff.name} actions={[{ label: 'View request', onSelect: () => setViewing(staff) }, { label: busy === staff._id ? 'Approving…' : 'Approve account', icon: <Check className="size-4" />, disabled: busy !== null, onSelect: async () => {
      try { await handleAction(staff, 'approve'); toast.success('Staff account approved.'); } catch (error) { toast.error(error.message || 'Approval failed.'); }
    } }]} onDelete={() => handleAction(staff, 'reject')} deleteDisabled={staff._id === currentUser?._id} deleteLabel="Reject request" deleteDescription="Rejecting this request permanently removes the pending account. The applicant will be notified by email." successMessage="Staff request rejected." /> },
  ];
  if (!currentUser) return null;
  return <Layout user={currentUser}>
    <Topbar title="Staff requests" description="Review new staff registrations and manage account approvals." />
    <DirectorySummary loading={directory.loading} updatedAt={directory.updatedAt} items={[{ label: 'pending requests', value: directory.data.length }, { label: 'administrator requests', value: directory.data.filter(row => row.role === 'admin').length }]} />
    <DirectoryTable {...directory} columns={columns} noun="requests" searchPlaceholder="Search requests by name, email, or ID" searchFields={['name', 'email', 'id']} filters={[{ key: 'role', label: 'roles' }]} onRefresh={directory.refresh} emptyMessage="No pending staff requests" />
    <RecordDetails record={viewing} onClose={() => setViewing(null)} title="Staff request" fields={[{ label: 'Full name', value: 'name' }, { label: 'Email', value: 'email' }, { label: 'Employee ID', value: 'id' }, { label: 'Requested role', value: 'role' }, { label: 'Requested on', value: row => formatDate(row.createdAt) }]} />
  </Layout>;
}
