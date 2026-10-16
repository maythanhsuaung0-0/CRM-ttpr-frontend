import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import Layout from '@/components/layout';
import { Topbar } from '@/components/topbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, useClient } from '@/lib/dataContext';
import { collection, ensureSuccess } from '@/lib/directory-utils';
import { validateDepartmentForm, validateMajorsForm } from '@/lib/validations';
import { degreeOptions, departmentPayload, majorFormValues, majorPayload, savedResource } from '@/lib/resource-payloads';

const defaults = {
  department: { name: '', roomNo: '' },
  major: { name: '', degree: '', department: '', track: '', description: '' },
};

export function AcademicForm({ kind }) {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { client } = useClient();
  const navigate = useNavigate();
  const isMajor = kind === 'major';
  const service = isMajor ? client.majors : client.departments;
  const listPath = `/admin/view-${isMajor ? 'majors' : 'departments'}`;
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(Boolean(id) || isMajor);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const form = useForm({
    resolver: yupResolver(isMajor ? validateMajorsForm : validateDepartmentForm),
    defaultValues: defaults[kind],
  });
  const { reset } = form;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [recordResponse, departmentsResponse] = await Promise.all([
          id ? service.fetchOne(id) : null,
          isMajor ? client.departments.fetchAll() : null,
        ]);
        if (!active) return;
        if (departmentsResponse) setDepartments(collection(departmentsResponse, 'departments'));
        if (recordResponse) {
          const body = ensureSuccess(recordResponse);
          const record = isMajor ? body.majors : body.departments;
          if (!record || Array.isArray(record)) throw new Error(`This ${kind} could not be found.`);
          reset(isMajor ? majorFormValues(record) : { name: record.name || '', roomNo: record.roomNo || '' });
        } else {
          reset(defaults[kind]);
        }
      } catch (error) {
        if (active) setLoadError(error.message || `Unable to load ${kind} details.`);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [client, service, id, isMajor, kind, reset, attempt]);

  const submit = async values => {
    form.clearErrors('root.server');
    try {
      const payload = isMajor ? majorPayload(values) : departmentPayload(values);
      const response = id ? await service.update(id, payload) : await service.create(payload);
      savedResource(response);
      toast.success(`${isMajor ? 'Major' : 'Department'} ${id ? 'updated' : 'created'} successfully.`);
      navigate(listPath);
    } catch (error) {
      form.setError('root.server', { type: 'server', message: error.message || 'Unable to save. Please try again.' });
    }
  };
  const busy = form.formState.isSubmitting;
  const noDepartments = isMajor && !loading && !loadError && departments.length === 0;
  const disabled = loading || busy || Boolean(loadError) || noDepartments;
  const selectClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100';
  if (!currentUser) return null;

  return (
    <Layout user={currentUser}>
      <Topbar
        title={`${id ? 'Edit' : 'Add'} ${kind}`}
        description={isMajor ? 'Organize academic programs, degrees, and the departments that support them.' : 'Organize your team with department details and a room location.'}
        actions={<>
          <Button type="button" variant="outline" disabled={busy} onClick={() => navigate(listPath)}>Cancel</Button>
          <Button type="submit" form={`${kind}-form`} disabled={disabled} className="bg-logo text-white hover:bg-logo/90">
            {busy ? 'Saving…' : id ? 'Save changes' : `Save ${kind}`}
          </Button>
        </>}
      />
      {loadError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
        <p>{loadError}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="font-semibold underline">Try again</button>
      </div>}
      {noDepartments && <div role="status" className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800">
        Create a department before adding a major. <Link to="/admin/create-departments" className="font-semibold underline">Add a department</Link>
      </div>}
      <section className="crm-form-panel">
        <div className="crm-form-heading">
          <h2>{isMajor ? 'Academic information' : 'Department details'}</h2>
          <p>{isMajor ? 'Choose a degree and department. Add optional tracks and a description for the program.' : 'Enter the department name and its room location. Room number is optional.'}</p>
        </div>
        {loading && <p role="status" className="mb-5 text-sm text-slate-500">Loading {kind} information…</p>}
        <Form {...form}>
          <form id={`${kind}-form`} noValidate onSubmit={form.handleSubmit(submit)}>
            <fieldset disabled={disabled} className="grid gap-6 md:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isMajor ? 'Major' : 'Department'} name *</FormLabel>
                  <FormControl><Input placeholder={isMajor ? 'e.g. Computer Systems' : 'e.g. Career Services'} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {isMajor ? <>
                <FormField control={form.control} name="degree" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree *</FormLabel>
                    <FormControl><select {...field} className={selectClass}>
                      <option value="" disabled>Select a degree</option>
                      {degreeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <FormControl><select {...field} className={selectClass}>
                      <option value="" disabled>Select a department</option>
                      {departments.map(department => <option key={department._id} value={department._id}>{department.name}</option>)}
                    </select></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="track" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracks (optional)</FormLabel>
                    <FormControl><Input placeholder="e.g. Software Development, Networking" {...field} /></FormControl>
                    <FormDescription>Separate tracks with commas.</FormDescription><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl><Textarea rows={4} placeholder="Describe the program and its learning goals." {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
              </> : <FormField control={form.control} name="roomNo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Room number (optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. N604" {...field} /></FormControl><FormMessage />
                </FormItem>
              )} />}
            </fieldset>
            {form.formState.errors.root?.server && <p role="alert" className="mt-5 text-sm text-destructive">{form.formState.errors.root.server.message}</p>}
          </form>
        </Form>
      </section>
    </Layout>
  );
}
