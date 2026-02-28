import './DeliveryMethodBadge.css';

const DeliveryMethodBadge = ({ method, size = 'medium' }) => {
  if (!method) return null;

  const getBadgeConfig = (deliveryMethod) => {
    const methodLower = deliveryMethod.toLowerCase();
    
    if (methodLower === 'gamepass' || methodLower.includes('gamepass')) {
      return {
        icon: '🎫',
        label: 'Gamepass',
        color: '#8b5cf6', // Púrpura
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
      };
    }
    
    if (methodLower === 'grupo' || methodLower.includes('grupo') || methodLower.includes('group')) {
      return {
        icon: '👥',
        label: 'Grupo',
        color: '#3b82f6', // Azul
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
      };
    }
    
    if (methodLower === 'directo' || methodLower.includes('direct')) {
      return {
        icon: '⚡',
        label: 'Directo',
        color: '#fbbf24', // Amarillo/Dorado
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
      };
    }
    
    // Por defecto (robux genérico)
    return {
      icon: '💎',
      label: 'Robux',
      color: '#10b981', // Verde
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    };
  };

  const config = getBadgeConfig(method);

  return (
    <span 
      className={`delivery-badge delivery-badge-${size}`}
      style={{ background: config.gradient }}
      title={`Método de entrega: ${config.label}`}
    >
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-label">{config.label}</span>
    </span>
  );
};

export default DeliveryMethodBadge;
