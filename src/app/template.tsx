'use client';

import { motion, Transition } from 'framer-motion';
import { usePathname } from 'next/navigation';

const variants = {
  overview: {
    initial: { opacity: 0, scale: 0.96, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit:    { opacity: 0, scale: 1.02, filter: 'blur(4px)' },
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
  },
  default: {
    initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit:    { opacity: 0, y: -8, filter: 'blur(2px)' },
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
};

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const v = pathname === '/overview' ? variants.overview : variants.default;

  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={v.transition as unknown as Transition}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
