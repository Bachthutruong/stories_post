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

const formSchema = z.object({
    description: z.string().min(10, { message: 'Mô tả phải có ít nhất 10 ký tự.' }),
    name: z.string().min(2, { message: 'Tên phải có ít nhất 2 ký tự.' }),
    phoneNumber: z.string().regex(/^\d{10}$/, { message: 'Số điện thoại không hợp lệ.' }),
    email: z.string().email({ message: 'Email không hợp lệ.' }).optional().or(z.literal('')),
    agreeTerms: z.boolean().refine(val => val === true, { message: 'Bạn phải đồng ý với các điều khoản và điều kiện.' }),
});

type FormData = z.infer<typeof formSchema>;

const EditPostPage = () => {
    const router = useRouter();
    const params = useParams();
    const { userId, postId } = params;
    const { toast } = useToast();
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
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
                const token = localStorage.getItem('token');
                if (!token) {
                    toast({
                        title: 'Lỗi',
                        description: 'Bạn cần đăng nhập để chỉnh sửa bài đăng.',
                        variant: 'destructive',
                    });
                    router.push('/auth/login'); // Redirect to login if no token
                    return;
                }

                const response = await axios.get(`/api/posts/${postId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const post = response.data;
                if (post.author.userId !== userId) {
                    toast({
                        title: 'Lỗi',
                        description: 'Bạn không có quyền chỉnh sửa bài đăng này.',
                        variant: 'destructive',
                    });
                    router.push('/posts'); // Redirect if not authorized
                    return;
                }

                form.reset({
                    description: post.description,
                    name: post.author.name,
                    phoneNumber: post.author.phoneNumber,
                    email: post.author.email || '',
                    agreeTerms: true, // Assuming user agreed when creating
                });
                setExistingImages(post.images);
            } catch (error) {
                console.error('Lỗi khi tìm nạp bài đăng:', error);
                toast({
                    title: 'Lỗi',
                    description: 'Không thể tải bài đăng.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        if (postId && userId) {
            fetchPost();
        }
    }, [postId, userId, router, form, toast]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImageFiles(Array.from(e.target.files));
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('description', data.description);
            formData.append('name', data.name);
            formData.append('phoneNumber', data.phoneNumber);
            if (data.email) {
                formData.append('email', data.email);
            }
            formData.append('agreeTerms', String(data.agreeTerms));

            existingImages.forEach(image => {
                formData.append('existingImages', image);
            });

            imageFiles.forEach(file => {
                formData.append('images', file);
            });

            const token = localStorage.getItem('token');

            await axios.put(`/api/posts/${postId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            toast({
                title: 'Thành công',
                description: 'Bài đăng của bạn đã được cập nhật thành công.',
            });
            router.push(`/posts/${postId}`);
        } catch (error: any) {
            console.error('Lỗi khi cập nhật bài đăng:', error);
            toast({
                title: 'Lỗi',
                description: error.response?.data?.message || 'Không thể cập nhật bài đăng.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Chỉnh sửa bài đăng</h1>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
                    <Textarea id="description" {...form.register('description')} />
                    {form.formState.errors.description && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên</label>
                    <Input id="name" type="text" {...form.register('name')} />
                    {form.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <Input id="phoneNumber" type="text" {...form.register('phoneNumber')} />
                    {form.formState.errors.phoneNumber && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.phoneNumber.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Không bắt buộc)</label>
                    <Input id="email" type="email" {...form.register('email')} />
                    {form.formState.errors.email && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="images" className="block text-sm font-medium text-gray-700">Hình ảnh</label>
                    <Input id="images" type="file" multiple onChange={handleImageChange} accept="image/*" />
                    <div className="mt-2 flex flex-wrap gap-2">
                        {existingImages.map((image, index) => (
                            <img key={index} src={image} alt={`Existing image ${index}`} className="w-24 h-24 object-cover rounded" />
                        ))}
                        {imageFiles.map((file, index) => (
                            <img key={index} src={URL.createObjectURL(file)} alt={`New image ${index}`} className="w-24 h-24 object-cover rounded" />
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="agreeTerms" {...form.register('agreeTerms')} />
                    <label htmlFor="agreeTerms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Tôi đồng ý với các điều khoản và điều kiện.
                    </label>
                </div>
                {form.formState.errors.agreeTerms && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.agreeTerms.message}</p>
                )}

                <Button type="submit" disabled={loading}>Cập nhật bài đăng</Button>
            </form>
        </div>
    );
};

export default EditPostPage; 