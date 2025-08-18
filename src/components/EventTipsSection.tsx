import React from 'react';

interface EventTipsSectionProps {
  title: string;
  tips: string[];
}

const EventTipsSection: React.FC<EventTipsSectionProps> = ({
  title,
  tips
}) => {
  return (
    <div className="hidden lg:block glass-card rounded-xl p-6">
      <h3 className="text-base font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3 text-sm text-gray-400">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary-green rounded-full mt-2 flex-shrink-0"></div>
            <p>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventTipsSection;
