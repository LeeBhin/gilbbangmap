'use client';

import '@/app/styles/globals.css';
import '@/app/styles/animations.css';
import style from '@/app/styles/layout.module.css';
import { Map, PlusMarker, Trophy, LoudSpeaker, Siren, User, LogOut, Login } from '@/public/svgs';
import NavItem from './components/navItem';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface RootLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { txt: '길빵맵', icon: <Map />, href: '/' },
  { txt: '추가', icon: <PlusMarker />, href: '/pages/insert' },
  { txt: '랭킹', icon: <Trophy />, href: '/pages/ranking' },
  { txt: '패치 노트', icon: <LoudSpeaker />, href: '/pages/release' },
  { txt: '오류 제보', icon: <Siren />, href: '/pages/report' }
];

function RootLayout({ children }: RootLayoutProps): JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
  };

  return (
    <html lang="ko">
      <head>
        <title>길빵맵</title>
      </head>
      <body>
        <header className={style.header}>
          <div className={style.logo}>
            <div className={style.logoIcon}>길빵맵</div>
          </div>

          <nav className={style.nav}>
            <ul className={style.navList}>
              {navItems.map((item) => (
                <NavItem key={item.txt} txt={item.txt} icon={item.icon} href={item.href} />
              ))}
              {isLoggedIn ? (
                <li className={style.navItem} onClick={handleLogout}>
                  <a className={style.navLink}>
                    <LogOut />
                    <span>로그아웃</span>
                  </a>
                </li>
              ) : (
                <NavItem txt="로그인" icon={<Login />} href="/pages/login" />
              )}
            </ul>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

export default RootLayout;
