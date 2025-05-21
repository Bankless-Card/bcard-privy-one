import Link from 'next/link';
import { Logo } from './logo';

export default function LandingNavbar() {
  return (
    <nav className="bg-black py-4">
      <div className="bf-container">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="bf-flag text-xl mr-2">🏴</span>
                <Logo fontColor="white" />
              </Link>
            </div>
            <div className="ml-6 hidden md:block">
              <Link
                href="/login"
                className="bf-nav-item"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link
              href="#features"
              className="bf-nav-item"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="bf-nav-item"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="bf-nav-item"
            >
              Contact
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="bf-button py-1 px-2 text-sm">
              Menu
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
