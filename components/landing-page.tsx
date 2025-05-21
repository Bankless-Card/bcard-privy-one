import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
// import Image from 'next/image';
import LandingNavbar from './landing-navbar';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Welcome to BCard · Privy</title>
      </Head>

      <div className="bf-theme min-h-screen flex flex-col">
        <LandingNavbar />
        
        <header className="bf-header">
          <div className="bf-container">
            <div className="flex justify-center">
              <div className="w-16 h-16 flex items-center justify-center">
                <span className="bf-flag text-4xl">🏴</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-grow">
          <div className="bf-container">
            <div className="pt-10 pb-20">
              <div className="bf-text-center">
                <h1 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-tight mb-8">
                  Your Digital Business Card Platform
                </h1>
                <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
                  Create, manage, and share your digital business cards with ease.
                  <br />Powered by Privy for secure authentication.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link
                    href="/login"
                    className="bf-button"
                  >
                    Get started
                  </Link>
                  <Link
                    href="#features"
                    className="bf-button"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
              
              <div className="bf-section">
                <h2 className="text-center">How It Works</h2>
                <div className="bf-grid mt-10">
                  <div className="bf-panel">
                    <h3>Create Your Card</h3>
                    <p>Design your digital business card with our intuitive editor. Add your contact information, social links, and customize the appearance.</p>
                  </div>
                  <div className="bf-panel">
                    <h3>Share Instantly</h3>
                    <p>Share your card with anyone through a simple QR code or link. No more running out of physical cards.</p>
                  </div>
                  <div className="bf-panel">
                    <h3>Track Engagement</h3>
                    <p>See when your card is viewed and which links are clicked. Get insights on how your network is growing.</p>
                  </div>
                </div>
              </div>
              
              <div className="bf-section" id="features">
                <h2 className="text-center">Features</h2>
                <ul className="mt-8 max-w-2xl mx-auto">
                  <li className="mb-4">Secure authentication with Privy</li>
                  <li className="mb-4">Customizable digital business cards</li>
                  <li className="mb-4">QR code generation for easy sharing</li>
                  <li className="mb-4">Analytics and engagement tracking</li>
                  <li className="mb-4">Social media integration</li>
                  <li className="mb-4">Web3 wallet connections</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="bf-footer">
          <div className="bf-container">
            <p>&copy; 2025 <span className="bf-flag">🏴</span> BCard Foundation</p>
            <div className="mt-4">
              <Link href="/login" className="mx-2">Login</Link>
              <Link href="#features" className="mx-2">Features</Link>
              <Link href="#" className="mx-2">About</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
