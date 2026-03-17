'use client';

import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  isDefault: boolean;
}

interface FormState {
  name: string;
  description: string;
  price: string;
}

const EMPTY_FORM: FormState = { name: '', description: '', price: '' };

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Add-new form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [adding, setAdding] = useState(false);

  /* ---------------------------------------------------------------- */
  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  /* ---------------------------------------------------------------- */
  /*  Create                                                          */
  /* ---------------------------------------------------------------- */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAdding(true);
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          description: addForm.description,
          price: addForm.price !== '' ? Number(addForm.price) : 0,
        }),
      });
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      await fetchServices();
    } finally {
      setAdding(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Edit                                                            */
  /* ---------------------------------------------------------------- */
  const startEdit = (service: Service) => {
    setEditingId(service._id);
    setEditState({
      name: service.name,
      description: service.description,
      price: service.price > 0 ? String(service.price) : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState(EMPTY_FORM);
  };

  const saveEdit = async (id: string) => {
    if (!editState.name.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editState.name,
          description: editState.description,
          price: editState.price !== '' ? Number(editState.price) : 0,
        }),
      });
      setEditingId(null);
      await fetchServices();
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Delete                                                          */
  /* ---------------------------------------------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Delete failed');
        return;
      }
      await fetchServices();
    } catch {
      alert('Delete failed — check your connection and try again.');
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your services</p>
        </div>
        <Button
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddForm(EMPTY_FORM);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {/* ====== Add Form ====== */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Add New Service</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Service Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="e.g. AMC Support"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="Short description of the service"
              />
            </div>
            <div className="max-w-xs">
              <label className="block text-sm font-semibold text-foreground mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={addForm.price}
                onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="e.g. 499"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={adding} className="gap-1.5">
                <Check className="w-4 h-4" />
                {adding ? 'Saving…' : 'Save Service'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}
                className="gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ====== Service Cards ====== */}
      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))
        ) : services.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
            No services yet. Click &ldquo;Add Service&rdquo; to create one.
          </div>
        ) : (
          services.map((service) => {
            const isEditing = editingId === service._id;
            return (
              <div key={service._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 transition-all duration-200 hover:shadow-md">
                <div className="flex items-start gap-4">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-4">
                        {/* Name input */}
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">
                            Service Name <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            value={editState.name}
                            onChange={(e) =>
                              setEditState({ ...editState, name: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                        </div>

                        {/* Description input */}
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={editState.description}
                            onChange={(e) =>
                              setEditState({ ...editState, description: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                        </div>

                        {/* Price input */}
                        <div className="max-w-xs">
                          <label className="block text-sm font-semibold text-foreground mb-1">
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editState.price}
                            onChange={(e) =>
                              setEditState({ ...editState, price: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="e.g. 499"
                          />
                        </div>

                        {/* Save / Cancel */}
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(service._id)}
                            disabled={saving}
                            className="gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            {saving ? 'Saving…' : 'Save Changes'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={saving}
                            className="gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-foreground">
                            {service.name}
                          </h3>
                          {service.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {service.description || <span className="italic">No description</span>}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {service.price > 0
                            ? `Starting from ₹${service.price}`
                            : 'Price not set'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Action buttons — hidden while this card is in edit mode */}
                  {!isEditing && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(service)}
                        className="p-2 hover:bg-muted rounded transition-colors text-primary"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service._id)}
                        className="p-2 hover:bg-muted rounded transition-colors text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
