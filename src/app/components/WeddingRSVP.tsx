import { useEffect, useRef, useState } from 'react';
import { Send, CheckCircle, Heart, MapPin, Calendar, Lock, Gift, Phone, CalendarPlus, Download, ExternalLink, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { API_BASE_URL } from '@/app/lib/api';
import footerImage from '../../assets/2a726c9bc882687d2c612204e0c10a04a2a0215a.png';
import headerImage from '../../assets/2acd5be44440207037c00d7daa9746f2532703f3.png';
import cardFrame from '../../assets/9348f08a6f3db0357a823389e0b945021b60dbca.png';

type CalendarOption = 'google' | 'ics';
type CalendarPlatform = 'android' | 'ios' | 'macos' | 'desktop';

const CALENDAR_ICS_URL = '/calendar/catarina-diogo-2026.ics';
const CALENDAR_EVENT_TITLE = 'Casamento Catarina & Diogo';
const CALENDAR_EVENT_LOCATION = 'Quinta da Eira, Bustelo, Penafiel, Porto';
const CALENDAR_EVENT_DETAILS = 'Cerimonia e rececao do casamento de Catarina e Diogo. Inicio as 15h30.';
const GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
  encodeURIComponent(CALENDAR_EVENT_TITLE) +
  '&dates=20261002T143000Z/20261002T223000Z' +
  '&ctz=' + encodeURIComponent('Europe/Lisbon') +
  '&location=' + encodeURIComponent(CALENDAR_EVENT_LOCATION) +
  '&details=' + encodeURIComponent(CALENDAR_EVENT_DETAILS);

function detectCalendarPlatform(): CalendarPlatform {
  if (typeof navigator === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isIpadOs = platform === 'MacIntel' && maxTouchPoints > 1;

  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent) || isIpadOs) return 'ios';
  if (/Mac/i.test(platform)) return 'macos';
  return 'desktop';
}

