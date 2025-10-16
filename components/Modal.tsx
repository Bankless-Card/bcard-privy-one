import styles from './Modal.module.css';
import Image from 'next/image';
import React from 'react';

//import media
import backIcon from '/public/images/icons/back.png';

interface ModalProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    backButtonClickHandler?: React.MouseEventHandler<HTMLAnchorElement>;
    scrollable?: boolean;
}

export default function Modal({ children, className = "", title = "", backButtonClickHandler, scrollable = false }: ModalProps) {

    function BackButton() {
        if (!backButtonClickHandler) {
            return <></>
        }

        return (
            <>
                <a className={styles.BackButton} onClick={backButtonClickHandler}>
                    <Image src={backIcon} alt="Back" />
                </a>
            </>
        );
    }

    function ModalChildren() {
        if (scrollable) {
            return (
                <div className={styles.ModalContentScrollable}>
                    {children}
                </div>
            )
        }

        return (<>{children}</>);
    }

    const classes = [styles.Modal, className].join(" ");

    return (
        <div className={classes} >
            <div className={styles.ModalContainer} >
                <h1 className={styles.ModalTitle}>{title}</h1>
                <BackButton />
                <div className={styles.ModalContent} >
                    <ModalChildren />
                </div>
            </div>
        </div>

    ); //end of return statement

} //end export
