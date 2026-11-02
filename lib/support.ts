export type HelpTopic = 'register' | 'agreements' | 'privacy' | 'payments';
export const helpTopics: Record<
  HelpTopic,
  { question: string; answer: string; href?: string; linkText?: string }
> = {
  register: {
    question: 'Quiero registrar a mi peludo',
    answer:
      '¡Vamos a darle un buen comienzo! Solo necesitamos tus datos de contacto, una foto y algunos datos de tu perro. Se guarda un preperfil privado; después confirmamos contigo la publicación.',
    href: '/unete',
    linkText: 'Crear su preperfil',
  },
  agreements: {
    question: '¿Cómo funcionan los acuerdos?',
    answer:
      'Una persona propone y la otra puede aceptar o hacer una contrapropuesta: dinero, crías y condiciones claras. Solo la última versión aceptada por ambas queda guardada. El bienestar siempre tiene prioridad.',
    href: '/',
    linkText: 'Explorar DOCLOUD',
  },
  privacy: {
    question: '¿Mis datos se hacen públicos?',
    answer:
      'El formulario rápido guarda un preperfil privado. Tu celular y correo no aparecen en el catálogo. La publicación se confirma después contigo.',
    href: '/unete/privacidad',
    linkText: 'Ver cómo cuidamos tus datos',
  },
  payments: {
    question: '¿Ya puedo pagar o cobrar?',
    answer:
      'Los pagos todavía no están habilitados. Enviar o aceptar una propuesta no realiza ningún cobro ni retiene dinero. Podemos ir construyendo un acuerdo claro, paso a paso.',
  },
};
export function whatsappLink(raw: string | undefined) {
  if (!raw?.trim()) return null;
  const number = raw.replace(/[\s()+.-]/g, '');
  if (!/^[1-9]\d{7,14}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent('Hola, me gustaría recibir ayuda con DOCLOUD 🐾')}`;
}
