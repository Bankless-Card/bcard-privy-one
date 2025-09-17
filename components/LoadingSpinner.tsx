import styles from './LoadingSpinner.module.css';
import Image from 'next/image';
import loadingIcon from '/public/images/icons/loading.gif';

interface LoadingSpinnerProps {
  size?: number;
}

export default function LoadingSpinner({ size = 24 }: LoadingSpinnerProps) {
    return (<Image
                className={styles.loadingIcon}
                src={loadingIcon}
                alt="loading"
                width={size}
                height={size}
                unoptimized={true}
            />);
}
