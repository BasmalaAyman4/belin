"use client";
import React, { useEffect, useState } from "react";
import styles from "../../styles/layout/header.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "../common/LanguageSwitcher/LanguageSwitcher";
import { useSession } from '@/hooks/useSession';
import { Search, UserRound, Heart, ShoppingCart, Earth } from 'lucide-react';
import Image from "next/image";
import logo from '@/assets/logo.png'
import profimg from '@/assets/prof.jpg'

const Header = ({ dictionary, locale }) => {
    const t = dictionary.header
    const router = useRouter()
    const { session, isAuthenticated, logout } = useSession();

    console.log(session)
    const handleSignOut = () => {
        logout(`/${locale}/`);
    };
    return (
        <>

            <header className={`${styles.header}`}>
                <nav className={styles.nav}>
                    <div className={styles.Typewriter__sec}>
                        fkkf
                    </div>

                    <Link href={`/${locale}`} className={`${styles.logo}`}>
                        <Image
                            alt="logo"
                            src={logo}
                            quality={100}
                            width={200}
                            height={50}
                            priority={true}
                        />
                    </Link>

                    <div className={`${styles.header__icons}`}>
                        <ul className={`${styles.icons__list}`}>
                            <p>jjjg</p>
                            {isAuthenticated ? (
                                <Link href={`/${locale}/profile`}>

                                    <Image alt='' src={profimg} className={styles.profimg} />
                                </Link>
                            ) : (
                                <Link href={`/${locale}/signin`}>
                                    <li className={`${styles.icons__item}`}>
                                        <UserRound />
                                    </li>
                                </Link>
                            )}

                            <p>jrfj</p>
                            <p>jfjrj</p>
                            <LanguageSwitcher currentLocale={locale} />
                        </ul>
                    </div>
                </nav>
            </header>



        </>
    );
};

export default Header;
