import Image from 'next/image';
import styles from './directory.module.css';

export default function ToolLogo({ tool }) {
  return (
    <span className={styles.logo} style={{ backgroundColor: tool.tint }} aria-hidden="true">
      <Image src={`/images/digital-tools/${tool.logo}`} alt="" width={36} height={36} unoptimized />
    </span>
  );
}
