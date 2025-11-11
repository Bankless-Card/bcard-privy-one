import Link from 'next/link';
import styles from './LandingNavbar.module.css';

export default function LandingNavbar({ hash }: { hash: string }) {
  return (
    <nav className={styles.nav}>
      <div>
        <Link href="/#sidebar" className={`${styles.navItem} ${styles.homeLink} ${hash === 'sidebar' ? styles.active : ''}`}>
          Home
        </Link>
        <Link href="/#home" className={`${styles.navItem} ${hash === 'home' ? styles.active : ''}`}>
          About
        </Link>
        { /* }
        <Link href="#events" className={styles.navItem}>
          Events
        </Link>
        <Link href="#chatter" className={styles.navItem}>
          Chatter
        </Link>
        { */ }
        <Link href="/#test" className={`${styles.navItem} ${hash === 'test' ? styles.active : ''}`}>
          Vote
        </Link>
      </div>
    </nav>
  );
}