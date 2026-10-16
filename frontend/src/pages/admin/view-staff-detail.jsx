import { useParams } from 'react-router';
import { Mail, MapPin, Phone } from 'lucide-react';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { DirectoryBadge } from '@/components/directory-table';
import { RecordIdentity, RecordLink } from '@/components/record-identity';
import { useAuth, useClient } from '@/lib/dataContext';
import { useDirectoryData } from '@/hooks/use-directory-data';
import { collection, displayValue } from '@/lib/directory-utils';

export default function StaffDetail() {
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const { id } = useParams();
  const directory = useDirectoryData(async () => {
    const [userResponse, profileResponse] = await Promise.all([client.user.fetchById(id), client.adminProfile.fetchById(id)]);
    const user = collection(userResponse)[0];
    if (!user) throw new Error('This staff member could not be found.');
    const profile = collection(profileResponse)[0] || {};
    let department;
    if (profile.department_id) {
      const response = await client.departments.fetchOne(profile.department_id);
      department = response.data?.departments?.name;
    }
    return [{ ...profile, ...user, department, position: profile.position, profileImage: profile.profileImage, linkedin: profile.linkedin, address: profile.address }];
  }, `${token || ''}:${id}`);
  const staff = directory.data[0];
  if (!currentUser) return null;
  return <Layout user={currentUser}>
    <Topbar title="Staff details" description="Review contact details, department information, and account access." />
    {directory.error && <div role="alert" className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-800">{directory.error}<button type="button" onClick={directory.refresh} className="ml-3 font-semibold underline">Try again</button></div>}
    {directory.loading ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading staff details…</p> : staff && <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <RecordIdentity name={staff.name} email={staff.email} id={staff.id} image={staff.profileImage} />
        <DirectoryBadge tone={staff.locked ? 'neutral' : staff.verified ? 'green' : 'orange'}>{staff.locked ? 'Locked' : staff.verified ? 'Active' : 'Pending approval'}</DirectoryBadge>
      </div>
      <div className="grid gap-8 py-6 md:grid-cols-2">
        <div><h2 className="mb-4 text-sm font-semibold text-slate-900">Contact information</h2><div className="grid gap-4 text-sm text-slate-600">
          <p className="flex items-center gap-3"><Mail className="size-4 text-slate-400" />{staff.email ? <a href={`mailto:${staff.email}`} className="hover:text-logo">{staff.email}</a> : '—'}</p>
          <p className="flex items-center gap-3"><Phone className="size-4 text-slate-400" />{displayValue(staff.phone || staff.phoneNumber)}</p>
          <p className="flex items-center gap-3"><MapPin className="size-4 text-slate-400" />{displayValue(staff.address)}</p>
          <div className="flex items-center gap-2"><RecordLink url={staff.linkedin} label={`${staff.name} on LinkedIn`} linkedin /><span className="text-xs text-slate-500">LinkedIn profile</span></div>
        </div></div>
        <div><h2 className="mb-4 text-sm font-semibold text-slate-900">Department and access</h2><dl className="grid gap-4 text-sm"><div><dt className="mb-1 text-xs text-slate-400">Department</dt><dd><DirectoryBadge tone="cyan">{staff.department}</DirectoryBadge></dd></div><div><dt className="mb-1 text-xs text-slate-400">Position</dt><dd>{displayValue(staff.position)}</dd></div><div><dt className="mb-1 text-xs text-slate-400">Account role</dt><dd className="capitalize">{displayValue(staff.role)}</dd></div></dl></div>
      </div>
    </section>}
  </Layout>;
}
