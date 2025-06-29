import React from 'react';
import Link from 'next/link';
import { getRoute } from '../utils/routes';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer>
      © {currentYear} <a href="https://getbcard.io">🏴💳 BCard Foundation</a>
    </footer>
  );
}
