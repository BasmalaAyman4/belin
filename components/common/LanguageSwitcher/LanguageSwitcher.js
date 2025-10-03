'use client'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import styles from '@/styles/layout/header.module.css'
import { Earth} from 'lucide-react';

export default function LanguageSwitcher({currentLocale}) {
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (newLocale) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')
    router.push(newPath)
  }


  return (
 <>
      {
        currentLocale=='ar'?
 
      <li className={styles.nav__item} onClick={() => switchLanguage('en')}>
        <p> English</p>
      </li>
      :

      
      <li className={styles.nav__item} onClick={() => switchLanguage('ar')}>
        <p> العربية</p>
      </li>
      }
     </>
  )
}
