// src/components/Dashboard/MobileDashboardViewer.tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Maximize2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileDashboardViewerProps {
  id: string;
  url: string;
  title: string;
  description?: string;
  fullScreen?: boolean;
}

const MobileDashboardViewer = ({ 
  id, 
  url, 
  title, 
  description = '', 
  fullScreen = false 
}: MobileDashboardViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const navigate = useNavigate();

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('No se pudo cargar el dashboard. Verifique que el servicio esté disponible');
  };

  const handleBack = () => {
    if (fullScreen) {
      navigate('/dashboards');
    } else {
      navigate(-1);
    }
  };

  const toggleFullScreen = () => {
    if (!fullScreen) {
      navigate(`/dashboards/${id}`);
    } else {
      setIsFullScreen(!isFullScreen);
    }
  };

  const openExternal = () => {
    window.open(url, '_blank');
  };

  const reload = () => {
    setIsLoading(true);
    setError(null);
    // Forzar recarga del iframe
    const iframe = document.querySelector(`iframe[data-dashboard-id="${id}"]`) as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const containerHeight = fullScreen 
    ? `calc(100vh - ${orientation === 'landscape' ? '60px' : '80px'})` 
    : '400px';

  return (
    <div className={`bg-white ${fullScreen ? 'min-h-screen' : 'rounded-xl shadow-sm border border-gray-200'} overflow-hidden`}>
      {/* Header */}
      <div className={`border-b border-gray-200 ${fullScreen ? 'sticky top-0 z-10 bg-white' : ''}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {fullScreen && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            
            <div className="min-w-0 flex-1">
              <h2 className={`font-semibold text-gray-900 truncate ${fullScreen ? 'text-lg' : 'text-base'}`}>
                {title}
              </h2>
              {description && !fullScreen && (
                <p className="text-sm text-gray-600 truncate">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={reload}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-600"
              title="Recargar"
            >
              <RotateCcw size={18} />
            </button>
            
            {!fullScreen && (
              <button
                onClick={toggleFullScreen}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-600"
                title="Pantalla completa"
              >
                <Maximize2 size={18} />
              </button>
            )}
            
            <button
              onClick={openExternal}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-600"
              title="Abrir en nueva ventana"
            >
              <ExternalLink size={18} />
            </button>
          </div>
        </div>

        {description && fullScreen && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        )}
      </div>

      {/* Contenido del dashboard */}
      <div className="relative" style={{ height: containerHeight }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando dashboard...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800"
                onClick={reload}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        <iframe 
          data-dashboard-id={id}
          src={url}
          title={title}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full"
          // Optimizaciones para móvil
          allow="fullscreen"
          scrolling="auto"
        />
      </div>

      {/* Sugerencia de rotación para landscape */}
      {fullScreen && orientation === 'portrait' && (
        <div className="bg-amber-50 border-t border-amber-200 p-3">
          <div className="flex items-center justify-center text-center">
            <div className="text-amber-700 text-sm">
              💡 <strong>Tip:</strong> Rota tu dispositivo para una mejor experiencia de visualización
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDashboardViewer;