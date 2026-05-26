import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, UserCog } from 'lucide-react';
import { UserDNIModal } from '../../components/Inventory/UserDNIModal';
import inventoryApi from '../../services/inventoryApi';
import toast from 'react-hot-toast';

interface UserWithDNI {
  id: number;
  full_name: string;
  email: string;
  department?: string;
  roles: string[];
  has_dni: boolean;
  personal_data_consent: boolean;
}

const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithDNI[]>([]);
  const [filtered, setFiltered] = useState<UserWithDNI[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dniModal, setDniModal] = useState<{ open: boolean; userId: number; userName: string }>({
    open: false, userId: 0, userName: '',
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryApi.getUsers();
      setUsers(data);
      setFiltered(data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      users.filter(u =>
        u.full_name?.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.department?.toLowerCase().includes(term)
      )
    );
  }, [search, users]);

  const openDNIModal = (user: UserWithDNI) => {
    setDniModal({ open: true, userId: user.id, userName: user.full_name || user.email });
  };

  const withDNI = users.filter(u => u.has_dni).length;
  const withoutDNI = users.length - withDNI;

  return (
    <div>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCog className="h-7 w-7 text-emerald-600" />
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Administración de usuarios y datos personales
            </p>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            <p className="text-sm text-gray-500">Total usuarios</p>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{withDNI}</p>
            <p className="text-sm text-gray-500">Con DNI cargado</p>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{withoutDNI}</p>
            <p className="text-sm text-gray-500">Sin DNI</p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o departamento..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                          {(user.full_name || user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.full_name || '—'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.department && (
                            <p className="text-xs text-gray-400">{user.department}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.has_dni ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <ShieldCheck className="h-4 w-4" />
                          Cargado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500 text-sm">
                          <ShieldAlert className="h-4 w-4" />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openDNIModal(user)}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
                      >
                        {user.has_dni ? 'Actualizar DNI' : 'Cargar DNI'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <UserDNIModal
        isOpen={dniModal.open}
        onClose={() => setDniModal(prev => ({ ...prev, open: false }))}
        userId={dniModal.userId}
        userName={dniModal.userName}
        onSuccess={() => {
          setDniModal(prev => ({ ...prev, open: false }));
          loadUsers(); // Refresca la tabla para mostrar el estado actualizado
          toast.success('DNI cargado. Ya podés generar el documento de asignación.');
        }}
      />
    </div>
  );
};

export default UsersManagementPage;