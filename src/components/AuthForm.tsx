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
import { useState, useEffect } from 'react';
import Link from 'next/link';

const loginSchema = z.object({
  name: z.string().min(2, "姓名必須至少有2個字符。").max(50, "姓名太長。"),
  phone: z.string().regex(/^\d{10,11}$/, "電話號碼無效（10-11位數字）。"),
});

type LoginFormSchema = z.infer<typeof loginSchema>;

export default function AuthForm() {
  const { login, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const form = useForm<LoginFormSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormSchema> = async (data) => {
    setIsLoading(true);
    setRedirectPath(null);
    const loggedInUser = await login(data.name, data.phone);
    console.log(loggedInUser, "loggedInUser after login");
    setIsLoading(false);

    if (loggedInUser) {
      toast({
        title: "登入成功！",
        description: `歡迎回來，${data.name}！`,
      });
      
      if (loggedInUser?.user.role === 'admin') {
        setRedirectPath('/admin/dashboard');
      } else {
        setRedirectPath(`/users/${loggedInUser?.user.id}`);
      }

    } else {
      toast({
        title: "登入失敗",
        description: "姓名或電話號碼錯誤，或帳戶已被鎖定。請重試。",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (redirectPath) {
      router.replace(redirectPath);
    }
  }, [redirectPath, router]);

  if (redirectPath && !isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">正在轉向...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center">登入成功。請稍候...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">登入</CardTitle>
        <CardDescription>
          使用您的姓名和電話號碼登入或建立新帳戶。
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
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="李小明" {...field} />
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
                  <FormLabel>電話號碼</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="0912345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '處理中...' : '登入 / 建立帳戶'}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          登入即表示您同意我們的{' '}
          <Link href="/terms" className="underline hover:text-primary">
            服務條款
          </Link>。
        </p>
      </CardContent>
    </Card>
  );
}
