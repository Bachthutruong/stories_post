'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Winner {
    _id: string;
    name: string;
    phoneNumber: string;
    winningNumbers: string[];
    lotteryDate: string;
}

const LotteryWinnersPage = () => {
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchWinners = async () => {
            try {
                const response = await axios.get('/api/lottery/winners');
                setWinners(response.data);
            } catch (error) {
                console.error('Error fetching lottery winners:', error);
                toast({
                    title: 'Lỗi',
                    description: 'Không thể tải danh sách người trúng thưởng.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWinners();
    }, [toast]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Lịch sử người trúng thưởng xổ số</h1>
            {winners.length === 0 ? (
                <p>Chưa có người trúng thưởng nào được ghi nhận.</p>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách người trúng thưởng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Số điện thoại</TableHead>
                                    <TableHead>Số trúng thưởng</TableHead>
                                    <TableHead>Ngày bốc thăm</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {winners.map((winner) => (
                                    <TableRow key={winner._id}>
                                        <TableCell>{winner.name}</TableCell>
                                        <TableCell>{winner.phoneNumber}</TableCell>
                                        <TableCell>{winner.winningNumbers.join(', ')}</TableCell>
                                        <TableCell>{new Date(winner.lotteryDate).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default LotteryWinnersPage; 