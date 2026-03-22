import { useEffect, useState } from 'react';
import {
  CheckCircle,
  FileSpreadsheet,
  LogOut,
  Mail,
  Phone,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { API_BASE_URL, getAdminAuthorizationHeader } from '@/app/lib/api';

interface AdminPanelProps {
  authToken: string;
  onBackClick: () => void;
}

interface RSVP {
  adultNames?: string[];
  childrenNames?: string[];
  babyNames?: string[];
  names?: string[];
  email: string;
  phone: string;
  attendance: string;
  absentNames?: string;
  adults: string;
  children?: string;
  dietaryRestrictions?:
    | string
    | {
        vegetarian: boolean;
        other: boolean;
        otherText: string;
      };
  message?: string;
  timestamp: string;
  id: number;
}

export function AdminPanel({ authToken, onBackClick }: AdminPanelProps) {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [numSubmissoes, setNumSubmissoes] = useState(0);
  const [pessoasNv, setNumPessoasNv] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const adminHeaders = getAdminAuthorizationHeader(authToken);

  const handleProtectedJsonResponse = async (response: Response) => {
    if (response.status === 401) {
      onBackClick();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      throw new Error('Não foi possível comunicar com o servidor.');
    }

    return response.json();
  };

  const carregarTudo = async () => {
    try {
      setErrorMessage('');
      const [lista, stats] = await Promise.all([
        fetch(API_BASE_URL + '/submissoes', {
          headers: adminHeaders,
        }).then(handleProtectedJsonResponse),
        fetch(API_BASE_URL + '/estatisticas', {
          headers: adminHeaders,
        }).then(handleProtectedJsonResponse),
      ]);

      setRsvps(lista || []);
      setNumSubmissoes(stats.total_submissoes ?? 0);
      setNumPessoasNv(stats.pessoas_nao_vao ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados.';
      setErrorMessage(message);
      console.error('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    void carregarTudo();
  }, [authToken]);

  const totalAdultos = rsvps
    .filter((rsvp) => rsvp.attendance === 'sim')
    .reduce((acc, rsvp) => acc + parseInt(rsvp.adults || '0', 10), 0);

  const formatDietaryRestrictions = (restrictions?: RSVP['dietaryRestrictions']) => {
    if (!restrictions) return '-';
    if (typeof restrictions === 'string') return restrictions;

    const items: string[] = [];
    if (restrictions.vegetarian) items.push('Vegetariano');
    if (restrictions.other && restrictions.otherText) {
      items.push(`Outro: ${restrictions.otherText}`);
    }

    return items.length ? items.join(', ') : '-';
  };

  const deleteRSVP = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta confirmação?')) return;

    try {
      const response = await fetch(API_BASE_URL + '/submissoes?id=' + id, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      await handleProtectedJsonResponse(response);
      await carregarTudo();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao apagar confirmação.';
      setErrorMessage(message);
      console.error('Erro ao apagar confirmação:', err);
    }
  };

  const clearAll = async () => {
    if (!confirm('Tem certeza que deseja excluir TODAS as confirmações?')) return;

    try {
      const response = await fetch(API_BASE_URL + '/submissoes?id=0', {
        method: 'DELETE',
        headers: adminHeaders,
      });
      await handleProtectedJsonResponse(response);
      await carregarTudo();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao limpar confirmações.';
      setErrorMessage(message);
      console.error('Erro ao limpar confirmações:', err);
    }
  };

  const exportToExcel = () => {
    if (rsvps.length === 0) {
      alert('Não há confirmações para exportar.');
      return;
    }

    const data = rsvps.map((rsvp, index) => ({
      '#': index + 1,
      Adultos: rsvp.adultNames?.join(', ') || rsvp.names?.join(', ') || '-',
      'Crianças': rsvp.childrenNames?.join(', ') || '-',
      'E-mail': rsvp.email,
      Telefone: rsvp.phone || '-',
      Status: rsvp.attendance === 'sim' ? 'Confirmado' : 'Não Comparecerá',
      Ausentes: rsvp.attendance === 'nao' ? rsvp.absentNames || '-' : '-',
      'Nº Adultos': rsvp.attendance === 'sim' ? rsvp.adults : '-',
      'Restrições': formatDietaryRestrictions(rsvp.dietaryRestrictions),
      Mensagem: rsvp.message || '-',
      Data: new Date(rsvp.timestamp).toLocaleString('pt-BR'),
    }));

    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Confirmações');
    writeFile(workbook, 'confirmacoes.xlsx');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f5f1ed]">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={onBackClick}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
          <Badge variant="outline" className="text-sm">
            Sessão Administrativa
          </Badge>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie as confirmações de presença</p>
        </div>

        {errorMessage && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 text-sm text-red-600">{errorMessage}</CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total de Respostas</p>
                <p className="text-3xl">{numSubmissoes}</p>
              </div>
              <Users className="w-8 h-8 text-orange-400" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total de Convidados</p>
                <p className="text-3xl">{totalAdultos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-400" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Não Comparecerão</p>
                <p className="text-3xl">{pessoasNv}</p>
              </div>
              <XCircle className="w-8 h-8 text-orange-400" />
            </CardContent>
          </Card>
        </div>

        {rsvps.length > 0 && (
          <div className="mb-6 flex justify-between items-center gap-4">
            <Button onClick={exportToExcel} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar para Excel
            </Button>
            <Button variant="destructive" onClick={clearAll} size="sm">
              <Trash2 className="w-4 h-4 mr-2" /> Limpar Todas
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex gap-3 items-center">
                      {rsvp.adultNames?.[0] || rsvp.names?.[0] || '-'}
                      <Badge variant={rsvp.attendance === 'sim' ? 'default' : 'secondary'}>
                        {rsvp.attendance === 'sim' ? 'Confirmado' : 'Não Comparecerá'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(rsvp.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRSVP(rsvp.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {rsvp.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" /> {rsvp.email}
                    </div>
                  )}
                  {rsvp.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" /> {rsvp.phone}
                    </div>
                  )}

                  {rsvp.attendance === 'sim' && (rsvp.adultNames || rsvp.childrenNames) && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Nomes dos Convidados</p>
                      <div className="space-y-2">
                        {rsvp.adultNames?.length > 0 && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Convidados:</p>
                            <p className="text-sm text-gray-700">{rsvp.adultNames.join(', ')}</p>
                          </div>
                        )}
                        {rsvp.childrenNames?.length > 0 && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs font-semibold text-green-700 mb-1">Crianças:</p>
                            <p className="text-sm text-gray-700">{rsvp.childrenNames.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {rsvp.attendance === 'nao' && rsvp.absentNames && (
                    <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Não Comparecerão:</p>
                      <p className="text-sm text-gray-700">{rsvp.absentNames}</p>
                    </div>
                  )}

                  {rsvp.attendance === 'sim' && formatDietaryRestrictions(rsvp.dietaryRestrictions) !== '-' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      {formatDietaryRestrictions(rsvp.dietaryRestrictions)}
                    </div>
                  )}

                  {rsvp.message && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                      {rsvp.message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
