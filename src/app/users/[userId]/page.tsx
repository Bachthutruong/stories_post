"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  role: 'user' | 'admin';
  isLocked: boolean;
  // role: 'user' | 'admin'; // User cannot change role
  // isLocked: boolean; // User cannot change lock status
}

export default function UserAccountPage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.userId === 'string' ? params.userId : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { data: userData, isLoading, error } = useQuery<User, Error>({
    queryKey: ['userAccount', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is not available for fetching');
      }
      const res = await fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();

        if (res.status === 404) {
          toast({
            title: '錯誤',
            description: '找不到用戶資訊。請重新登入。',
            variant: 'destructive',
          });
          router.push('/auth/login');
        } else {
          throw new Error(errorData.message || 'Failed to fetch user data');
        }

      }
      return res.json();
    },
    enabled: !!userId,
    retry: false,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updatedData: Partial<User>) => {
      if (!userId) throw new Error('User ID is missing for update');
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user data');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userAccount', userId] });
      toast({
        title: '成功',
        description: data.message || '帳戶資訊已更新。',
        variant: 'default',
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: error.message || '更新資訊時發生錯誤。',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setPhoneNumber(userData.phoneNumber);
      setEmail(userData.email);
    }
  }, [userData]);

  const handleSave = () => {
    updateUserMutation.mutate({ name, phoneNumber, email });
  };

  if (!userId) {
    return <div className="container mx-auto p-4 text-center">正在從網址載入用戶 ID...</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">正在載入用戶資訊...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">錯誤：{error.message}</div>;
  }

  if (!userData) {
    return <div className="container mx-auto p-4 text-center">找不到用戶資訊。</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>管理帳戶資訊</CardTitle>
          <CardDescription>查看和更新您的個人資訊。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">電話號碼</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="email">電子郵件</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          {userData && (
            <>
              <p className="text-sm text-gray-500">角色：{userData.role}</p>
              <p className="text-sm text-gray-500">狀態：{userData.isLocked ? '已鎖定' : '正常'}</p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                if (userData) {
                  setName(userData.name);
                  setPhoneNumber(userData.phoneNumber);
                  setEmail(userData.email);
                }
              }} disabled={updateUserMutation.isPending}>取消</Button>
              <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? '儲存中...' : '儲存變更'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>編輯</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 