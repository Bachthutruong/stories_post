
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

const loginSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự.").max(50, "Tên quá dài."),
  phone: z.string().regex(/^\d{10,11}$/, "Số điện thoại không hợp lệ (10-11 chữ số)."),
});

type LoginFormSchema = z.infer<typeof loginSchema>;

export default function AuthForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormSchema> = async (data) => {
    setIsLoading(true);
    const success = await login(data.name, data.phone);
    setIsLoading(false);

    if (success) {
      toast({
        title: "Đăng nhập thành công!",
        description: `Chào mừng trở lại, ${data.name}!`,
      });
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: "Tên hoặc số điện thoại không đúng, hoặc tài khoản đã bị khóa. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Đăng Nhập</CardTitle>
        <CardDescription>
          Sử dụng tên và số điện thoại của bạn để đăng nhập hoặc tạo tài khoản mới.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="0901234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đăng Nhập / Tạo Tài Khoản'}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Bằng việc đăng nhập, bạn đồng ý với {' '}
          <Link href="/terms" className="underline hover:text-primary">
            Điều khoản dịch vụ
          </Link> của chúng tôi.
        </p>
      </CardContent>
    </Card>
  );
}
