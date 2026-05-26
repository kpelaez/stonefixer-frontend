import { useState, useEffect, useCallback } from 'react';
import { Package, Users, Wrench, AlertTriangle, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';

import inventoryApi from '../../services/inventoryApi';
import { AssetStatistics, AssignmentStatistics } from '../../types/inventory';

// Tipos locales 
interface WarrantyAsset {
  id: number;
  name: string;
  asset_tag?: string;
  warranty_expiry?: string;
  brand?: string;
  model?: string;
}

interface ReportsData {
  assetStats: AssetStatistics | null;
  assignmentStats: AssignmentStatistics | null;
  warrantyExpiring: WarrantyAsset[];
}

// Helpers 
const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  assigned: 'Asignado',
  in_maintenance: 'En mantenimiento',
  retired: 'Dado de baja',
  lost: 'Perdido',
  damaged: 'Dañado',
};

const CATEGORY_LABELS: Record<string, string> = {
  laptop: 'Laptop',
  desktop: 'Desktop',
  monitor: 'Monitor',
  phone: 'Teléfono',
  tablet: 'Tablet',
  printer: 'Impresora',
  server: 'Servidor',
  networking: 'Red',
  peripheral: 'Periférico',
  other: 'Otro',
};

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500',
  assigned: 'bg-blue-500',
  in_maintenance: 'bg-amber-500',
  retired: 'bg-gray-400',
  lost: 'bg-red-500',
  damaged: 'bg-orange-500',
};

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  returned: 'bg-gray-400',
  transferred: 'bg-blue-500',
  lost: 'bg-red-500',
  damaged: 'bg-orange-500',
};

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Activas',
  returned: 'Devueltas',
  transferred: 'Transferidas',
  lost: 'Perdidas',
  damaged: 'Dañadas',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  const expiry = new Date(dateStr);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

