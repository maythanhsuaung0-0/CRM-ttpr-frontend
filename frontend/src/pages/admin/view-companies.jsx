import { Pencil } from 'lucide-react';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { DirectoryBadge, DirectorySummary, DirectoryTable } from '@/components/directory-table';
import { RecordActions } from '@/components/record-actions';
import { RecordIdentity, RecordLink } from '@/components/record-identity';
import { useAuth, useClient } from '@/lib/dataContext';
import { useDirectoryData } from '@/hooks/use-directory-data';
import { collection, displayValue, ensureSuccess } from '@/lib/directory-utils';

export default function ViewCompanies() {
  const { currentUser, token } = useAuth();
  const { client } = useClient();
  const directory = useDirectoryData(async () => {
    const [response, industryResponse] = await Promise.all([client.companies.fetchAll(), client.industries.fetchAll()]);
    const industries = collection(industryResponse, 'industries');
    return collection(response).map(company => ({ ...company, industry: industries.find(item => item._id === company.industry)?.name || company.industry?.name }));
  }, token);
  const columns = [
    { key: 'company', label: 'Company', accessor: 'name', render: company => <RecordIdentity name={company.name} email={company.email} to={`/admin/view-companies/${company._id}`} /> },
    { key: 'industry', label: 'Industry', accessor: 'industry', render: company => <DirectoryBadge tone="cyan">{company.industry}</DirectoryBadge> },
    { key: 'contact', label: 'Contact', accessor: 'contactName', render: company => <div><p className="font-medium text-slate-700">{displayValue(company.contactName)}</p><p className="mt-0.5 text-xs text-slate-400">{displayValue(company.contactEmail)}</p></div> },
    { key: 'location', label: 'Location', accessor: 'location', render: company => <span className="block max-w-64 truncate" title={company.location}>{displayValue(company.location)}</span> },
    { key: 'website', label: 'Website', render: company => <RecordLink url={company.website} label={`Visit ${company.name}`} /> },
    { key: 'actions', label: 'Actions', render: company => <RecordActions label={company.name} actions={[{ label: 'View company', to: `/admin/view-companies/${company._id}` }, { label: 'Edit company', to: `/admin/view-companies/${company._id}`, icon: <Pencil className="size-4" /> }]} onDelete={async () => {
      ensureSuccess(await client.companies.deleteOne(company._id, { credentials: 'include' }));
      directory.setData(rows => rows.filter(row => row._id !== company._id));
    }} /> },
  ];
  if (!currentUser) return null;
  return <Layout user={currentUser}>
    <Topbar title="Company directory" description="Manage employer partnerships, contacts, and opportunities." mode="read" link="/admin/create-companies" actionLabel="Add company" createmultiple setReload={() => directory.refresh()} />
    <DirectorySummary loading={directory.loading} updatedAt={directory.updatedAt} items={[
      { label: 'companies', value: directory.data.length }, { label: 'industries', value: new Set(directory.data.map(row => row.industry).filter(Boolean)).size }, { label: 'with a contact', value: directory.data.filter(row => row.contactEmail).length },
    ]} />
    <DirectoryTable {...directory} columns={columns} noun="companies" searchFields={['name', 'email', 'contactName', 'contactEmail', 'location']} searchPlaceholder="Search companies, contacts, or locations" filters={[{ key: 'industry', label: 'industries' }]} onRefresh={directory.refresh} />
  </Layout>;
}
