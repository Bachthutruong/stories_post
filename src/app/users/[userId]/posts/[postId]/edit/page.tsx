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
    title: z.string().min(5, { message: 'Tiêu đề phải có ít nhất 5 ký tự.' }).max(100, { message: 'Tiêu đề không được vượt quá 100 ký tự.' }),
    description: z.string().min(10, { message: 'Mô tả phải có ít nhất 10 ký tự.' }),
    name: z.string().min(2, { message: 'Tên phải có ít nhất 2 ký tự.' }),
    phoneNumber: z.string().regex(/^\d{10}$/, { message: 'Số điện thoại không hợp lệ.' }),
    email: z.string().email({ message: 'Email không hợp lệ.' }).optional().or(z.literal('')),
    agreeTerms: z.boolean().refine(val => val === true, { message: 'Bạn phải đồng ý với các điều khoản và điều kiện.' }),
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
                        title: 'Lỗi',
                        description: 'Bạn cần đăng nhập để chỉnh sửa bài đăng.',
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

                // Kiểm tra quyền chỉnh sửa
                if (!post || !post.userId || post.userId._id !== userId) {
                    toast({
                        title: 'Lỗi',
                        description: 'Bạn không có quyền chỉnh sửa bài đăng này.',
                        variant: 'destructive',
                    });
                    router.push('/posts');
                    return;
                }

                // Cập nhật form với dữ liệu bài đăng
                form.reset({
                    title: post.title || '',
                    description: post.description || '',
                    name: post.userId?.name || user?.user.name || '',
                    phoneNumber: post.userId?.phoneNumber || user?.user.phoneNumber || '',
                    email: post.userId?.email || user?.user.email || '',
                    agreeTerms: true,
                });

                // Cập nhật hình ảnh
                if (post.images && Array.isArray(post.images)) {
                    setExistingImages(post.images);
                }

                setLoading(false);
            } catch (error: any) {
                console.error('Lỗi khi tìm nạp bài đăng:', error);
                const errorMessage = error.response?.data?.message || 'Không thể tải bài đăng.';
                toast({
                    title: 'Lỗi',
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
                    title: 'Lỗi',
                    description: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.',
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
                title: 'Thành công',
                description: 'Bài đăng của bạn đã được cập nhật thành công.',
            });
            router.push(`/users/${userId}/posts`);
        } catch (error: any) {
            console.error('Lỗi khi cập nhật bài đăng:', error);
            const errorMessage = error.response?.data?.message || 'Không thể cập nhật bài đăng.';
            toast({
                title: 'Lỗi',
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
                    <p className="mt-4 text-lg">Đang tải bài đăng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Card className="p-6">
                <h1 className="text-2xl font-bold mb-6">Chỉnh sửa bài đăng</h1>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                        <Input
                            id="title"
                            {...form.register('title')}
                            placeholder="Nhập tiêu đề bài đăng..."
                        />
                        {form.formState.errors.title && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            className="min-h-[100px]"
                            placeholder="Nhập mô tả bài đăng của bạn..."
                        />
                        {form.formState.errors.description && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                            <Input id="name" type="text" {...form.register('name')} />
                            {form.formState.errors.name && (
                                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                            <Input id="phoneNumber" type="text" {...form.register('phoneNumber')} />
                            {form.formState.errors.phoneNumber && (
                                <p className="text-red-500 text-sm mt-1">{form.formState.errors.phoneNumber.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <Input id="email" type="email" {...form.register('email')} />
                        {form.formState.errors.email && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                        <Input
                            id="images"
                            type="file"
                            multiple
                            onChange={handleImageChange}
                            accept="image/*"
                            className="cursor-pointer"
                        />
                        <p className="text-sm text-gray-500 mt-1">Hình ảnh hiện tại: {existingImages.length + imageFiles.length}</p>
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
                            Tôi đồng ý với các điều khoản và điều kiện.
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
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="min-w-[120px]"
                        >
                            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditPostPage; 