import { Card } from '@/components/ui/card';

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground">Manage customer information</p>
      </div>

      {/* Empty State */}
      <Card className="p-12 border border-border text-center">
        <p className="text-lg text-muted-foreground mb-4">👥</p>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Customers Yet
        </h2>
        <p className="text-muted-foreground">
          Customer information will appear here after their first purchase
        </p>
      </Card>
    </div>
  );
}
