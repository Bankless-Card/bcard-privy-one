import Link from 'next/link';
import styles from './LandingNavbar.module.css';

export default function LandingNavbar() {
  return (
    <nav className={styles.nav}>
      <div>
        <Link href="/#sidebar" className={`${styles.navItem} ${styles.homeLink}`}>
          Home
        </Link>
        <Link href="/#home" className={styles.navItem}>
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
        <Link href="/#test" className={styles.navItem}>
          Vote
        </Link>
      </div>
    </nav>
  );
}