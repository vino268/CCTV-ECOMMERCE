import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="text-center px-4 py-12 max-w-2xl mx-auto">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          The page you're looking for doesn't exist. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/products">
            <Button size="lg" variant="outline">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
