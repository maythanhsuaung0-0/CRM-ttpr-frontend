import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { displayValue } from '@/lib/directory-utils';

export function RecordActions({ label, actions = [], onDelete, deleteDisabled = false, deleteLabel = 'Delete', deleteDescription, successMessage }) {
  const triggerRef = useRef(null);
  const actionAfterClose = useRef(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const confirm = async event => {
    event.preventDefault();
    if (pending || deleteDisabled) return;
    setPending(true);
    try {
      await onDelete();
      setConfirming(false);
      toast.success(successMessage || `${label} deleted successfully.`);
    } catch (error) {
      toast.error(error.message || 'The action failed. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild><Button ref={triggerRef} type="button" variant="ghost" size="icon" aria-label={`Actions for ${label}`} className="text-slate-500 hover:bg-slate-100"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={event => {
        // Finish closing the menu before another overlay takes focus or locks page clicks.
        const action = actionAfterClose.current;
        actionAfterClose.current = null;
        if (!action) return;
        event.preventDefault();
        triggerRef.current?.focus();
        action();
      }}>
        <DropdownMenuLabel className="max-w-44 truncate text-xs text-slate-400">{label}</DropdownMenuLabel>
        {actions.map(action => action.to ? <DropdownMenuItem key={action.label} asChild><Link to={action.to}>{action.icon || <Eye className="size-4" />}{action.label}</Link></DropdownMenuItem>
          : <DropdownMenuItem key={action.label} onSelect={() => { actionAfterClose.current = action.onSelect; }} disabled={action.disabled}>{action.icon || <Eye className="size-4" />}{action.label}</DropdownMenuItem>)}
        {onDelete && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" disabled={deleteDisabled} onSelect={() => { actionAfterClose.current = () => setConfirming(true); }}><Trash2 className="size-4" />{deleteLabel}</DropdownMenuItem>{deleteDisabled && <p className="px-2 py-1 text-xs text-slate-500">Your signed-in account is protected.</p>}</>}
      </DropdownMenuContent>
    </DropdownMenu>
    <AlertDialog open={confirming} onOpenChange={open => { if (!pending) setConfirming(open); }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{deleteLabel} {label}?</AlertDialogTitle><AlertDialogDescription>{deleteDescription || 'This permanently removes this record. This action cannot be undone.'}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction disabled={pending || deleteDisabled} onClick={confirm} className="bg-destructive text-white hover:bg-destructive/90">{pending ? 'Working…' : deleteLabel}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}

export function RecordDetails({ record, onClose, title, fields }) {
  return <Dialog open={Boolean(record)} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Record details</DialogDescription></DialogHeader>
    {record && <dl className="grid gap-4 py-2">{fields.map(field => <div key={field.label} className="grid gap-1 border-b border-slate-100 pb-3 last:border-0"><dt className="text-xs font-medium text-slate-500">{field.label}</dt><dd className="whitespace-pre-wrap break-words text-sm text-slate-800">{displayValue(typeof field.value === 'function' ? field.value(record) : record[field.value])}</dd></div>)}</dl>}
  </DialogContent></Dialog>;
}

function EditorForm({ record, fields, onSave, onClose, onSavingChange }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    onSavingChange(true);
    setError('');
    try {
      await onSave(values);
      onClose();
      toast.success('Changes saved successfully.');
    } catch (failure) {
      setError(failure.message || 'Unable to save changes.');
    } finally {
      setSaving(false);
      onSavingChange(false);
    }
  };
  return <form onSubmit={submit} className="grid gap-4">
    <fieldset disabled={saving} className="grid gap-4">
      {fields.map(field => <label key={field.key} className="grid gap-1.5 text-xs font-medium text-slate-600">{field.label}{field.required && ' *'}
        {field.options ? <select name={field.key} defaultValue={record[field.key] || ''} required={field.required} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900">{field.options.map(value => <option key={value}>{value}</option>)}</select>
          : <input name={field.key} type={field.type || 'text'} defaultValue={record[field.key] || ''} required={field.required} minLength={field.minLength} maxLength={field.maxLength} pattern={field.pattern} autoComplete={field.type === 'password' ? 'new-password' : undefined} className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100" />}
      </label>)}
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="mt-2 flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving} className="bg-logo text-white hover:bg-logo/90">{saving ? 'Saving…' : 'Save changes'}</Button></div>
  </form>;
}

export function RecordEditor({ record, onClose, title, description = 'Update the information below and save your changes.', fields, onSave }) {
  const [saving, setSaving] = useState(false);
  return <Dialog open={Boolean(record)} onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
    {record && <EditorForm key={record._id || 'new'} record={record} fields={fields} onSave={onSave} onClose={onClose} onSavingChange={setSaving} />}
  </DialogContent></Dialog>;
}
