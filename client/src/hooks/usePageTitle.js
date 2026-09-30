import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Al Noor Books` : 'Al Noor Books';
  }, [title]);
}
