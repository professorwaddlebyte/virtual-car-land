import { useState, useEffect } from "react";
import { DeleteButton } from "./adminutils";

export default function ColorsTab({ token }) {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/colors", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setColors(data.colors || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/colors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.color) {
      setNewName("");
      setAdding(false);
      load();
    } else setError(data.error || "Failed to add");
  }

  async function handleEdit() {
    if (!editing?.name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/colors/${editing.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: editing.name }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.color) {
      setEditing(null);
      load();
    } else setError(data.error || "Failed to save");
  }

  async function handleDelete(id) {
    await fetch(`/api/admin/colors/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{colors.length} colors</p>
        <button
          onClick={() => setAdding(!adding)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: "#1A9988" }}
        >
          {adding ? "Cancel" : "+ Add Color"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {adding && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
            New Color
          </p>
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Midnight Blue"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-6 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "#1A9988", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "..." : "Add"}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Will be stored as capitalized noun (e.g. &quot;Midnight Blue&quot;)
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 divide-y md:divide-y-0 divide-gray-50">
            {colors.map((c) => (
              <div key={c.id} className="px-4 py-3 border-b border-gray-50">
                {editing?.id === c.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      className="flex-1 border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={handleEdit}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: "#1A9988" }}
                    >
                      {saving ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {c.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing({ ...c })}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-100"
                      >
                        Edit
                      </button>
                      <DeleteButton onConfirm={() => handleDelete(c.id)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



