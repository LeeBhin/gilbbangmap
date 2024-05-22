'use client';

import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const InsertMap = dynamic(() => import('@/app/components/InsertMap'), {
    ssr: false,
});

function Insert(): JSX.Element {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            // 에러가 발생하거나 세션이 없으면 로그인 페이지로 리디렉션
            if (error || !session) {
                router.push('/pages/login');
            }
        };

        checkAuth();
    }, [router]);

    return <InsertMap />;
}

export default Insert;

