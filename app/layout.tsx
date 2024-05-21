import '@/app/styles/globals.css';
import '@/app/styles/animations.css'
import style from '@/app/styles/layout.module.css';
import { Map, PlusMarker, Trophy, LoudSpeaker, Siren } from '@/public/svgs';
import NavItem from './components/navItem';

interface RootLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { txt: '길빵맵', icon: <Map />, href: '/' },
  { txt: '추가', icon: <PlusMarker />, href: '/pages/add' },
  { txt: '랭킹', icon: <Trophy />, href: '/pages/ranking' },
  { txt: '패치 노트', icon: <LoudSpeaker />, href: '/pages/release' },
  { txt: '오류 제보', icon: <Siren />, href: '/pages/report' },
];

function RootLayout({ children }: RootLayoutProps): JSX.Element {
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
            </ul>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

export default RootLayout;
