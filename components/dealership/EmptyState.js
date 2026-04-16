function EmptyState({ icon, text }) {
  return (
    <div className="text-center py-10">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

export default EmptyState;



