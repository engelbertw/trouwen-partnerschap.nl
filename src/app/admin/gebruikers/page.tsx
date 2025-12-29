'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface User {
  id: string;
  emailAddresses: string[];
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
  lastSignInAt: number | null;
  gemeenteOin?: string;
  gemeenteNaam?: string;
  rol?: string;
}

interface Gemeente {
  oin: string;
  naam: string;
}

export default function AdminGebruikersPage(): JSX.Element {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [gemeenten, setGemeenten] = useState<Gemeente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    gemeenteOin: '',
    gemeenteNaam: '',
    rol: 'loket_medewerker',
  });
  const [createFormData, setCreateFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    gemeenteOin: '',
    gemeenteNaam: '',
    rol: 'loket_medewerker',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchGemeenten();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users');
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.error || 'Fout bij ophalen gebruikers');
        if (result.error?.includes('systeembeheerder')) {
          // Redirect if not admin
          setTimeout(() => router.push('/'), 2000);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Er ging iets mis bij het ophalen van gebruikers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGemeenten = async () => {
    try {
      // Fetch gemeenten from database (you'll need to create this API route)
      const response = await fetch('/api/gemeente/list');
      const result = await response.json();
      if (result.success) {
        setGemeenten(result.data);
      }
    } catch (err) {
      console.error('Error fetching gemeenten:', err);
      // Continue without gemeenten list
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      gemeenteOin: user.gemeenteOin || '',
      gemeenteNaam: user.gemeenteNaam || '',
      rol: (user.rol as string) || 'loket_medewerker',
    });
    setShowEditForm(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    if (!formData.gemeenteOin || !/^\d{20}$/.test(formData.gemeenteOin)) {
      alert('OIN moet exact 20 cijfers zijn');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setShowEditForm(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        alert(result.error || 'Fout bij bijwerken gebruiker');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Er ging iets mis bij het bijwerken');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!createFormData.email || !createFormData.firstName || !createFormData.lastName) {
      alert('Email, voornaam en achternaam zijn verplicht');
      return;
    }

    if (!createFormData.email.includes('@')) {
      alert('Ongeldig email adres');
      return;
    }

    if (!createFormData.gemeenteOin || !/^\d{20}$/.test(createFormData.gemeenteOin)) {
      alert('OIN moet exact 20 cijfers zijn');
      return;
    }

    if (!createFormData.gemeenteNaam) {
      alert('Gemeente naam is verplicht');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        setCreateFormData({
          email: '',
          firstName: '',
          lastName: '',
          gemeenteOin: '',
          gemeenteNaam: '',
          rol: 'loket_medewerker',
        });
        await fetchUsers();
        alert(result.message || 'Gebruiker succesvol aangemaakt!');
      } else {
        alert(result.error || 'Fout bij aanmaken gebruiker');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Er ging iets mis bij het aanmaken');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Email', 'Voornaam', 'Achternaam', 'Gemeente', 'Rol', 'Aangemaakt', 'Laatste Login'];
    const rows = users.map(user => [
      user.emailAddresses[0] || '',
      user.firstName || '',
      user.lastName || '',
      user.gemeenteNaam || '',
      user.rol || '',
      formatDate(user.createdAt),
      formatDate(user.lastSignInAt),
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `gebruikers-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <GemeenteLogoCompact />
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded p-2"
          >
            Terug naar overzicht
          </Link>
        </div>
      </header>

      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <h1 className="font-sans text-lg font-normal">Admin - Gebruikersbeheer</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users list */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-gray-900">Gebruikers</h2>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 font-sans text-sm font-semibold"
                title="Exporteer gebruikerslijst naar CSV"
              >
                📥 Exporteer CSV
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 font-sans text-sm font-semibold"
              >
                + Nieuwe gebruiker
              </button>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Geen gebruikers gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gemeente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aangemaakt</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.emailAddresses[0] || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.firstName || ''} {user.lastName || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.gemeenteNaam || (
                          <span className="text-red-600">Niet toegewezen</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.rol ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.rol}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Bewerken
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit form modal */}
        {showEditForm && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Gebruiker bewerken: {selectedUser.emailAddresses[0]}
                </h3>

                <div className="space-y-4">
                  {/* Gemeente selectie */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Gemeente <span className="text-red-600">*</span>
                    </label>
                    {gemeenten.length > 0 ? (
                      <select
                        value={formData.gemeenteOin}
                        onChange={(e) => {
                          const selected = gemeenten.find(g => g.oin === e.target.value);
                          setFormData({
                            ...formData,
                            gemeenteOin: e.target.value,
                            gemeenteNaam: selected?.naam || '',
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Selecteer gemeente</option>
                        {gemeenten.map((g) => (
                          <option key={g.oin} value={g.oin}>
                            {g.naam} ({g.oin})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={formData.gemeenteOin}
                          onChange={(e) => setFormData({ ...formData, gemeenteOin: e.target.value })}
                          placeholder="00000001002564440000"
                          maxLength={20}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <p className="mt-1 text-xs text-gray-500">Exact 20 cijfers</p>
                      </>
                    )}
                  </div>

                  {/* Gemeente Naam */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Gemeente Naam <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.gemeenteNaam}
                      onChange={(e) => setFormData({ ...formData, gemeenteNaam: e.target.value })}
                      placeholder="bijv. Amsterdam"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Rol <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="loket_medewerker">Loket Medewerker</option>
                      <option value="loket_readonly">Loket Read-only</option>
                      <option value="hb_admin">HB Admin</option>
                      <option value="system_admin">System Admin</option>
                      <option value="babs_admin">BABS Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-sans text-sm"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-sans text-sm"
                  >
                    {isSaving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create form modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Nieuwe gebruiker aanmaken
                </h3>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      placeholder="gebruiker@gemeente.nl"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Voornaam */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Voornaam <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.firstName}
                      onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                      placeholder="Jan"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Achternaam */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Achternaam <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.lastName}
                      onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                      placeholder="Jansen"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Gemeente selectie */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Gemeente <span className="text-red-600">*</span>
                    </label>
                    {gemeenten.length > 0 ? (
                      <select
                        value={createFormData.gemeenteOin}
                        onChange={(e) => {
                          const selected = gemeenten.find(g => g.oin === e.target.value);
                          setCreateFormData({
                            ...createFormData,
                            gemeenteOin: e.target.value,
                            gemeenteNaam: selected?.naam || '',
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Selecteer gemeente</option>
                        {gemeenten.map((g) => (
                          <option key={g.oin} value={g.oin}>
                            {g.naam} ({g.oin})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={createFormData.gemeenteOin}
                          onChange={(e) => setCreateFormData({ ...createFormData, gemeenteOin: e.target.value })}
                          placeholder="00000001002564440000"
                          maxLength={20}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <p className="mt-1 text-xs text-gray-500">Exact 20 cijfers</p>
                      </>
                    )}
                  </div>

                  {/* Gemeente Naam */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Gemeente Naam <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.gemeenteNaam}
                      onChange={(e) => setCreateFormData({ ...createFormData, gemeenteNaam: e.target.value })}
                      placeholder="bijv. Amsterdam"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Rol <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={createFormData.rol}
                      onChange={(e) => setCreateFormData({ ...createFormData, rol: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="loket_medewerker">Loket Medewerker</option>
                      <option value="loket_readonly">Loket Read-only</option>
                      <option value="hb_admin">HB Admin</option>
                      <option value="system_admin">System Admin</option>
                      <option value="babs_admin">BABS Admin</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      BABS Admin: voor BABS om eigen beschikbaarheid te beheren
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateFormData({
                        email: '',
                        firstName: '',
                        lastName: '',
                        gemeenteOin: '',
                        gemeenteNaam: '',
                        rol: 'loket_medewerker',
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-sans text-sm"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-sans text-sm"
                  >
                    {isSaving ? 'Aanmaken...' : 'Aanmaken'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

