import { useState, useEffect } from "react";
import { NATIONALITIES, DeleteButton } from "./adminutils";

export default function MakesTab({ token }) {
  const [makes, setMakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newMake, setNewMake] = useState({
    name: "",
    nationality: "Japanese",
    is_luxury: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/makes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMakes(data.makes || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!newMake.name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/makes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newMake),
    });
    const data = await res.json();
    setSaving(false);
    if (data.make) {
      setNewMake({ name: "", nationality: "Japanese", is_luxury: false });
      setAdding(false);
      load();
    } else setError(data.error || "Failed to add");
  }

  async function handleEdit(make) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/makes/${make.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: make.name,
        nationality: make.nationality,
        is_luxury: make.is_luxury,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.make) {
      setEditing(null);
      load();
    } else setError(data.error || "Failed to save");
  }

  async function handleDelete(id) {
    await fetch(`/api/admin/makes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  }

  const grouped = {};
  for (const m of makes) {
    if (!grouped[m.nationality]) grouped[m.nationality] = [];
    grouped[m.nationality].push(m);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{makes.length} makes</p>
        <button
          onClick={() => setAdding(!adding)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: "#1A9988" }}
        >
          {adding ? "Cancel" : "+ Add Make"}
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
            New Make
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Brand Name *
              </label>
              <input
                value={newMake.name}
                onChange={(e) =>
                  setNewMake({ ...newMake, name: e.target.value })
                }
                placeholder="e.g. Polestar"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Nationality *
              </label>
              <select
                value={newMake.nationality}
                onChange={(e) =>
                  setNewMake({ ...newMake, nationality: e.target.value })
                }
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_luxury_new"
              checked={newMake.is_luxury}
              onChange={(e) =>
                setNewMake({ ...newMake, is_luxury: e.target.checked })
              }
              className="w-4 h-4 accent-teal-600"
            />
            <label
              htmlFor="is_luxury_new"
              className="text-sm font-semibold text-gray-700"
            >
              Luxury brand
            </label>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="px-6 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "#1A9988", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Adding..." : "Add Make"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([nationality, nMakes]) => (
            <div
              key={nationality}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {nationality}
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {nMakes.map((m) => (
                  <div key={m.id} className="px-4 py-3">
                    {editing?.id === m.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={editing.name}
                            onChange={(e) =>
                              setEditing({ ...editing, name: e.target.value })
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <select
                            value={editing.nationality}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                nationality: e.target.value,
                              })
                            }
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            {NATIONALITIES.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`luxury_${m.id}`}
                            checked={editing.is_luxury}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                is_luxury: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-teal-600"
                          />
                          <label
                            htmlFor={`luxury_${m.id}`}
                            className="text-sm text-gray-700"
                          >
                            Luxury brand
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(editing)}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
                            style={{ background: "#1A9988" }}
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {m.name}
                          </span>
                          {m.is_luxury && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100">
                              Luxury
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditing({ ...m })}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-100"
                          >
                            Edit
                          </button>
                          <DeleteButton onConfirm={() => handleDelete(m.id)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}



