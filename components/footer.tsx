import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer>
      © {currentYear} <a href="https://getbcard.io">🏴💳 BCard Foundation</a>
    </footer>
  );
}
