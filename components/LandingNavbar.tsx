import Link from 'next/link';
import { getRoute } from '../utils/routes';
import { useState } from 'react';
import styles from './LandingNavbar.module.css';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };



  return (
    <nav className={styles.nav}>
        <div>
          <div>
            <Link
              href={getRoute("/")}
              className={styles.navItem}
            >
              About
            </Link>
            <Link
              href="#test"
              className={styles.navItem}
            >
              Vote
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className={styles.navMobile}>
            <button 
              className="bf-button"
              onClick={toggleMenu}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={styles.navMobile} >
            <div>
              <Link
                href={getRoute("/login")}
                className={styles.navItem}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="#mission"
                className={styles.navItem}
                onClick={() => setMobileMenuOpen(false)}
              >
                Mission
              </Link>
              <Link
                href="#participate"
                className={styles.navItem}
                onClick={() => setMobileMenuOpen(false)}
              >
                Participate
              </Link>
              <Link
                href="#sponsors"
                className={styles.navItem}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sponsors
              </Link>
            </div>
          </div>
        )}
    </nav>
  );
}