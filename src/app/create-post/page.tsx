'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
    description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    phoneNumber: z.string().regex(/^\d{10,15}$/, { message: 'Invalid phone number format.' }),
    email: z.string().email({ message: 'Invalid email address.' }),
    images: z.any().refine(files => files?.length > 0, 'Image is required.'),
});

type CreatePostFormValues = z.infer<typeof formSchema>;

export default function CreatePostPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<CreatePostFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: '',
            name: '',
            phoneNumber: '',
            email: '',
            images: undefined,
        },
    });

    const onSubmit = async (values: CreatePostFormValues) => {
        if (!termsAccepted) {
            toast({
                title: 'Error',
                description: 'You must accept the terms and conditions.',
                variant: 'destructive',
            });
            return;
        }

        const formData = new FormData();
        formData.append('description', values.description);
        formData.append('name', values.name);
        formData.append('phoneNumber', values.phoneNumber);
        formData.append('email', values.email);

        // Append all selected files
        if (values.images instanceof FileList) {
            for (let i = 0; i < values.images.length; i++) {
                formData.append('images', values.images[i]);
            }
        }

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: data.message,
                    variant: 'default',
                });
                form.reset();
                setTermsAccepted(false);
                setIsDialogOpen(false);
                router.push('/'); // Redirect to home or all posts page
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to create post.',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Post creation failed:', error);
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <Textarea id="description" {...form.register('description')} />
                    {form.formState.errors.description && (
                        <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <Input id="name" {...form.register('name')} />
                    {form.formState.errors.name && (
                        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <Input id="phoneNumber" type="tel" {...form.register('phoneNumber')} />
                    {form.formState.errors.phoneNumber && (
                        <p className="text-red-500 text-sm">{form.formState.errors.phoneNumber.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <Input id="email" type="email" {...form.register('email')} />
                    {form.formState.errors.email && (
                        <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="images" className="block text-sm font-medium text-gray-700">Images</label>
                    <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        {...form.register('images')}
                    />
                    {form.formState.errors.images && (
                        <p className="text-red-500 text-sm">{form.formState.errors.images.message as string}</p>
                    )}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button">Submit Post</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Terms and Conditions</DialogTitle>
                            <DialogDescription asChild>
                                <span>Please read and agree to our terms and conditions before submitting your post.</span>
                            </DialogDescription>
                            <div className="mt-4 p-4 border rounded-md h-48 overflow-y-scroll">
                                <p>1. By submitting this post, you agree to allow us to display your content publicly.</p>
                                <p>2. You confirm that you have the rights to the images uploaded and that they do not infringe on any copyrights.</p>
                                <p>3. Your submitted information (name, phone, email) will be used to create a member account for you. Your phone number will be used as a temporary password, which you should change immediately after logging in.</p>
                                <p>4. We reserve the right to remove any content deemed inappropriate or violating our policies.</p>
                                <p>5. Your data will be handled in accordance with our privacy policy.</p>
                                <p>6. Participation in any lottery or rewards program is subject to specific rules and eligibility criteria.</p>
                                <p>7. All content is subject to review by administrators.</p>
                            </div>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="terms"
                                checked={termsAccepted}
                                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                            />
                            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I agree to the terms and conditions
                            </label>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => form.handleSubmit(onSubmit)()} disabled={!termsAccepted}>Confirm & Submit</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </form>
        </div>
    );
} 