import Link from 'next/link';
import { Logo } from './logo';
import { getRoute } from '../utils/routes';

export default function LandingNavbar() {
  return (
    <nav className="bg-black py-4">
      <div className="bf-container">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center">
              <Link href={getRoute("/")} className="flex items-center">
                <span className="bf-flag text-xl mr-2">🏴</span>
                <Logo fontColor="white" />
              </Link>
            </div>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-6">
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
            <button className="bf-button py-1 px-2 text-sm">
              Menu
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
