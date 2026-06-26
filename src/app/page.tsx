import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <div className="relative overflow-hidden bg-background">
      {}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute right-10 bottom-10 -z-10 h-[250px] w-[250px] rounded-full bg-purple-500/5 blur-[60px]" />

      <div className="container px-4 py-20 sm:py-32 lg:py-40 flex flex-col items-center text-center">
        {}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-xs font-medium text-muted-foreground mb-6 animate-fade-in">
          <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span>Local-First & Real-Time CRDT Sync</span>
        </div>

        {}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Collaborate on Documents,{' '}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Even While Offline.
          </span>
        </h1>

        {}
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl sm:text-xl">
          CollabEdit is a state-of-the-art local-first document editor. Experience instant keystroke sync, automated conflict resolution, and integrated AI writing assistance.
        </p>

        {}
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="px-8 font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-300">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg" className="px-8 font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-300">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 font-semibold">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
