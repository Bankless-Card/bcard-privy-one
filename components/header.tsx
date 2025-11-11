import React from 'react';
import styles from "./Header.module.css";
import LoginButton from './LoginButton';

export default function Header() {
    return (
        <header className={styles.container}>
          <h1 className={styles.header}>
              <img src="/images/black_flag_noclip.png" alt="Black Flag Logo" className="logo" />
              &nbsp;We are the Black Flag&nbsp;
              <img src="/images/black_flag_noclip.png" alt="Black Flag Logo" className="logo" />
          </h1>
          <div className={styles.button}>
            <LoginButton />
          </div>
        </header>  
      )
}