export function WeddingRSVP() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submitLockRef = useRef(false);
  const [showIban, setShowIban] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const calendarPlatform = detectCalendarPlatform();
  const recommendedCalendarOption: CalendarOption =
    calendarPlatform === 'ios' || calendarPlatform === 'macos' ? 'ics' : 'google';
  const isAppleRecommended = recommendedCalendarOption === 'ics';
  const isGoogleRecommended = recommendedCalendarOption === 'google';

  useEffect(() => {
    if (!showCalendarOptions) return;

    const originalOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCalendarOptions(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showCalendarOptions]);

  const [formData, setFormData] = useState({
    name: '',
    adultNames: [''],
    childrenNames: [] as string[],
    babyNames: [] as string[],
    email: '',
    phone: '',
    attendance: '',
    totalGuests: '1',
    adults: '1',
    children: '0',
    babies: '0',
    dietaryRestrictions: {
      glutenFree: false,
      vegetarian: false,
      vegan: false,
      nuts: false,
      seafood: false,
      lactose: false,
      otherText: ''
    },
    message: '',
    website: ''
  });

  const handleAdminAccess = () => {
    window.dispatchEvent(new CustomEvent('openAdminLogin'));
  };

  const handleCalendarAction = (option: CalendarOption) => {
    if (option === 'google') {
      window.open(GOOGLE_CALENDAR_URL, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(CALENDAR_ICS_URL);
    }

    setShowCalendarOptions(false);
  };

  const googleCalendarCardClassName = `flex w-full items-start justify-between rounded-2xl border px-4 py-4 text-left transition-transform hover:scale-[1.01] ${
    isGoogleRecommended ? 'border-[#cf6441]/40 bg-[#fff7f3]' : 'border-[#cf6441]/20 bg-white'
  }`;
  const appleCalendarCardClassName = `flex w-full items-start justify-between rounded-2xl border px-4 py-4 text-left transition-transform hover:scale-[1.01] ${
    isAppleRecommended ? 'border-[#8b9c8e]/40 bg-[#f5f7f4]' : 'border-[#8b9c8e]/20 bg-white'
  }`;
  const googleCalendarDescription =
    calendarPlatform === 'android'
      ? 'Melhor opção para Android e Chrome.'
      : 'Boa opção para browser no PC e para quem usa Google Calendar.';
  const appleCalendarDescription =
    calendarPlatform === 'ios' || calendarPlatform === 'macos'
      ? 'Melhor opção para iPhone, iPad e Mac.'
      : 'Ideal para Apple Calendar, Outlook e importação manual.';

  const isAttending = formData.attendance === 'sim';
  const isNotAttending = formData.attendance === 'nao';
  const adultCount = parseInt(formData.adults) || 0;
  const childCount = parseInt(formData.children) || 0;
  const babyCount = parseInt(formData.babies) || 0;
  const totalGuestCount = adultCount + childCount + babyCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    const nome = formData.adultNames[0].trim();
    const contacto = formData.phone;
    const email = formData.email;
    const confirmacao = isAttending;
    const num_adultos = adultCount;
    const num_children = confirmacao ? childCount : 0;
    const num_babies = confirmacao ? babyCount : 0;
    const nome_adultos = formData.adultNames.map((value) => value.trim()).filter(Boolean);
    const nome_criancas = formData.childrenNames.map((value) => value.trim()).filter(Boolean);
    const nome_bebes = formData.babyNames.map((value) => value.trim()).filter(Boolean);
    const alergias = formData.dietaryRestrictions;
    const mapaAlergias: Record<string, string> = {
      glutenFree: "Sem glúten / Celíaco",
      vegetarian: "Vegetariano",
      vegan: "Vegano",
      nuts: "Alergia a frutos secos",
      seafood: "Alergia a marisco",
      lactose: "Alergia a lactose",
    };
    const alergiasStr = [
      ...Object.entries(alergias)
        .filter(([key, value]) => key !== "otherText" && value === true)
        .map(([key]) => mapaAlergias[key]),
      alergias.otherText?.trim()
    ]
      .filter(Boolean)
      .join(", ");
    const mensagem = formData.message;
    const nomes = confirmacao
      ? [...nome_adultos, ...nome_criancas, ...nome_bebes].join(',')
      : nome_adultos.join(',');

    const payload = {
      str_Nome: nome,
      str_Contacto: contacto,
      str_Email: email,
      str_Alergias: alergiasStr,
      str_Nomes: nomes,
      str_Mensagem: mensagem,
      bool_Confirmacao: confirmacao,
      int_Adultos: num_adultos,
      int_Criancas: num_children,
      int_Bebes: num_babies,
      str_Website: formData.website
    };

    setSubmitError('');

    try {
      const response = await fetch(API_BASE_URL + '/submissoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Erro ao submeter");
      }
      await response.json();
      setSubmitted(true);
    } catch (error) {
      setSubmitError('Não foi possível enviar a confirmação. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'adults' || field === 'children' || field === 'babies') {
      const adults = field === 'adults' ? (parseInt(value) || 0) : (parseInt(formData.adults) || 0);
      const children = field === 'children' ? (parseInt(value) || 0) : (parseInt(formData.children) || 0);
      const babies = field === 'babies' ? (parseInt(value) || 0) : (parseInt(formData.babies) || 0);
      const totalGuests = adults + children + babies;
      
      const newAdultNames = [...formData.adultNames];
      const newChildrenNames = [...formData.childrenNames];
      const newBabyNames = [...formData.babyNames];
      
      if (adults > newAdultNames.length) {
        while (newAdultNames.length < adults) newAdultNames.push('');
      } else if (adults < newAdultNames.length && adults > 0) {
        newAdultNames.splice(adults);
      }
      
      if (children > newChildrenNames.length) {
        while (newChildrenNames.length < children) newChildrenNames.push('');
      } else if (children < newChildrenNames.length) newChildrenNames.splice(children);

      if (babies > newBabyNames.length) {
        while (newBabyNames.length < babies) newBabyNames.push('');
      } else if (babies < newBabyNames.length) newBabyNames.splice(babies);

      setFormData(prev => ({ 
        ...prev, 
        [field]: value, 
        adultNames: newAdultNames,
        childrenNames: newChildrenNames,
        babyNames: newBabyNames,
        totalGuests: totalGuests.toString() 
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAdultNameChange = (index: number, value: string) => {
    const newNames = [...formData.adultNames];
    newNames[index] = value;
    setFormData(prev => ({ ...prev, adultNames: newNames }));
  };
  const handleChildNameChange = (index: number, value: string) => {
    const newNames = [...formData.childrenNames];
    newNames[index] = value;
    setFormData(prev => ({ ...prev, childrenNames: newNames }));
  };
  const handleBabyNameChange = (index: number, value: string) => {
    const newNames = [...formData.babyNames];
    newNames[index] = value;
    setFormData(prev => ({ ...prev, babyNames: newNames }));
  };
  const handleDietaryChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: {
        ...prev.dietaryRestrictions,
        [field]: value
      }
    }));
  };
  const handleDietaryOtherTextChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: {
        ...prev.dietaryRestrictions,
        otherText: value
      }
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f1ed] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-[#8b9c8e] mx-auto mb-4" />
          <h2 className="text-3xl mb-3" style={{ fontFamily: 'Cormorante Infant, serif', color: '#cf6441' }}>
            CONFIRMAÇÃO RECEBIDA!
          </h2>
          <p className="text-gray-600 mb-6" style={{ fontFamily: 'Cormorant Infant, serif' }}>
            Obrigado por confirmar a sua presença. Estamos ansiosos para celebrar este dia especial connvosco!
          </p>
          <Button 
            onClick={() => setSubmitted(false)} 
            className="bg-[#8b9c8e] hover:bg-[#7a8b7d] text-white"
            style={{ fontFamily: 'Cormorant Infant, serif' }}
          >
            Regressar ao ínicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1ed]">
      {/* Header Section */}
      <div className="bg-[#f5f1ed] pt-16 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img src={headerImage} alt="Catarina & Diogo" className="mx-auto mb-4 w-full max-w-2xl h-auto" style={{ display: 'block' }} />
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-[#cf6441]"></div>
            <Heart className="w-5 h-5 text-[#cf6441]" />
            <div className="h-px w-16 bg-[#cf6441]"></div>
          </div>
        </div>
      </div>

      {/* Date and Location Cards */}
      <div className="max-w-3xl mx-auto px-4 mb-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
          <a href="https://www.google.com/maps/search/?api=1&query=Quinta+da+Eira+Bustelo+Penafiel+Porto" target="_blank" rel="noopener noreferrer" className="relative cursor-pointer group aspect-square transition-transform hover:scale-105 duration-300">
            <img src={cardFrame} alt="Card frame" className="absolute inset-0 w-full h-full object-contain" />
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 py-8">
              <MapPin className="w-6 h-6 text-[#8b9c8e] mx-auto mb-3 group-hover:text-[#cf6441] transition-colors" />
              <h3 className="text-base mb-1 text-[#cf6441] text-center leading-tight" style={{ fontFamily: 'Cormrant, serif', fontWeight: '500' }}>
                LOCAL DE CERIMÓNIA<br/>E RECEÇÃO
              </h3>
              <p className="text-lg text-gray-700 font-medium text-center" style={{ fontFamily: 'Cormorant, serif' }}>
                QUINTA DA EIRA
              </p>
              <p className="text-sm text-gray-500 mt-1 text-center" style={{ fontFamily: 'Cormorant, serif' }}>
                Bustelo, Penafiel, Porto
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setShowCalendarOptions(true)}
            className="relative aspect-square cursor-pointer group transition-transform hover:scale-105 duration-300"
            aria-label="Adicionar o casamento ao calendário"
          >
            <img src={cardFrame} alt="Card frame" className="absolute inset-0 w-full h-full object-contain" />
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 ">
              <Calendar className="w-6 h-6 text-[#8b9c8e] mx-auto mb-3 group-hover:text-[#cf6441] transition-colors" />
              <div className="text-2xl mb-1 text-[#cf6441] text-center leading-tight" style={{ fontFamily: 'Cormorant Infant, serif', fontWeight: '500' }}>
                2 DE<br/>OUTUBRO <br/>DE 2026
              </div>
              <div className="text-sm text-[#cf6441] text-center" style={{ fontFamily: 'Cormorant Infant, serif', fontWeight: '400' }}>
                Às 15h30
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-[#839786] py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl text-center mb-3 text-white" style={{ fontFamily: 'Cormorant Infant, serif' }}>
            CONFIRME A SUA PRESENÇA
          </h2>
          <p className="text-center text-white/90 mb-12" style={{ fontFamily: 'Cormorant Infant, serif', fontSize: '0.90rem' }}>
            ATÉ AO DIA 1 DE SETEMBRO DE 2026
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="sr-only" aria-hidden="true">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Nome Completo */}
            <div>
              <Label htmlFor="name" className="text-white mb-2 block text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                Nome Completo *
              </Label>
              <Input id="name" required value={formData.adultNames[0]} onChange={(e) => handleAdultNameChange(0, e.target.value)} placeholder="Seu nome completo" className="bg-white/95 border-white/50 focus:border-white text-base" style={{ fontFamily: 'Cormorant Infant, serif' }} />
            </div>

            {/* Email e Telefone */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-white mb-2 block text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                  E-mail *
                </Label>
                <Input id="email" type="email" required value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="ex: xxxxx@email.com" className="bg-white/95 border-white/50 focus:border-white text-base" style={{ fontFamily: 'Cormorant Infant, serif' }}/>
              </div>
              <div>
                <Label htmlFor="phone" className="text-white mb-2 block text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                  Contacto *
                </Label>
                <Input id="phone" type="tel" required value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="ex: 910 000 000" className="bg-white/95 border-white/50 focus:border-white text-base" style={{ fontFamily: 'Cormorant Infant, serif' }} />
              </div>
            </div>

            {/* Confirmação */}
            <div>
              <Label className="text-white mb-3 block text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                Confirmação *
              </Label>
              <RadioGroup required value={formData.attendance} onValueChange={(value) => handleChange('attendance', value)} className="space-y-2">
                <div className="flex items-center space-x-2 bg-white/10 p-3 rounded">
                  <RadioGroupItem value="sim" id="sim" className="border-white text-white" />
                  <Label htmlFor="sim" className="cursor-pointer text-white text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>Sim, estarei presente!</Label>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 p-3 rounded">
                  <RadioGroupItem value="nao" id="nao" className="border-white text-white" />
                  <Label htmlFor="nao" className="cursor-pointer text-white text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>Infelizmente não posso estar presente</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Campos que aparecem depois da escolha */}
            {(isAttending || isNotAttending) && (
              <>
                <div>
                  <Label className="text-white mb-3 block text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                    {isAttending ? 'Nº de Pessoas por Convite *' : 'Nº de Pessoas que não poderão estar presentes *'}
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="adults" className="text-white/80 text-base mb-1 block" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                        {isAttending ? 'Convidados' : 'Pessoas'}
                      </Label>
                      <Input
                        id="adults"
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={formData.adults}
                        onChange={(e) => handleChange('adults', e.target.value)}
                        className="bg-white/95 border-white/50 focus:border-white text-base"
                        style={{ fontFamily: 'Cormorant Infant, serif' }}
                      />
                    </div>
                  </div>
                  <p className="text-white/70 text-base mt-2" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                    Total: {isAttending ? totalGuestCount : adultCount} pessoa(s)
                  </p>
                </div>

                {adultCount > 1 && (
                  <div className="space-y-4">
                    <Label className="text-white block text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                      {isAttending ? 'Nomes dos Outros Convidados *' : 'Nomes das Outras Pessoas que não poderão estar presentes *'}
                    </Label>
                    {formData.adultNames.slice(1).map((name, index) => (
                      <div key={index + 1}>
                        <Label htmlFor={`name-${index + 1}`} className="text-white/80 text-base mb-1 block" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                          Pessoa {index + 2}
                        </Label>
                        <Input
                          id={`name-${index + 1}`}
                          required
                          value={name}
                          onChange={(e) => handleAdultNameChange(index + 1, e.target.value)}
                          placeholder="Nome completo"
                          className="bg-white/95 border-white/50 focus:border-white text-base"
                          style={{ fontFamily: 'Cormorant Infant, serif' }}
                        />
                      </div>
                    ))}
                    {isAttending && formData.childrenNames.map((name, index) => (
                      <div key={`child-${index}`}>
                        <Label htmlFor={`child-${index}`} className="text-white/80 text-base mb-1 block" style={{ fontFamily: 'Cormorant Infant, serif' }}>Criança {index + 1}</Label>
                        <Input id={`child-${index}`} required value={name} onChange={(e) => handleChildNameChange(index, e.target.value)} placeholder="Nome completo" className="bg-white/95 border-white/50 focus:border-white text-base" style={{ fontFamily: 'Cormorant Infant, serif' }} />
                      </div>
                    ))}
                    {isAttending && formData.babyNames.map((name, index) => (
                      <div key={`baby-${index}`}>
                        <Label htmlFor={`baby-${index}`} className="text-white/80 text-base mb-1 block" style={{ fontFamily: 'Cormorant Infant, serif' }}>Bebé {index + 1}</Label>
                        <Input id={`baby-${index}`} required value={name} onChange={(e) => handleBabyNameChange(index, e.target.value)} placeholder="Nome completo" className="bg-white/95 border-white/50 focus:border-white text-base" style={{ fontFamily: 'Cormorant Infant, serif' }} />
                      </div>
                    ))}
                  </div>
                )}

                {isNotAttending && (
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white/85" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                    Se o convite incluir mais do que uma pessoa, indique acima quem não poderá estar presente para registarmos a resposta corretamente.
                  </div>
                )}

                {isAttending && (
                  <div>
                    <Label className="text-white mb-3 block text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>Alergias e Restrições Alimentares</Label>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 bg-white/10 p-3 rounded">
                          <Checkbox id="vegetarian" checked={formData.dietaryRestrictions.vegetarian} onCheckedChange={(value) => handleDietaryChange('vegetarian', value as boolean)} className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#839786]" />
                          <Label htmlFor="vegetarian" className="cursor-pointer text-white text-base" style={{ fontFamily: 'Cormorant Infant, serif' }}>Vegetariano/Vegano</Label>
                        </div>
                      </div>
                      <div className="bg-white/10 p-3 rounded space-y-2">
                        <Label htmlFor="dietaryOther" className="text-white text-base block" style={{ fontFamily: 'Cormorant Infant, serif' }}>Alergias (especifique)</Label>
                        <Input id="dietaryOther" value={formData.dietaryRestrictions.otherText} onChange={(e) => handleDietaryOtherTextChange(e.target.value)} placeholder="Especifique outras restrições alimentares" className="bg-white/95 border-white/50 focus:border-white text-base w-full" style={{ fontFamily: 'Cormorant, serif' }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
              {/* Botão Presente com IBAN na mesma linha, à esquerda */}
              <div className="mt-8 mb-2 flex items-center justify-center gap-3">
                <Button 
                  type="button" 
                  onClick={() => setShowIban(!showIban)}
                  className="bg-[#cf6441] hover:bg-[#b85637] text-white w-15 h-15 flex items-center justify-center"
                  
                >
                  <Gift className="!w-7 !h-7" />
                  
                </Button>
                
                {showIban && (
                  <div className="text-white text-2" style={{ fontFamily: 'Cormorant Infant, serif', lineHeight: '1.2' }}>
                    <p className="m-0">Catarina: PT50 0036 0094 9910 0002 933 05</p>
                    <p className="m-0">Diogo: PT50 0036 0030 9910 1785 597 98</p>
                  </div>
                )}
              </div>

            {/* Mensagem para os Noivos */}
            <div>
              <Label htmlFor="message" className="text-white mb-2 block text-lg" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                Mensagem para os Noivos
              </Label>
              <Textarea id="message" value={formData.message} onChange={(e) => handleChange('message', e.target.value)} placeholder="Deixe uma mensagem carinhosa..." rows={4} className="bg-white/95 border-white/50 focus:border-white text-base" style={{ fontFamily: 'Cormorant Infant, serif' }} />
            </div>
            {/* Botão Presente com IBAN na mesma linha, à esquerda */}
              <div className="mt-2 mb-5 flex items-center r gap-3">
                <Button 
                  type="button" 
                  onClick={() => setShowPhone(!showPhone)}
                  className="bg-white/10 hover:bg-[#b85637] text-white w-10 h-10 flex items-center justify-center"
                  
                >
                  <Phone className="!w-5 !h-5" />
                  
                </Button>
                
                {showPhone && (
                  <div className="text-white text-2" style={{ fontFamily: 'Cormorant Infant, serif', lineHeight: '1.2' }}>
                    <p className="m-0">Catarina: +351 916 045 352</p>
                    <p className="m-0">Diogo: +351 919 143 932</p>
                  </div>
                )}
              </div>

            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#cf6441] hover:bg-[#b85637] text-white py-6 text-lg disabled:opacity-70"
              size="lg"
              style={{ fontFamily: 'Cormorant Infant, serif' }}
              disabled={isSubmitting}
            >
              <Send className="w-5 h-5 mr-2" />
              {isSubmitting ? 'A enviar...' : 'Enviar Confirmação'}
            </Button>
          </form>
        </div>
      </div>

      {showCalendarOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4" onClick={() => setShowCalendarOptions(false)} role="presentation">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#8b9c8e]">Calendário</p>
                <h3 id="calendar-modal-title" className="mt-2 text-2xl text-[#cf6441]" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                  Guardar a data
                </h3>
                <p className="mt-2 text-sm text-gray-600" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                  A opção recomendada muda consoante o dispositivo. Se a primeira não abrir, use a alternativa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarOptions(false)}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => handleCalendarAction('google')}
                className={googleCalendarCardClassName}
              >
                <div className="flex items-start gap-3">
                  <CalendarPlus className="mt-1 h-5 w-5 text-[#cf6441]" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#cf6441]" style={{ fontFamily: 'Cormorant Infant, serif' }}>Google Calendar</p>
                      {isGoogleRecommended && (
                        <span className="rounded-full bg-[#cf6441] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                      {googleCalendarDescription}
                    </p>
                  </div>
                </div>
                <ExternalLink className="mt-1 h-4 w-4 text-[#cf6441]" />
              </button>

              <button
                type="button"
                onClick={() => handleCalendarAction('ics')}
                className={appleCalendarCardClassName}
              >
                <div className="flex items-start gap-3">
                  <Download className="mt-1 h-5 w-5 text-[#8b9c8e]" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#5d7161]" style={{ fontFamily: 'Cormorant Infant, serif' }}>Apple Calendar / Outlook (.ics)</p>
                      {isAppleRecommended && (
                        <span className="rounded-full bg-[#8b9c8e] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Cormorant Infant, serif' }}>
                      {appleCalendarDescription}
                    </p>
                  </div>
                </div>
                <ExternalLink className="mt-1 h-4 w-4 text-[#5d7161]" />
              </button>
            </div>

            <div className="mt-5 whitespace-pre-line rounded-2xl bg-[#f5f1ed] px-4 py-3 text-sm text-gray-600" style={{ fontFamily: 'Cormorant Infant, serif' }}>
              {'2 de outubro de 2026, 15h30\nQuinta da Eira, Bustelo, Penafiel, Porto'}
            </div>
          </div>
        </div>
      )}

      {/* Footer with image */}
      <div className="w-full overflow-hidden" style={{ aspectRatio: '7505 / 1360' }}>
        <img src={footerImage} alt="Footer decorativo" className="h-full w-full object-cover object-center" style={{ display: 'block' }} />
      </div>

      <button
        onClick={handleAdminAccess}
        className="group fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/35 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/55 sm:bottom-6 sm:right-6"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
        aria-label="Acesso administrativo"
      >
        <Heart className="w-5 h-5 text-[#cf6441] transition-transform group-hover:scale-110" />
        <Lock className="absolute bottom-1 right-1 w-3 h-3 text-[#cf6441] opacity-60" />
      </button>
    </div>
  );
}
