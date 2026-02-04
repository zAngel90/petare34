import { CheckCircle, XCircle, Info } from 'lucide-react';
import './NotificationModal.css';

const NotificationModal = ({ isOpen, onClose, type = 'success', title, message }) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle size={48} />,
    error: <XCircle size={48} />,
    info: <Info size={48} />
  };

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className={`notification-modal-box ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="notification-icon">
          {icons[type]}
        </div>
        <h2 className="notification-title">{title}</h2>
        <p className="notification-message">{message}</p>
        <button className="notification-btn" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;
