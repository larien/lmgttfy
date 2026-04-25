import Link from 'next/link';

interface Props {
  asLink?: boolean;
  className?: string;
}

export function Wordmark({ asLink = true, className }: Props) {
  const inner = (
    <>
      lmgttfy<span className="dot">.</span>com
    </>
  );
  if (!asLink) {
    return <span className={`wordmark ${className ?? ''}`}>{inner}</span>;
  }
  return (
    <Link href="/" className={`wordmark ${className ?? ''}`}>
      {inner}
    </Link>
  );
}
