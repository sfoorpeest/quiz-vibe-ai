const FeatureCard = ({ emoji, title, desc, colorClass }) => {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition border ${colorClass || 'border-gray-100'}`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{emoji}</div>
        <div>
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-600 mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
