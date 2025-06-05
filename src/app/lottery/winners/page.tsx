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
                console.log('API response data:', response.data);
                if (Array.isArray(response.data)) {
                    // Flatten the array of completed lotteries into a single array of winner entries
                    const allWinners = response.data.reduce((acc, lottery) => {
                         // Ensure lottery.winners is an array before concatenating
                         if (Array.isArray(lottery.winners)) {
                              // Map the winner entries to match the frontend's expected Winner interface structure
                              const formattedWinners = lottery.winners.map((winnerEntry: { userId: { name: string; phoneNumber: string } | null; postId: string, _id: string }) => ({
                                   // Create a unique composite key using lottery ID and winner entry ID
                                   _id: `${lottery._id}-${winnerEntry._id}`,
                                   name: winnerEntry.userId?.name || 'N/A', // Access populated user name
                                   phoneNumber: winnerEntry.userId?.phoneNumber || 'N/A', // Access populated user phone number
                                   winningNumbers: lottery.winningNumbers || [], // Get winning numbers from the lottery
                                   lotteryDate: lottery.drawDate // Use drawDate from the lottery
                              }));
                              return acc.concat(formattedWinners);
                         }
                         return acc;
                    }, []);
                    setWinners(allWinners);
                } else {
                    console.error('API returned data is not an array:', response.data);
                    setWinners([]); // Ensure winners is always an array
                }
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
            <h1 className="text-2xl font-bold mb-4">Lịch sử người trúng thưởng</h1>
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