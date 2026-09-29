/**
 * Le domande frequenti della home: mostrate nella pagina e ripetute come dati strutturati
 * (FAQPage) per motori di ricerca e assistenti AI. Una sola fonte, così non divergono.
 */
export const faqs = [
  {
    question: 'Quanto costa Duetrack?',
    answer:
      'Niente. È gratuito, senza pubblicità e senza abbonamenti, e il codice è pubblico su GitHub con licenza MIT.',
  },
  {
    question: 'Come capisce di quale cliente è una sessione?',
    answer:
      'Scegli il calendario in cui segni gli appuntamenti: ogni evento con orario è una sessione, e il titolo dice di chi è. Se un titolo non corrisponde a nessun cliente, finisce tra quelli da classificare e lo assegni una volta per tutte.',
  },
  {
    question: 'Duetrack modifica il mio Google Calendar?',
    answer: 'No. Lo legge soltanto: non crea, non sposta e non cancella eventi.',
  },
  {
    question: 'Dove finiscono i miei dati?',
    answer:
      'Sul tuo dispositivo e in un file sul tuo Google Drive, che tiene allineati telefono e computer. Duetrack non ha un server: nessuno riceve i tuoi dati, nemmeno chi l’ha realizzato.',
  },
  {
    question: 'Funziona sul telefono?',
    answer:
      'Sì. Si apre dal browser e si può installare come app, con la sua icona, su Android, iPhone, iPad e computer.',
  },
  {
    question: 'Perché Google avvisa che l’app non è verificata?',
    answer:
      'Duetrack è il progetto gratuito di una persona e non ha fatto la procedura di verifica di Google. Per proseguire tocca Avanzate e poi Vai a Duetrack: i permessi chiesti restano quelli descritti in questa pagina.',
  },
] as const
