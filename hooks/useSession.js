"use client";
import { useSession as useNextAuthSession } from 'next-auth/react';
import { logout } from '@/utils/auth.utils';

export function useSession() {
    const { data: session, status } = useNextAuthSession();

    return {
        session,
        status,
        isLoading: status === 'loading',
        isAuthenticated: !!session,
        user: session?.user,
        logout
        };
}