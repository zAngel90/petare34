import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const email = location.state?.email || '';
  const username = location.state?.username || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newCode = pastedData.split('');
    while (newCode.length < 6) {
      newCode.push('');
    }
    setCode(newCode);
    
    // Focus al último dígito
    const lastFilledIndex = pastedData.length - 1;
    if (lastFilledIndex < 5) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Por favor ingresa el código completo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (data.success) {
        // Guardar token y usuario
        localStorage.setItem('user-token', data.data.token);
        
        // Login automático
        await login(email, ''); // El token ya está guardado
        
        // Redirigir a home
        navigate('/', { replace: true });
      } else {
        setError(data.error || 'Código incorrecto');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setError(data.error || 'Error al reenviar código');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        <button className="btn-back-verify" onClick={() => navigate('/login')}>
          <ArrowLeft size={20} />
          Volver
        </button>

        <div className="verify-header">
          <div className="verify-icon">
            <Mail size={48} />
          </div>
          <h1>Verifica tu email</h1>
          <p>
            Hemos enviado un código de verificación a<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="verify-form">
          <div className="code-inputs" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="code-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}
          {resendSuccess && <div className="success-message">✅ Código reenviado</div>}

          <button type="submit" className="btn-verify" disabled={loading || code.join('').length !== 6}>
            {loading ? (
              <span className="loading-spinner-small"></span>
            ) : (
              'Verificar'
            )}
          </button>

          <div className="resend-section">
            <p>¿No recibiste el código?</p>
            <button
              type="button"
              className="btn-resend"
              onClick={handleResendCode}
              disabled={resending}
            >
              {resending ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Reenviar código
                </>
              )}
            </button>
          </div>

          <div className="verify-help">
            <p>El código expira en 15 minutos</p>
            <p>Revisa tu carpeta de spam si no lo encuentras</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
