import { useState, useEffect } from "react";
import { SPEC_GROUPS, DeleteButton } from "./adminutils";

export default function SpecsTab({ token }) {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newSpec, setNewSpec] = useState({
    feature_name: "",
    group_name: SPEC_GROUPS[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/specs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSpecs(data.specs || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!newSpec.feature_name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/specs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newSpec),
    });
    const data = await res.json();
    setSaving(false);
    if (data.spec) {
      setNewSpec({ feature_name: "", group_name: SPEC_GROUPS[0] });
      setAdding(false);
      load();
    } else setError(data.error || "Failed to add");
  }

  async function handleEdit() {
    if (!editing?.feature_name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/specs/${editing.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        feature_name: editing.feature_name,
        group_name: editing.group_name,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.spec) {
      setEditing(null);
      load();
    } else setError(data.error || "Failed to save");
  }

  async function handleDelete(id) {
    await fetch(`/api/admin/specs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  }

  const filteredSpecs = filterGroup
    ? specs.filter((s) => s.group_name === filterGroup)
    : specs;
  const grouped = {};
  for (const s of filteredSpecs) {
    if (!grouped[s.group_name]) grouped[s.group_name] = [];
    grouped[s.group_name].push(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">{specs.length} features</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Groups</option>
            {SPEC_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button
            onClick={() => setAdding(!adding)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "#1A9988" }}
          >
            {adding ? "Cancel" : "+ Add Feature"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {adding && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
            New Feature
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Feature Name *
              </label>
              <input
                value={newSpec.feature_name}
                onChange={(e) =>
                  setNewSpec({ ...newSpec, feature_name: e.target.value })
                }
                placeholder="e.g. Night Vision"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Group *
              </label>
              <select
                value={newSpec.group_name}
                onChange={(e) =>
                  setNewSpec({ ...newSpec, group_name: e.target.value })
                }
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {SPEC_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="px-6 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "#1A9988", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Adding..." : "Add Feature"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
        </div>
      ) : (
        SPEC_GROUPS.filter((g) => grouped[g]).map((groupName) => (
          <div
            key={groupName}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {groupName}
              </p>
              <p className="text-xs text-gray-400">
                {grouped[groupName]?.length || 0}
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {(grouped[groupName] || []).map((s) => (
                <div key={s.id} className="px-4 py-3">
                  {editing?.id === s.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={editing.feature_name}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              feature_name: e.target.value,
                            })
                          }
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <select
                          value={editing.group_name}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              group_name: e.target.value,
                            })
                          }
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {SPEC_GROUPS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleEdit}
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
                      <span className="text-sm text-gray-800">
                        {s.feature_name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditing({ ...s })}
                          className="px-2 py-1 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-100"
                        >
                          Edit
                        </button>
                        <DeleteButton onConfirm={() => handleDelete(s.id)} />
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




