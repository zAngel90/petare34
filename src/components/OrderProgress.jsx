import { Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import './OrderProgress.css';

const OrderProgress = ({ status }) => {
  const steps = [
    {
      id: 'awaiting_verification',
      label: 'Verificación',
      icon: Clock,
      description: 'Verificando pago'
    },
    {
      id: 'processing',
      label: 'En Proceso',
      icon: Package,
      description: 'Preparando pedido'
    },
    {
      id: 'delivering',
      label: 'En Entrega',
      icon: Truck,
      description: 'Enviando producto'
    },
    {
      id: 'completed',
      label: 'Completado',
      icon: CheckCircle,
      description: 'Pedido entregado'
    }
  ];

  // Si está rechazado o cancelado, mostrar solo ese estado
  if (status === 'rejected' || status === 'cancelled') {
    const Icon = XCircle;
    return (
      <div className="order-progress-container">
        <div className="progress-error-state">
          <div className="progress-error-icon">
            <Icon size={48} />
          </div>
          <div className="progress-error-info">
            <h3>{status === 'rejected' ? 'Pedido Rechazado' : 'Pedido Cancelado'}</h3>
            <p>
              {status === 'rejected' 
                ? 'El pago no pudo ser verificado. Contacta a soporte para más información.'
                : 'Este pedido ha sido cancelado.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determinar el índice del paso actual
  const currentStepIndex = steps.findIndex(step => step.id === status);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="order-progress-container">
      <div className="progress-steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;
          const isPending = index > activeIndex;

          return (
            <div key={step.id} className="progress-step-wrapper">
              {/* Línea conectora */}
              {index < steps.length - 1 && (
                <div className={`progress-line ${isCompleted ? 'completed' : ''}`} />
              )}

              {/* Step */}
              <div className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}>
                <div className="progress-icon">
                  <Icon size={24} />
                </div>
                <div className="progress-info">
                  <h4>{step.label}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderProgress;
