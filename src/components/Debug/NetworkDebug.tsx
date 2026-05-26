import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface ConnectionTest {
  name: string;
  url: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  responseTime?: number;
}

const NetworkDebug: React.FC = () => {
  const [tests, setTests] = useState<ConnectionTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const getApiUrl  = useAuthStore(state => state.getApiUrl);

  const runConnectionTests = async () => {
    setIsRunning(true);
    const apiUrl = getApiUrl();
    
    const initialTests: ConnectionTest[] = [
      {
        name: 'Backend Health Check',
        url: `${apiUrl}/`,
        status: 'pending',
        message: 'Iniciando...'
      },
      {
        name: 'API Docs',
        url: `${apiUrl}/docs`,
        status: 'pending',
        message: 'Iniciando...'
      },
      {
        name: 'Auth Endpoint',
        url: `${apiUrl}/api/v1/auth/token`,
        status: 'pending',
        message: 'Iniciando...'
      },
      {
        name: 'User Profile',
        url: `${apiUrl}/api/v1/users/me`,
        status: 'pending',
        message: 'Iniciando...'
      }
    ];

    setTests(initialTests);

    // Test 1: Backend Health Check
    try {
      const startTime = Date.now();
      const response = await fetch(`${apiUrl}/`);
      const endTime = Date.now();
      
      setTests(prev => prev.map(test => 
        test.name === 'Backend Health Check' 
          ? {
              ...test,
              status: response.ok ? 'success' : 'error',
              message: response.ok 
                ? `✅ Backend disponible (${response.status})` 
                : `❌ Error ${response.status}`,
              responseTime: endTime - startTime
            }
          : test
      ));
    } catch (error) {
      setTests(prev => prev.map(test => 
        test.name === 'Backend Health Check' 
          ? {
              ...test,
              status: 'error',
              message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          : test
      ));
    }

    // Test 2: API Docs
    try {
      const startTime = Date.now();
      const response = await fetch(`${apiUrl}/docs`);
      const endTime = Date.now();
      
      setTests(prev => prev.map(test => 
        test.name === 'API Docs' 
          ? {
              ...test,
              status: response.ok ? 'success' : 'error',
              message: response.ok 
                ? `✅ Swagger UI disponible (${response.status})` 
                : `❌ Error ${response.status}`,
              responseTime: endTime - startTime
            }
          : test
      ));
    } catch (error) {
      setTests(prev => prev.map(test => 
        test.name === 'API Docs' 
          ? {
              ...test,
              status: 'error',
              message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          : test
      ));
    }

    // Test 3: Auth Endpoint (POST sin credenciales para verificar que responde)
    try {
      const startTime = Date.now();
      const response = await fetch(`${apiUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'username=test&password=test'
      });
      const endTime = Date.now();
      
      setTests(prev => prev.map(test => 
        test.name === 'Auth Endpoint' 
          ? {
              ...test,
              status: response.status === 401 ? 'success' : 'error',
              message: response.status === 401 
                ? `✅ Endpoint de auth responde correctamente (401 esperado)` 
                : `⚠️ Respuesta inesperada: ${response.status}`,
              responseTime: endTime - startTime
            }
          : test
      ));
    } catch (error) {
      setTests(prev => prev.map(test => 
        test.name === 'Auth Endpoint' 
          ? {
              ...test,
              status: 'error',
              message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          : test
      ));
    }

    // Test 4: User Profile (requiere token)
  //   const token = localStorage.getItem('auth_token');
  //   if (token) {
  //     try {
  //       const startTime = Date.now();
  //       const response = await fetch(`${apiUrl}/me`, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       });
  //       const endTime = Date.now();
        
  //       setTests(prev => prev.map(test => 
  //         test.name === 'User Profile' 
  //           ? {
  //               ...test,
  //               status: response.ok ? 'success' : 'error',
  //               message: response.ok 
  //                 ? `✅ Perfil de usuario accesible (${response.status})` 
  //                 : `❌ Error ${response.status} - Token inválido o expirado`,
  //               responseTime: endTime - startTime
  //             }
  //           : test
  //       ));
  //     } catch (error) {
  //       setTests(prev => prev.map(test => 
  //         test.name === 'User Profile' 
  //           ? {
  //               ...test,
  //               status: 'error',
  //               message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`
  //             }
  //           : test
  //       ));
  //     }
  //   } else {
  //     setTests(prev => prev.map(test => 
  //       test.name === 'User Profile' 
  //         ? {
  //             ...test,
  //             status: 'error',
  //             message: '⚠️ No hay token de autenticación'
  //           }
  //         : test
  //     ));
  //   }

    setIsRunning(false);
  };

  useEffect(() => {
    runConnectionTests();
  }, []);

  const getStatusIcon = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if(!import.meta.env.DEV) {
    return null; // No renderizar nada en producción
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔧 Diagnóstico de Red</h2>
        <p className="text-gray-600">Verifica la conectividad entre el frontend y backend</p>
      </div>

      {/* Información de configuración */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">📋 Información de Configuración</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Frontend URL:</strong> {window.location.origin}
          </div>
          <div>
            <strong>Backend URL:</strong> {getApiUrl()}
          </div>
          <div>
            <strong>Hostname:</strong> {window.location.hostname}
          </div>
          <div>
            <strong>Protocolo:</strong> {window.location.protocol}
          </div>
        </div>
      </div>

      {/* Botón de prueba */}
      <div className="mb-6 text-center">
        <button
          onClick={runConnectionTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? '🔄 Ejecutando pruebas...' : '🚀 Ejecutar Pruebas de Conexión'}
        </button>
      </div>

      {/* Resultados de las pruebas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">📊 Resultados de las Pruebas</h3>
        
        {tests.map((test, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(test.status)}</span>
                <span className="font-medium">{test.name}</span>
              </div>
              {test.responseTime && (
                <span className="text-sm text-gray-500">
                  {test.responseTime}ms
                </span>
              )}
            </div>
            
            <div className="ml-10">
              <div className="text-sm text-gray-600 mb-1">
                <strong>URL:</strong> {test.url}
              </div>
              <div className={`text-sm ${getStatusColor(test.status)}`}>
                {test.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recomendaciones */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">💡 Recomendaciones</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• Si el "Backend Health Check" falla, verifica que el backend esté corriendo en puerto 8000</li>
          <li>• Si solo falla desde el celular, verifica que ambos dispositivos estén en la misma red WiFi</li>
          <li>• Si el "Auth Endpoint" falla, revisa los logs del backend para errores CORS</li>
          <li>• Si "User Profile" falla, prueba hacer login nuevamente</li>
        </ul>
      </div>

      {/* Información adicional para debug */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🔍 Debug Info</h3>
        <div className="text-xs font-mono bg-white p-3 rounded border overflow-x-auto">
          <div><strong>User Agent:</strong> {navigator.userAgent}</div>
          <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
          <div><strong>Auth Cookie:</strong> {document.cookie.includes('access_token') ? 'Present (httpOnly)' : 'Missing'}</div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDebug;