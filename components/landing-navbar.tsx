import Link from 'next/link';
import { Logo } from './logo';

export default function LandingNavbar() {
  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Logo />
            </div>
            <div className="sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/login"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-violet-600 hover:border-violet-300 hover:text-violet-700"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <Link
              href="#features"
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
