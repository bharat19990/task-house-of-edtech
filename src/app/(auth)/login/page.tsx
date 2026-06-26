'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      const searchParams = new URLSearchParams(window.location.search);
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      router.replace(callbackUrl);
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Welcome back!');
        const searchParams = new URLSearchParams(window.location.search);
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        window.location.href = callbackUrl;
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/25">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-center">
            Sign in to your CollabEdit account
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