//  Sub-componentes 

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`${color} p-3 rounded-lg text-white flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">
          {count} <span className="text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-emerald-600">{icon}</span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Página principal 
const InventoryReportsPage = () => {
  const [data, setData] = useState<ReportsData>({
    assetStats: null,
    assignmentStats: null,
    warrantyExpiring: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetStats, assignmentStats, warrantyData] = await Promise.all([
        inventoryApi.getAssetStatistics(),
        inventoryApi.getAssignmentStatistics(),
        inventoryApi.getAssetsWarrantyExpiring(60),
      ]);
      setData({
        assetStats,
        assignmentStats,
        warrantyExpiring: warrantyData.assets ?? [],
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { assetStats, assignmentStats, warrantyExpiring } = data;

  const totalAssets = assetStats?.total_assets ?? 0;
  const totalAssignments = assignmentStats?.total_assignments ?? 0;

  return (
    <div>
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Inventario</h1>
            <p className="text-sm text-gray-500 mt-1">
              Resumen del estado actual del inventario tecnológico
              {lastUpdated && (
                <span className="ml-2 text-gray-400">
                  · Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            ❌ {error}
            <button onClick={loadData} className="ml-3 underline hover:no-underline">
              Reintentar
            </button>
          </div>
        )}

        {/* Skeleton o contenido */}
        {loading && !assetStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* KPIs principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Package size={20} />}
                label="Total de activos"
                value={totalAssets}
                sub={`${assetStats?.status_distribution?.available ?? 0} disponibles`}
                color="bg-emerald-600"
              />
              <StatCard
                icon={<Users size={20} />}
                label="Asignaciones activas"
                value={assignmentStats?.active_assignments ?? 0}
                sub={`de ${totalAssignments} en total`}
                color="bg-blue-600"
              />
              <StatCard
                icon={<Wrench size={20} />}
                label="En mantenimiento"
                value={assetStats?.status_distribution?.in_maintenance ?? 0}
                sub="activos fuera de servicio"
                color="bg-amber-500"
              />
              <StatCard
                icon={<AlertTriangle size={20} />}
                label="Garantías por vencer"
                value={warrantyExpiring.length}
                sub="en los próximos 60 días"
                color={warrantyExpiring.length > 0 ? 'bg-red-500' : 'bg-gray-400'}
              />
            </div>

            {/* Valor total */}
            {(assetStats?.total_inventory_value ?? 0) > 0 && (
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-5 text-white flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Valor total del inventario</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(assetStats!.total_inventory_value)}
                  </p>
                </div>
                <TrendingUp size={40} className="text-emerald-300 opacity-60" />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Distribución por estado */}
              <SectionCard title="Activos por estado" icon={<Package size={16} />}>
                <div className="space-y-3">
                  {Object.entries(assetStats?.status_distribution ?? {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <DistributionBar
                        key={status}
                        label={STATUS_LABELS[status] ?? status}
                        count={count}
                        total={totalAssets}
                        colorClass={STATUS_COLORS[status] ?? 'bg-gray-400'}
                      />
                    ))}
                  {Object.keys(assetStats?.status_distribution ?? {}).length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
                  )}
                </div>
              </SectionCard>

              {/* Distribución por categoría */}
              <SectionCard title="Activos por categoría" icon={<Package size={16} />}>
                <div className="space-y-3">
                  {Object.entries(assetStats?.category_distribution ?? {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([category, count]) => (
                      <DistributionBar
                        key={category}
                        label={CATEGORY_LABELS[category] ?? category}
                        count={count}
                        total={totalAssets}
                        colorClass="bg-emerald-500"
                      />
                    ))}
                  {Object.keys(assetStats?.category_distribution ?? {}).length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
                  )}
                </div>
              </SectionCard>

              {/* Distribución de asignaciones */}
              <SectionCard title="Asignaciones por estado" icon={<Users size={16} />}>
                <div className="space-y-3">
                  {Object.entries(assignmentStats?.status_distribution ?? {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <DistributionBar
                        key={status}
                        label={ASSIGNMENT_STATUS_LABELS[status] ?? status}
                        count={count}
                        total={totalAssignments}
                        colorClass={ASSIGNMENT_STATUS_COLORS[status] ?? 'bg-gray-400'}
                      />
                    ))}
                  {Object.keys(assignmentStats?.status_distribution ?? {}).length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
                  )}
                </div>
                {(assignmentStats?.users_with_active_assignments ?? 0) > 0 && (
                  <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                    {assignmentStats!.users_with_active_assignments} usuarios con activos asignados actualmente
                  </p>
                )}
              </SectionCard>

              {/* Garantías por vencer */}
              <SectionCard title="Garantías por vencer (60 días)" icon={<AlertTriangle size={16} />}>
                {warrantyExpiring.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-emerald-600 font-medium text-sm">✅ Sin garantías por vencer</p>
                    <p className="text-gray-400 text-xs mt-1">No hay activos con garantía expirando en los próximos 60 días</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {warrantyExpiring.slice(0, 8).map((asset) => {
                      const days = asset.warranty_expiry ? daysUntil(asset.warranty_expiry) : null;
                      const urgent = days !== null && days <= 15;
                      return (
                        <div
                          key={asset.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            urgent ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-medium ${urgent ? 'text-red-800' : 'text-gray-800'}`}>
                              {asset.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {asset.brand} {asset.model}
                              {asset.asset_tag && ` · ${asset.asset_tag}`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            {days !== null && (
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  urgent
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {days <= 0 ? 'Vencida' : `${days}d`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {warrantyExpiring.length > 8 && (
                      <p className="text-xs text-gray-400 text-center pt-2">
                        y {warrantyExpiring.length - 8} más...
                      </p>
                    )}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Links rápidos */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Accesos rápidos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Ver todos los activos', href: '/inventory/tech-assets', color: 'text-emerald-600' },
                  { label: 'Ver asignaciones', href: '/inventory/assignments', color: 'text-blue-600' },
                  { label: 'Ver mantenimientos', href: '/inventory/maintenance', color: 'text-amber-600' },
                ].map(({ label, href, color }) => (
                  <a
                    key={href}
                    href={href}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group`}
                  >
                    <span className={`text-sm font-medium ${color}`}>{label}</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryReportsPage;