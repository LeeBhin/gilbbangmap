'use client';

import Style from '@/app/styles/login.module.css';
import { supabase } from '@/lib/supabase';
import { Github, Google } from '@/public/svgs';
import { useEffect } from 'react';

function Login(): JSX.Element {

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                saveUserInfo(session.user);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google'
        });
        if (error) console.error('Login Failed:', error.message);
    };

    const handleGitHubLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github'
        });
        if (error) console.error('Login Failed:', error.message);
    };

    // @ts-ignore
    const saveUserInfo = async (user) => {
        const { data, error } = await supabase
            .from('users')
            .upsert([
                { id: user.id, email: user.email, last_login: new Date() }
                // @ts-ignore
            ], { onConflict: ['id'] });

        if (error) console.error('Error saving user info:', error.message);
        else console.log('User info saved:', data);
    };

    return (
        <div className='map'>
            <div className={Style.login}>
                <h1>길빵맵</h1>
                <h1>로그인</h1>
                <div className={Style.wrap}>
                    <button className={Style.btn} onClick={handleGoogleLogin}><Google /></button>
                    <button className={Style.btn} onClick={handleGitHubLogin}><Github /></button>
                </div>
            </div>
        </div>
    );
}

export default Login;
