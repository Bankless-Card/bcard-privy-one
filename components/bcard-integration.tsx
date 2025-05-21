import React from 'react';
import Link from 'next/link';

export default function BCardIntegration() {
  return (
    <section className="mb-16">
      <div className="bf-container">
        <h2 className="text-3xl font-bold mb-6 text-center">BCard & Black Flag</h2>
        <div className="bf-panel p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-4">Digital Identity for Real-World Meetups</h3>
              <p className="text-lg mb-6">
                BCard provides the digital business card infrastructure that powers Black Flag community connections. Share your crypto wallet, socials, and contact info with a single tap or scan.
              </p>
              <ul className="list-disc pl-5 mb-6 space-y-2">
                <li>Connect your wallet and social profiles</li>
                <li>Create QR-based digital business cards</li>
                <li>Share information at Black Flag meetups</li>
                <li>Build your Web3 reputation and network</li>
              </ul>
              <Link href="/login" className="bf-button inline-block">
                Create Your BCard
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-64 h-64 md:w-80 md:h-80 bg-gray-800 rounded-lg border-2 border-gray-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full flex flex-col">
                  <div className="bg-gray-900 p-4 flex items-center">
                    <span className="bf-flag text-xl mr-2">🏴</span>
                    <span className="text-xl font-bold">BCard</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center p-6">
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                      <span className="text-2xl">🧑</span>
                    </div>
                    <p className="text-xl font-bold mb-1">Your Name</p>
                    <p className="text-gray-400 mb-3">Black Flag Community</p>
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span>🌐</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span>🔗</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span>📧</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-2 text-center">
                    <span className="text-xs text-gray-400">Powered by BCard & Black Flag</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
