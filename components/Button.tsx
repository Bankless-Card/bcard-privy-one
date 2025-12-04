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
  let textClasses = className+" Button"
  if (enabled == false) {
    classes = [styles.Button, styles.DisabledButton, className].join(" ");
    textClasses = className+" Button DisabledButton";
  }
  if (secondary) {
    classes = [styles.Button, styles.SecondaryButton, className].join(" ");
    textClasses = className+" Button SecondaryButton";
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
      <button className={classes+' '+textClasses} href="#" disabled={true} >
        <RenderLoadingSpinner /> {buttonText}
      </button>
    );
  } else if (buttonFunction != null) {
    return (
      <button className={classes+' '+textClasses} onClick={buttonFunction} href="#">
        {buttonText}
      </button>
    );
  } else {
    return (
      <button className={classes+' '+textClasses} href={buttonHref}>
        {buttonText}
      </button>
    );
  }
}
