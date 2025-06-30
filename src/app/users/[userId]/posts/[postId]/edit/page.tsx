'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

const formSchema = z.object({
    title: z.string().min(5, { message: '標題必須至少有5個字符。' }).max(100, { message: '標題不能超過100個字符。' }),
    description: z.string().min(10, { message: '描述必須至少有10個字符。' }),
    name: z.string().min(2, { message: '姓名必須至少有2個字符。' }),
    phoneNumber: z.string().regex(/^\d{10}$/, { message: '電話號碼無效。' }),
    email: z.string().email({ message: '電子郵件無效。' }).optional().or(z.literal('')),
    agreeTerms: z.boolean().refine(val => val === true, { message: '您必須同意條款和條件。' }),
});

type FormData = z.infer<typeof formSchema>;

interface ImageData {
    url: string;
    public_id: string;
}

const EditPostPage = () => {
    const router = useRouter();
    const params = useParams();
    const { userId, postId } = params;
    const { toast } = useToast();
    const { user } = useAuth();
    const [existingImages, setExistingImages] = useState<ImageData[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            name: '',
            phoneNumber: '',
            email: '',
            agreeTerms: false,
        },
    });

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('hem-story-user') || '{}');
                const token = userData.token;

                if (!token) {
                    toast({
                        title: '錯誤',
                        description: '您需要登入才能編輯貼文。',
                        variant: 'destructive',
                    });
                    router.push('/auth/login');
                    return;
                }

                const response = await axios.get(`/api/posts/${postId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const { post } = response.data;
                console.log('Post data:', post);

                // 檢查編輯權限
                if (!post || !post.userId || post.userId._id !== userId) {
                    toast({
                        title: '錯誤',
                        description: '您沒有權限編輯此貼文。',
                        variant: 'destructive',
                    });
                    router.push('/posts');
                    return;
                }

                // 用貼文資料更新表單
                form.reset({
                    title: post.title || '',
                    description: post.description || '',
                    name: post.userId?.name || user?.user.name || '',
                    phoneNumber: post.userId?.phoneNumber || user?.user.phoneNumber || '',
                    email: post.userId?.email || user?.user.email || '',
                    agreeTerms: true,
                });

                // 更新圖片
                if (post.images && Array.isArray(post.images)) {
                    setExistingImages(post.images);
                }

                setLoading(false);
            } catch (error: any) {
                console.error('載入貼文時發生錯誤：', error);
                const errorMessage = error.response?.data?.message || '無法載入貼文。';
                toast({
                    title: '錯誤',
                    description: errorMessage,
                    variant: 'destructive',
                });
                setLoading(false);
            }
        };

        if (postId && userId) {
            fetchPost();
        }
    }, [postId, userId, router, form, toast, user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files]);
        }
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        try {
            const userData = JSON.parse(localStorage.getItem('hem-story-user') || '{}');
            const token = userData.token;

            if (!token) {
                toast({
                    title: '錯誤',
                    description: '您的登入會話已過期。請重新登入。',
                    variant: 'destructive',
                });
                router.push('/auth/login');
                return;
            }

            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('name', data.name);
            formData.append('phoneNumber', data.phoneNumber);
            if (data.email) {
                formData.append('email', data.email);
            }
            formData.append('agreeTerms', String(data.agreeTerms));

            existingImages.forEach(image => {
                formData.append('existingImagePublicIds', image.public_id);
            });

            imageFiles.forEach(file => {
                formData.append('images', file);
            });

            await axios.put(`/api/users/${userId}/posts/${postId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            toast({
                title: '成功',
                description: '您的貼文已成功更新。',
            });
            router.push(`/users/${userId}/posts`);
        } catch (error: any) {
            console.error('更新貼文時發生錯誤：', error);
            const errorMessage = error.response?.data?.message || '無法更新貼文。';
            toast({
                title: '錯誤',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-lg">正在載入貼文...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Card className="p-6">
                <h1 className="text-2xl font-bold mb-6">編輯貼文</h1>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">標題</label>
                        <Input
                            id="title"
                            {...form.register('title')}
                            placeholder="輸入貼文標題..."
                        />
                        {form.formState.errors.title && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            className="min-h-[100px]"
                            placeholder="輸入您的貼文描述..."
                        />
                        {form.formState.errors.description && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                            <Input id="name" type="text" {...form.register('name')} />
                            {form.formState.errors.name && (
                                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">電話號碼</label>
                            <Input id="phoneNumber" type="text" {...form.register('phoneNumber')} />
                            {form.formState.errors.phoneNumber && (
                                <p className="text-red-500 text-sm mt-1">{form.formState.errors.phoneNumber.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
                        <Input id="email" type="email" {...form.register('email')} />
                        {form.formState.errors.email && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">圖片</label>
                        <Input
                            id="images"
                            type="file"
                            multiple
                            onChange={handleImageChange}
                            accept="image/*"
                            className="cursor-pointer"
                        />
                        <p className="text-sm text-gray-500 mt-1">目前圖片：{existingImages.length + imageFiles.length}</p>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {existingImages.map((image, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={image.url}
                                        alt={`Existing image ${index}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(index)}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {imageFiles.map((file, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`New image ${index}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(index)}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden items-center space-x-2">
                        <Checkbox id="agreeTerms" {...form.register('agreeTerms')} />
                        <label htmlFor="agreeTerms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            我同意條款和條件。
                        </label>
                    </div>
                    {form.formState.errors.agreeTerms && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.agreeTerms.message}</p>
                    )}

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={submitting}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="min-w-[120px]"
                        >
                            {submitting ? '儲存中...' : '儲存變更'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditPostPage; 