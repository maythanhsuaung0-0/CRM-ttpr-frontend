import { Link } from 'react-router';
import { Linkedin, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { displayValue, safeExternalUrl } from '@/lib/directory-utils';

export function RecordIdentity({ name, email, id, image, to, subtitle }) {
  const label = displayValue(name);
  const initials = label === '—' ? '?' : label.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <div className="flex min-w-52 items-center gap-3">
    <Avatar className="size-9 shrink-0"><AvatarImage src={image} alt="" /><AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-700">{initials}</AvatarFallback></Avatar>
    <div className="min-w-0"><div className="flex items-baseline gap-2 font-semibold text-slate-900">{to ? <Link to={to} className="rounded hover:text-logo focus-visible:outline-2 focus-visible:outline-logo">{label}</Link> : label}{id && <span className="text-[11px] font-normal text-slate-400">ID {id}</span>}</div>
      {email && displayValue(email) !== '—' && <div className="mt-0.5 text-xs text-slate-500">{email}</div>}
      {subtitle && <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>}
    </div>
  </div>;
}

export function RecordLink({ url, label = 'Open website', linkedin = false }) {
  const safeUrl = safeExternalUrl(url);
  const Icon = linkedin ? Linkedin : ExternalLink;
  return safeUrl ? <a href={safeUrl} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="inline-flex rounded-md p-1.5 text-cyan-700 transition-colors hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-cyan-500"><Icon className="size-4" /></a> : <span className="text-slate-400">—</span>;
}
