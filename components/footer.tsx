import React from 'react';
import Link from 'next/link';
import { getRoute } from '../utils/routes';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bf-footer">
      <div className="bf-container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="flex items-center">
              <span className="bf-flag mr-2">🏴</span>
              <span>&copy; {currentYear} BCard Foundation</span>
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href={getRoute("/")} className="hover:text-gray-300 transition-colors">
              Home
            </Link>
            <Link href={getRoute("/login")} className="hover:text-gray-300 transition-colors">
              Login
            </Link>
            <Link href="#mission" className="hover:text-gray-300 transition-colors">
              Mission
            </Link>
            <Link href="#sponsors" className="hover:text-gray-300 transition-colors">
              Sponsors
            </Link>
            <a 
              href="https://warpcast.com/~/channel/blackflag" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              Farcaster
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>
            This is a demo integration of BCard with Black Flag. 
            <a 
              href="https://blackflagcollective.org/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ml-1 text-gray-400 hover:text-white underline"
            >
              Visit the official Black Flag site
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
