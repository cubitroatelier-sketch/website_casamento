import { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Trash2,
  LogOut,
  FileSpreadsheet
} from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { utils, writeFile } from 'xlsx';

interface AdminPanelProps {
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
  dietaryRestrictions?: string | {
    vegetarian: boolean;
    other: boolean;
    otherText: string;
  };
  message?: string;
  timestamp: string;
  id: number;
}

export function AdminPanel({ onBackClick }: AdminPanelProps) {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [numSubmissoes, setNumSubmissoes] = useState(0);
  const [pessoasNv, setNumPessoasNv] = useState(0);

  const carregarTudo = async () => {
    try {
      const [lista, stats] = await Promise.all([
        fetch("https://backend-7ej1.onrender.com/submissoes").then(res => res.json()),
        fetch("https://backend-7ej1.onrender.com/estatisticas").then(res => res.json())
      ]);
      setRsvps(lista || []);
      setNumSubmissoes(stats.total_submissoes ?? 0);
      setNumPessoasNv(stats.pessoas_nao_vao ?? 0);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const totalAdultos = rsvps
    .filter(r => r.attendance === 'sim')
    .reduce((acc, r) => acc + parseInt(r.adults || "0"), 0);

  const formatDietaryRestrictions = (restrictions?: RSVP['dietaryRestrictions']) => {
    if (!restrictions) return '-';
    if (typeof restrictions === 'string') return restrictions;

    const items: string[] = [];
    if (restrictions.vegetarian) items.push('Vegetariano');
    if (restrictions.other && restrictions.otherText)
      items.push(`Outro: ${restrictions.otherText}`);

    return items.length ? items.join(', ') : '-';
  };

  // DELETE com x-api-key
  const deleteRSVP = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta confirmação?')) return;

    await fetch(`https://backend-7ej1.onrender.com/submissoes?id=${id}`, {
      method: "DELETE",
      headers: { "x-api-key": "CHAVE_SECRETA" }
    });

    carregarTudo();
  };

  const clearAll = async () => {
    if (!confirm('Tem certeza que deseja excluir TODAS as confirmações?')) return;

    await fetch("https://backend-7ej1.onrender.com/submissoes?id=0", {
      method: "DELETE",
      headers: { "x-api-key": "CHAVE_SECRETA" }
    });

    carregarTudo();
  };

  const exportToExcel = () => {
    if (rsvps.length === 0) {
      alert('Não há confirmações para exportar.');
      return;
    }

    const data = rsvps.map((rsvp, index) => ({
      '#': index + 1,
      'Adultos': rsvp.adultNames?.join(', ') || rsvp.names?.join(', ') || '-',
      'Crianças': rsvp.childrenNames?.join(', ') || '-',
      'E-mail': rsvp.email,
      'Telefone': rsvp.phone || '-',
      'Status': rsvp.attendance === 'sim' ? 'Confirmado' : 'Não Comparecerá',
      'Ausentes': rsvp.attendance === 'nao' ? rsvp.absentNames || '-' : '-',
      'Nº Adultos': rsvp.attendance === 'sim' ? rsvp.adults : '-',
      'Restrições': formatDietaryRestrictions(rsvp.dietaryRestrictions),
      'Mensagem': rsvp.message || '-',
      'Data': new Date(rsvp.timestamp).toLocaleString('pt-BR')
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Confirmações');
    writeFile(wb, `confirmacoes.xlsx`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f5f1ed]">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
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

        {/* Estatísticas */}
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

        {/* Ações */}
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

        {/* Lista completa de RSVPs */}
        <div className="space-y-4">
          {rsvps.map(rsvp => (
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

                  {/* Nomes dos convidados */}
                  {(rsvp.attendance === 'sim' && (rsvp.adultNames || rsvp.childrenNames)) && (
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

                  {/* Ausentes */}
                  {rsvp.attendance === 'nao' && rsvp.absentNames && (
                    <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Não Comparecerão:</p>
                      <p className="text-sm text-gray-700">{rsvp.absentNames}</p>
                    </div>
                  )}

                  {/* Restrições */}
                  {rsvp.attendance === 'sim' && formatDietaryRestrictions(rsvp.dietaryRestrictions) !== '-' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      {formatDietaryRestrictions(rsvp.dietaryRestrictions)}
                    </div>
                  )}

                  {/* Mensagem */}
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