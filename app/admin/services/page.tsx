'use client';

import { services } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

export default function AdminServicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding service:', formData);
    setFormData({ name: '', description: '', price: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">Manage your services</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {/* Add Service Form */}
      {showForm && (
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Add New Service
          </h2>
          <form onSubmit={handleAddService} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Service Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter service name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter service description"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Price (optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit">Save Service</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Services Table */}
      <Card className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Service Name
                </th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Description
                </th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">
                  Price
                </th>
                <th className="text-center px-6 py-4 font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 text-foreground font-medium">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm max-w-xs truncate">
                    {service.description}
                  </td>
                  <td className="px-6 py-4 font-semibold text-foreground">
                    {service.price ? `$${service.price}` : 'Custom'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button className="p-2 hover:bg-muted rounded transition-colors text-primary">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded transition-colors text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
