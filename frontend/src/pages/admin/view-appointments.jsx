import { useState } from 'react';
import { Pencil } from 'lucide-react';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { DirectoryBadge, DirectorySummary, DirectoryTable } from '@/components/directory-table';
import { RecordActions, RecordDetails, RecordEditor } from '@/components/record-actions';
import { RecordLink } from '@/components/record-identity';
import { useAuth, useClient } from '@/lib/dataContext';
import { useDirectoryData } from '@/hooks/use-directory-data';
import { collection, displayValue, ensureSuccess, formatDate } from '@/lib/directory-utils';

function appointmentTime(value) {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ViewAppointments() {
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const directory = useDirectoryData(async () => {
    const [firstResponse, usersResponse] = await Promise.all([client.appointment.fetchPage(), client.user.fetchAll()]);
    const first = ensureSuccess(firstResponse);
    const users = collection(usersResponse);
    const remaining = await Promise.all(Array.from({ length: Math.max(0, (first.totalPages || 1) - 1) }, (_, index) => client.appointment.fetchPage(index + 2)));
    const appointments = [...collection(firstResponse, 'data'), ...remaining.flatMap(response => collection(response, 'data'))];
    return appointments.map(appointment => ({ ...appointment,
      participantName: users.find(user => user._id === appointment.participant || user.id === appointment.participant)?.name || appointment.participant,
      staffName: users.find(user => user._id === appointment.staff || user.id === appointment.staff)?.name || appointment.staff,
    }));
  }, token);
  const columns = [
    { key: 'title', label: 'Appointment', accessor: 'title', render: appointment => <div className="max-w-64"><p className="truncate font-semibold text-slate-900">{appointment.title}</p><p className="mt-1 truncate text-xs text-slate-400">{appointment.participantName || '—'}</p></div> },
    { key: 'date', label: 'Date and time', sortValue: appointment => new Date(appointment.startTime).getTime() || 0, render: appointment => <div><p>{formatDate(appointment.startTime)}</p><p className="mt-1 text-xs text-slate-400">{appointmentTime(appointment.startTime)}–{appointmentTime(appointment.endTime)}</p></div> },
    { key: 'staff', label: 'Staff member', accessor: 'staffName' },
    { key: 'meetingType', label: 'Type', accessor: 'meetingType', render: appointment => <DirectoryBadge tone="cyan">{appointment.meetingType}</DirectoryBadge> },
    { key: 'location', label: 'Location', accessor: 'location', render: appointment => <div className="flex max-w-44 items-center gap-2"><span className="truncate" title={appointment.location}>{displayValue(appointment.location)}</span><RecordLink url={appointment.meetingLink} label={`Join ${appointment.title}`} /></div> },
    { key: 'status', label: 'Status', accessor: 'status', render: appointment => <DirectoryBadge tone={appointment.status === 'pending' ? 'orange' : appointment.status === 'confirmed' ? 'blue' : appointment.status === 'completed' ? 'green' : 'neutral'}>{appointment.status}</DirectoryBadge> },
    { key: 'actions', label: 'Actions', render: appointment => <RecordActions label={appointment.title} actions={[{ label: 'View details', onSelect: () => setViewing(appointment) }, { label: 'Edit appointment', icon: <Pencil className="size-4" />, onSelect: () => setEditing(appointment) }]} onDelete={async () => {
      ensureSuccess(await client.appointment.deleteOne(appointment._id));
      directory.setData(rows => rows.filter(row => row._id !== appointment._id));
    }} /> },
  ];
  if (!currentUser) return null;
  return <Layout user={currentUser}>
    <Topbar title="Appointments" description="Coordinate advising sessions, interviews, and team meetings." mode="read" link="/admin/create-appointments" actionLabel="Schedule appointment" />
    <DirectorySummary loading={directory.loading} updatedAt={directory.updatedAt} items={[{ label: 'appointments', value: directory.data.length }, { label: 'confirmed', value: directory.data.filter(row => row.status === 'confirmed').length }, { label: 'pending', value: directory.data.filter(row => row.status === 'pending').length }]} />
    <DirectoryTable {...directory} columns={columns} noun="appointments" searchPlaceholder="Search appointments, attendees, or staff" searchFields={['title', 'participantName', 'staffName', 'location']} filters={[{ key: 'meetingType', label: 'meeting types' }, { key: 'status', label: 'statuses' }]} onRefresh={directory.refresh} />
    <RecordDetails record={viewing} onClose={() => setViewing(null)} title="Appointment details" fields={[{ label: 'Title', value: 'title' }, { label: 'Description', value: 'description' }, { label: 'Attendee', value: 'participantName' }, { label: 'Staff member', value: 'staffName' }, { label: 'Date', value: row => formatDate(row.startTime) }, { label: 'Time', value: row => `${appointmentTime(row.startTime)}–${appointmentTime(row.endTime)}` }, { label: 'Location', value: 'location' }, { label: 'Meeting link', value: 'meetingLink' }, { label: 'Notes', value: 'notes' }]} />
    <RecordEditor record={editing} onClose={() => setEditing(null)} title="Edit appointment" fields={[{ key: 'title', label: 'Title', required: true }, { key: 'location', label: 'Location', required: true }, { key: 'meetingLink', label: 'Meeting link' }, { key: 'meetingType', label: 'Meeting type', options: ['online', 'in-person', 'hybrid'] }, { key: 'status', label: 'Status', options: ['pending', 'confirmed', 'cancelled', 'completed', 'noshow', 'rescheduled'] }]} onSave={async values => { ensureSuccess(await client.appointment.update({ _id: editing._id, ...values })); await directory.refresh(); }} />
  </Layout>;
}
