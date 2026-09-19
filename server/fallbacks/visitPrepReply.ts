import { Language, VisitPrepResponse } from '../types';

export function generateHonestFallbackVisitPrepReply(
  medicineNames: string[],
  language: Language = 'en'
): VisitPrepResponse {
  const isHi = language === 'hi';

  const defaultQuestionsEn: string[] = [
    'Are all of these medicines still needed, or can any be reduced?',
    'Do any of these medicines interact with each other or with my meals?',
    'What should I do if I ever miss a dose by mistake?',
    'Are there any routine blood tests or check-ups needed while taking these?',
  ];

  const defaultQuestionsHi: string[] = [
    'क्या ये सभी दवाएं अभी भी आवश्यक हैं, या किसी में बदलाव की जरूरत है?',
    'क्या इनमें से कोई दवा आपस में या मेरे भोजन के साथ कोई असर करती है?',
    'यदि कभी गलती से कोई खुराक छूट जाए, तो मुझे क्या करना चाहिए?',
    'इन दवाओं को लेते समय क्या कोई रूटीन खून की जांच करवाने की आवश्यकता है?',
  ];

  const questions: string[] = [...(isHi ? defaultQuestionsHi : defaultQuestionsEn)];

  // If specific medicines are present, add a targeted reminder question
  if (medicineNames.length > 0) {
    const firstMed = medicineNames[0];
    if (isHi) {
      questions.unshift(`मुझे ${firstMed} कितने दिनों तक और लेते रहना है?`);
    } else {
      questions.unshift(`How long should I continue taking ${firstMed}?`);
    }
  }

  return {
    questions: questions.slice(0, 6),
    disclaimer: isHi
      ? 'ये डॉक्टर से पूछने के सवाल हैं। निर्णय हमेशा आपके डॉक्टर का होगा।'
      : 'These are questions to ask. Your doctor decides.',
    source: 'fallback',
  };
}
