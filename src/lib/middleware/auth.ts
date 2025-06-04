import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    id: string;
    role: string;
}

export function authMiddleware(handler: Function) {
    return async (request: NextRequest, { params }: { params: { [key: string]: string } }) => {
        const token = request.headers.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ message: 'No token, authorization denied' }, { status: 401 });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

            // Attach user info to the request (for Next.js 13+ API Routes, this is a bit tricky)
            // For now, we'll pass it explicitly to the handler
            (request as any).userId = decoded.id;
            (request as any).userRole = decoded.role;

            return handler(request, { params });

        } catch (error: any) {
            console.error('Auth Middleware Error:', error);
            return NextResponse.json({ message: 'Token is not valid' }, { status: 401 });
        }
    };
} 