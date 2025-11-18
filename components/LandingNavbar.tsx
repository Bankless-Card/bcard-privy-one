import Link from 'next/link';
import styles from './LandingNavbar.module.css';

export default function LandingNavbar({ hash }: { hash: string }) {
  return (
    <nav className={styles.nav}>
      <div>
        <Link href="/#sidebar" className={`${styles.navItem} ${styles.homeLink} ${hash === 'sidebar' ? styles.active : ''}`}>
          Home
        </Link>
        <Link href="/#about" className={`${styles.navItem} ${hash === 'about' ? styles.active : ''}`}>
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
        <Link href="/#vote" className={`${styles.navItem} ${hash === 'vote' ? styles.active : ''}`}>
          Vote
        </Link>
      </div>
    </nav>
  );
}