'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ImageUpload';
import { useAuth } from '@/components/providers/AuthProvider';

export default function CreatePostPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isLoading } = useAuth(); // Use the auth hook
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state

    // Define the formSchema dynamically inside the component
    const currentFormSchema = useMemo(() => {
        const baseSchema = {
            title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(100, { message: 'Title must be at most 100 characters.' }),
            description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
            images: z.any().refine(files => files && files.length > 0, 'Image is required.'),
        };

        if (user) {
            // If logged in, name, phoneNumber, email are truly optional as they come from user data
            return z.object({
                ...baseSchema,
                name: z.string().optional(),
                phoneNumber: z.string().optional(),
                email: z.string().optional(),
            });
        } else {
            // If not logged in, name and phoneNumber are required. Email is optional but validated if present.
            return z.object({
                ...baseSchema,
                name: z.string().min(2, { message: 'Name is required and must be at least 2 characters.' }),
                phoneNumber: z.string().regex(/^\d{10,15}$/, { message: 'Phone number is required and must be 10-15 digits.' }),
                email: z.string().optional().refine((val) => {
                    if (val) {
                        return z.string().email({ message: 'Invalid email address.' }).safeParse(val).success;
                    }
                    return true;
                }, { message: 'Invalid email address.' }),
            });
        }
    }, [user]);

    // Infer the type directly from the dynamic schema
    type CreatePostFormValues = z.infer<typeof currentFormSchema>;

    const form = useForm<CreatePostFormValues>({
        resolver: zodResolver(currentFormSchema),
        defaultValues: {
            title: '',
            description: '',
            name: user?.user.name || '',
            phoneNumber: user?.user.phoneNumber || '',
            email: user?.user.email || '',
            images: undefined,
        },
        // Re-validate form when user status changes (important for conditional validation)
        mode: 'onChange',
    });

    // Define the render function for the ImageUpload component INSIDE the functional component
    const renderImageUpload = useCallback(
        ({ field }: { field: ControllerRenderProps<CreatePostFormValues, "images"> }) => (
            <ImageUpload field={field} />
        ),
        [] // Memoize with empty dependency array
    );

    // Set form values when user data loads
    useEffect(() => {
        const currentName = form.getValues('name');
        const currentPhoneNumber = form.getValues('phoneNumber');
        const currentEmail = form.getValues('email');

        const newName = user?.user.name || '';
        const newPhoneNumber = user?.user.phoneNumber || '';
        const newEmail = user?.user.email || '';

        // Only set value if it's actually different to avoid unnecessary updates
        if (currentName !== newName) {
            form.setValue('name', newName);
        }
        if (currentPhoneNumber !== newPhoneNumber) {
            form.setValue('phoneNumber', newPhoneNumber);
        }
        if (currentEmail !== newEmail) {
            form.setValue('email', newEmail);
        }
    }, [user, form]);

    const onSubmit = async (values: CreatePostFormValues) => {
        if (!termsAccepted) {
            toast({
                title: 'Error',
                description: 'You must accept the terms and conditions.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true); // Set loading state to true

        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description);

        // Use user data if logged in, otherwise use form values
        if (user) {
            formData.append('name', user?.user.name || '');
            formData.append('phoneNumber', user?.user.phoneNumber || '');
            formData.append('email', user?.user.email || '');
        } else {
            formData.append('name', values.name || ''); // Add empty string fallback
            formData.append('phoneNumber', values.phoneNumber || ''); // Add empty string fallback
            formData.append('email', values.email || ''); // Add empty string fallback
        }

        // Append all selected files
        if (values.images && Array.isArray(values.images)) {
            for (let i = 0; i < values.images.length; i++) {
                formData.append('images', values.images[i]);
            }
        } else if (values.images instanceof FileList) {
            // Fallback for older behavior or if type assertion is off
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
        } finally {
            setIsSubmitting(false); // Reset loading state in finally block
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-4">Loading user data...</div>;
    }

    return (
        <div className="container mx-auto p-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:mx-20">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">標題</label>
                    <Input id="title" {...form.register('title')} />
                    {form.formState.errors.title && (
                        <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">內容</label>
                    <Textarea id="description" {...form.register('description')} />
                    {form.formState.errors.description && (
                        <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
                    )}
                </div>

                {/* Conditionally render name, phone, and email fields */}
                {!user && (
                    <>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">如何稱呼</label>
                            <Input id="name" {...form.register('name')} />
                            {form.formState.errors.name && (
                                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">電話</label>
                            <Input id="phoneNumber" type="tel" {...form.register('phoneNumber')} />
                            {form.formState.errors.phoneNumber && (
                                <p className="text-red-500 text-sm">{form.formState.errors.phoneNumber.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">信箱</label>
                            <Input id="email" type="email" {...form.register('email')} />
                            {form.formState.errors.email && (
                                <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                    </>
                )}

                <div>
                    <label htmlFor="images" className="block text-sm font-medium text-gray-700">上傳 照片</label>
                    {/* Use Controller with the memoized render function defined inside the component */}
                    <Controller
                        name="images"
                        control={form.control}
                        render={renderImageUpload} // Use the defined function here
                    />
                    {form.formState.errors.images && (
                        <p className="text-red-500 text-sm">{form.formState.errors.images.message as string}</p>
                    )}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button">上傳夢想卡</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>條款和條件</DialogTitle>
                            <DialogDescription asChild>
                                <span>請閱讀並同意我們的條款和條件，然後提交您的夢想卡。</span>
                            </DialogDescription>
                            <div className="mt-4 p-4 border rounded-md h-48 overflow-y-scroll">
                                <p>1. 提交夢想卡即表示您同意我們公開顯示您的內容。</p>
                                <p>2. 您確認您上傳的圖片具有合法權利，並且不侵犯任何版權。</p>
                                <p>3. 您提交的信息（姓名、電話、電子郵件）將用於為您創建一個會員帳戶。您的電話號碼將用作臨時密碼，您應在登錄後立即更改。</p>
                                <p>4. 我們保留刪除任何被認為不適當或違反我們政策的內容的權利。</p>
                                <p>5. 您的數據將按照我們的隱私政策處理。</p>
                                <p>6. 參與任何抽獎或獎勵計劃受特定規則和資格標準的約束。</p>
                                <p>7. 所有內容均受管理員的審查。</p>
                            </div>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="terms"
                                checked={termsAccepted}
                                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                            />
                            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                我同意條款和條件
                            </label>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => form.handleSubmit(onSubmit)()} disabled={!termsAccepted || isSubmitting}> {/* Disable button while submitting */}
                                {isSubmitting ? '提交中...' : '確認並提交'} {/* Change button text/content */}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </form>
        </div>
    );
} 