import Link from 'next/link';
import { Logo } from './logo';
import { getRoute } from '../utils/routes';
import { useState } from 'react';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };



  return (
    <nav className="py-2 main-nav">
        <div className="flex justify-between items-center">
          <div className="md:flex md:items-center">
            <Link
              href={getRoute("/login")}
              className="bf-nav-item"
            >
              Login
            </Link>
            <Link
              href="#mission"
              className="bf-nav-item"
            >
              Mission
            </Link>
            <Link
              href="#participate"
              className="bf-nav-item"
            >
              Participate
            </Link>
            <Link
              href="#sponsors"
              className="bf-nav-item"
            >
              Sponsors
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              className="bf-button py-1 px-2 text-sm"
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
          <div className="md:hidden mt-4 py-2 border-t border-gray-700">
            <div className="flex flex-col space-y-3 items-center">
              <Link
                href={getRoute("/login")}
                className="bf-nav-item py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="#mission"
                className="bf-nav-item py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mission
              </Link>
              <Link
                href="#participate"
                className="bf-nav-item py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Participate
              </Link>
              <Link
                href="#sponsors"
                className="bf-nav-item py-2"
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