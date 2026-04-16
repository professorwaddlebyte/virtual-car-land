function FeaturesSelector({ selected, onChange, featureGroups }) {
  function toggle(feature) {
    if (selected.includes(feature))
      onChange(selected.filter((f) => f !== feature));
    else onChange([...selected, feature]);
  }
  return (
    <div className="space-y-3">
      {featureGroups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.features.map((f) => {
              const active = selected.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggle(f)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all"
                  style={{
                    background: active ? "#f0faf9" : "white",
                    color: active ? "#1A9988" : "#6b7280",
                    borderColor: active ? "#1A9988" : "#e5e7eb",
                  }}
                >
                  {active && <span className="mr-1">✓</span>}
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeaturesSelector;




