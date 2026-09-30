import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { EmptyState } from '../components/ui/States';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="page py-12">
      <EmptyState title="Page not found" message="The page you\u2019re looking for doesn\u2019t exist or has moved."
        action={<Link to="/" className="btn-primary">Back to home</Link>} />
    </div>
  );
}
