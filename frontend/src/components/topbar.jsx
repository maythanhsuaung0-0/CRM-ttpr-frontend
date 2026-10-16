import { useRef, useState } from 'react';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { useClient } from '@/lib/dataContext';
import { ensureSuccess } from '@/lib/directory-utils';

const pageCopy = {
  'Add New Company': ['Add company', 'Build your employer network with company and contact information.'],
  'Add New Department': ['Add department', 'Organize your team with department details and a room location.'],
  'Create New Internship': ['Create internship', 'Define a role, application requirements, and a deadline.'],
  'Schedule New Appointment': ['Schedule appointment', 'Set up an advising session, interview, or team meeting.'],
  'Our Staffs': ['Staff directory', 'Manage staff accounts, roles, and department access.'],
  'Our Students': ['Student directory', 'Manage student profiles, academic information, and progress.'],
  'Pending Staff Requests': ['Staff requests', 'Review new staff registrations and manage account approvals.'],
  'Staff Detail': ['Staff details', 'Review contact details, department information, and account access.'],
};

export function Topbar({ title, description, mode, link, actionLabel = 'Add record', creatable = true, createmultiple = false, setReload, actions }) {
  const navigate = useNavigate();
  const { client } = useClient();
  const fileInput = useRef(null);
  const [importing, setImporting] = useState(false);
  const [heading, supportingText] = pageCopy[title] || [title, mode === 'read' ? 'Find, review, and manage your records in one place.' : 'Enter the details below. Review your information before saving.'];
  const importCompanies = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    Papa.parse(file, {
      header: true, skipEmptyLines: 'greedy',
      complete: async result => {
        try {
          if (result.errors.length) throw new Error('The CSV contains invalid rows. Check the file and try again.');
          if (!result.data.length) throw new Error('The CSV file has no records.');
          ensureSuccess(await client.companies.createMany({ data: result.data }));
          toast.success('Companies imported successfully.');
          setReload?.(true);
        } catch (error) {
          toast.error(error.message || 'Import failed. Some rows may already have been saved; refresh the list before retrying.');
        } finally {
          setImporting(false);
        }
      },
      error: () => { setImporting(false); toast.error('Unable to read the CSV file.'); },
    });
  };

  return <div className="mb-6">
    <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex cursor-pointer items-center gap-1.5 rounded text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo"><ArrowLeft className="size-3.5" />Back</button>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="relative pl-4 before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:bg-cyan-500 after:absolute after:bottom-1 after:left-0 after:h-2 after:w-1 after:rounded-full after:bg-orange-400">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{heading}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description || supportingText}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {mode === 'read' && creatable && link && <Button asChild className="bg-logo text-white hover:bg-logo/90"><Link to={link}><Plus className="size-4" />{actionLabel}</Link></Button>}
        {createmultiple && setReload && <><input ref={fileInput} type="file" accept=".csv,text/csv" onChange={importCompanies} className="hidden" aria-label="Upload companies CSV" /><Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={importing} className="bg-white"><Upload className="size-4" />{importing ? 'Importing…' : 'Import CSV'}</Button></>}
      </div>
    </div>
  </div>;
}
