import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Link, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

type KPICardProps = {
  title: string;
  value: string;
  changeValue?: string;
  changeDirection?: 'up' | 'down' | null;
  progress?: number;
  progressLabel?: string;
  actionLabel?: string;
  actionUrl?: string;
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  changeValue,
  changeDirection,
  progress,
  progressLabel,
  actionUrl
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (actionUrl) {
      try {
        await navigator.clipboard.writeText(actionUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Falha ao copiar:', err);
      }
    }
  };

  return (
    <div className="glass-card rounded-lg p-5 h-full hover:border-primary-green/30 transition-all duration-300">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <div className="flex items-end justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white">{value}</span>
          {changeValue && (
            <div className="flex items-center mt-1.5">
              {changeDirection === 'up' ? (
                <ArrowUp size={15} className="text-primary-green mr-1" />
              ) : changeDirection === 'down' ? (
                <ArrowDown size={15} className="text-red-500 mr-1" />
              ) : null}
              <span className={`text-sm ${changeDirection === 'up' ? 'text-primary-green' : changeDirection === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                {changeValue}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="mt-2">
          <Progress value={progress} className="h-1.5 bg-black/50" />
          {progressLabel && (
            <span className="text-xs text-gray-400 mt-2 block">{progressLabel}</span>
          )}
        </div>
      )}
      
      {actionUrl && (
        <div className="mt-4">
          <Button
            onClick={handleCopyLink}
            variant="ghost"
            size="sm"
            className={`
              gap-2 p-0 h-auto font-medium transition-colors hover:bg-transparent
              ${copied ? 'text-primary-green/80' : 'text-primary-green hover:text-primary-green/80'}
            `}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Link copiado!</span>
              </>
            ) : (
              <>
                <Link size={14} />
                <span>Copiar link</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default KPICard;
