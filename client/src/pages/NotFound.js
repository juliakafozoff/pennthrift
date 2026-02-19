import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[var(--color-text)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-4">Page Not Found</h2>
        <p className="text-[var(--color-muted)] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary">Go Home</Button>
          </Link>
          <Link to="/store">
            <Button variant="secondary">Browse Store</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

