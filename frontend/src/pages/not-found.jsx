import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/dataContext';

export default function NotFound() {
  const { currentUser } = useAuth();
  const home = currentUser ? currentUser.role === 'admin' ? '/admin' : '/' : '/login';
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <BrandLogo />
        <p className="mt-8 text-xs font-semibold tracking-widest text-cyan-700">404 · PAGE NOT FOUND</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">We couldn’t find that page</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">The address may be incorrect or the page may have moved. Return to your workspace to continue.</p>
        <Button asChild className="mt-6 bg-logo text-white hover:bg-logo/90"><Link to={home}><ArrowLeft className="size-4" />{currentUser ? 'Back to workspace' : 'Go to login'}</Link></Button>
      </div>
    </main>
  );
}
