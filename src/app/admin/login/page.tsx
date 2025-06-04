'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const loginFormSchema = z.object({
    phoneNumber: z.string().regex(/^\d{10,15}$/, { message: 'Invalid phone number format.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            phoneNumber: '',
            password: '',
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (response.ok) {
                // Assuming data contains a token and user role
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userId', data.user.id);

                toast({
                    title: 'Success',
                    description: 'Logged in successfully!',
                    variant: 'default',
                });

                if (data.user.role === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    toast({
                        title: 'Access Denied',
                        description: 'You do not have administrative privileges.',
                        variant: 'destructive',
                    });
                    // Optional: redirect to a non-admin dashboard or logout
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userId');
                }
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Login failed.',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Login failed:', error);
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
                    <CardDescription className="text-center">Enter your credentials to access the admin panel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <Input id="phoneNumber" type="tel" {...form.register('phoneNumber')} />
                            {form.formState.errors.phoneNumber && (
                                <p className="text-red-500 text-sm">{form.formState.errors.phoneNumber.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <Input id="password" type="password" {...form.register('password')} />
                            {form.formState.errors.password && (
                                <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 