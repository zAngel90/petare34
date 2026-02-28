import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    robloxUsername: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Verificar si hay datos de Discord o Google en la URL (después del callback)
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    
    // Discord callback (usa hash)
    if (hash.includes('access_token')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        handleDiscordCallback(accessToken);
      }
    }
    
    // Google callback (usa query params)
    if (params.get('code') && params.get('state') === 'google_login') {
      const code = params.get('code');
      handleGoogleCallback(code);
    }
  }, []);

  const handleDiscordCallback = async (accessToken) => {
    try {
      setLoading(true);
      
      // Obtener info del usuario de Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const discordUser = await userResponse.json();
      
      if (!discordUser.id) {
        setError('Error obteniendo datos de Discord');
        return;
      }
      
      // Enviar al backend para crear/login usuario
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-auth/discord-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          discordId: discordUser.id,
          email: discordUser.email,
          username: discordUser.username,
          avatar: discordUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('user-token', data.token);
        window.location.href = '/'; // Recargar y ir al home
      } else {
        setError(data.error || 'Error al iniciar sesión con Discord');
      }
    } catch (err) {
      setError('Error al procesar login con Discord');
      console.error(err);
    } finally {
      setLoading(false);
      // Limpiar la URL
      window.history.replaceState({}, document.title, '/login');
    }
  };

  const handleGoogleCallback = async (code) => {
    try {
      setLoading(true);
      
      // Enviar el código al backend para intercambiarlo por user info
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('user-token', data.token);
        window.location.href = '/'; // Recargar y ir al home
      } else {
        setError(data.error || 'Error al iniciar sesión con Google');
      }
    } catch (err) {
      setError('Error al procesar login con Google');
      console.error(err);
    } finally {
      setLoading(false);
      // Limpiar la URL
      window.history.replaceState({}, document.title, '/login');
    }
  };

  const handleDiscordLogin = () => {
    const DISCORD_CLIENT_ID = '1477146018251538563';
    const REDIRECT_URI = 'https://rbxlatamstore.com/login';
    
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify%20email`;
    
    window.location.href = discordAuthUrl;
  };

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = '1001764541241-vk0qafbpa5lcnrbjai805e964jfctpop.apps.googleusercontent.com';
    const REDIRECT_URI = 'https://rbxlatamstore.com/login';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=email%20profile&state=google_login`;
    
    window.location.href = googleAuthUrl;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        if (!formData.email || !formData.password) {
          throw new Error('Por favor completa todos los campos');
        }

        const result = await login(formData.email, formData.password);
        
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error || 'Error al iniciar sesión');
        }
      } else {
        // Register
        if (!formData.email || !formData.password || !formData.username) {
          throw new Error('Por favor completa todos los campos');
        }

        const result = await register(
          formData.email, 
          formData.password, 
          formData.username,
          formData.robloxUsername
        );
        
        if (result.success) {
          // Si requiere verificación, redirigir a página de verificación
          if (result.requiresVerification) {
            navigate('/verify-email', { 
              state: { 
                email: formData.email,
                username: formData.username
              } 
            });
          } else {
            // Si no requiere verificación (por configuración), login directo
            navigate('/');
          }
        } else {
          setError(result.error || 'Error al registrarse');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <img
              src="https://i.postimg.cc/5xqCPXwc/RLS-LOGO.png"
              alt="RLS Logo"
              style={{ width: '100px', height: 'auto' }}
            />
          </div>
          <h1>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h1>
          <p>
            {isLogin
              ? 'Ingresa a tu cuenta para continuar'
              : 'Regístrate para acceder a las mejores ofertas'}
          </p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Iniciar Sesion
          </button>
          <button
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>
                <User size={18} />
                Nombre de Usuario
              </label>
              <input
                type="text"
                name="username"
                placeholder="Tu nombre de usuario"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label>
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={18} />
              Contraseña
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>
                <Gamepad2 size={18} />
                Usuario de Roblox (opcional)
              </label>
              <input
                type="text"
                name="robloxUsername"
                placeholder="Tu nombre en Roblox"
                value={formData.robloxUsername}
                onChange={handleChange}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <span className="loading-spinner-small"></span>
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </button>

          {/* Separador */}
          <div className="login-separator">
            <span>o continúa con</span>
          </div>

          {/* Botones sociales */}
          <div className="social-buttons-container">
            {/* Botón de Discord */}
            <button 
              type="button" 
              className="social-login-btn discord-btn"
              onClick={handleDiscordLogin}
            >
              <svg width="20" height="20" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0)">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
                </g>
                <defs>
                  <clipPath id="clip0">
                    <rect width="71" height="55" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              Continuar con Discord
            </button>

            {/* Botón de Google */}
            <button 
              type="button" 
              className="social-login-btn google-btn"
              onClick={handleGoogleLogin}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
                <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
                <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
                <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
