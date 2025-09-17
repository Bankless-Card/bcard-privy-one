import styles from './Button.module.css';
import LoadingSpinner from './LoadingSpinner';
import React from 'react';

interface ButtonProps {
  buttonHref?: string;
  buttonText?: string;
  buttonFunction?: React.MouseEventHandler<HTMLAnchorElement> | null;
  className?: string;
  enabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
}

export default function Button({
  buttonHref = "#",
  buttonText = "Go",
  buttonFunction = null,
  className = "",
  enabled = true,
  loading = false,
  secondary = false
}: ButtonProps) {

  let classes = [styles.Button, className].join(" ");
  if (enabled == false) {
    classes = [styles.Button, styles.DisabledButton, className].join(" ");
  }
  if (secondary) {
    classes = [styles.Button, styles.SecondaryButton, className].join(" ");
  }

  function RenderLoadingSpinner() {
    if (loading) {
      return (<LoadingSpinner />);
    } else {
      return (<></>);
    }
  }

  if (enabled == false) {
    return (
      <a className={classes} href="#">
        <RenderLoadingSpinner /> {buttonText}
      </a>
    );
  } else if (buttonFunction != null) {
    return (
      <a className={classes} onClick={buttonFunction} href="#">
        {buttonText}
      </a>
    );
  } else {
    return (
      <a className={classes} href={buttonHref}>
        {buttonText}
      </a>
    );
  }
}
