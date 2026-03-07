import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage system settings</p>
      </div>

      {/* Store Information */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Store Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Store Name
            </label>
            <input
              type="text"
              defaultValue="TN Automation"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              defaultValue="+1 (615) 555-1234"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="info@tnautomation.com"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Address
            </label>
            <textarea
              defaultValue="123 Security Street, Nashville, TN 37201"
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button>Save Changes</Button>
        </div>
      </Card>

      {/* Shipping Settings */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Shipping Settings
        </h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Free Shipping Threshold
              </label>
              <div className="flex items-center gap-2">
                <span className="text-foreground">$</span>
                <input
                  type="number"
                  defaultValue="100"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Standard Shipping Cost
              </label>
              <div className="flex items-center gap-2">
                <span className="text-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  defaultValue="9.99"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <Button>Save Changes</Button>
        </div>
      </Card>

      {/* Tax Settings */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Tax Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              defaultValue="8"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button>Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}
