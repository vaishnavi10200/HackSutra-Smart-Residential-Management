// src/components/common/Alert.jsx
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

function Alert({ type = 'info', message, onClose }) {
  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info
    }
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} ${config.text} border rounded-lg p-4 mb-4 flex items-start`}>
      <Icon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-3 flex-shrink-0">
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default Alert;