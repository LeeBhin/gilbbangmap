'use client';

import React from 'react';
import Link from 'next/link';
import styles from '@/app/styles/layout.module.css';

interface NavItemProps {
    txt: string;
    icon: JSX.Element;
    href: string;
}

const MouseOverAnimation = (event: React.MouseEvent<HTMLDivElement>): void => {
    const target = event.currentTarget;
    const iconElement = target.querySelector(`.${styles.icon} svg`);
    if (iconElement) {
        iconElement.classList.add('hoverKeyUp');
    }
};

const MouseOutAnimation = (event: React.MouseEvent<HTMLDivElement>): void => {
    const target = event.currentTarget;
    const iconElement = target.querySelector(`.${styles.icon} svg`);
    if (iconElement) {
        iconElement.classList.remove('hoverKeyUp');
        iconElement.classList.add('hoverKeyDown');

        setTimeout(() => {
            iconElement.classList.remove('hoverKeyDown');
        }, 350);
    }
};

const NavItem: React.FC<NavItemProps> = ({ txt, icon, href }) => {
    return (
        <div className={styles.navWrap} onMouseEnter={MouseOverAnimation} onMouseLeave={MouseOutAnimation}>
            <li className={styles.navItemWrap}>
                <Link href={href} className={styles.navLink}>
                    <div className={styles.icon}>{icon}</div>
                    <div className={styles.txt}>{txt}</div>
                </Link>
            </li>
        </div>
    );
};

export default NavItem;
