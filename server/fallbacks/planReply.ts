import { PlanDayResponse, Language } from '../types';

export function generateHonestFallbackPlanReply(
  _notes?: string,
  language: Language = 'en'
): PlanDayResponse {
  if (language === 'hi') {
    return {
      greeting: 'नमस्ते! आपके लिए एक शांत और सुखद दिन की योजना',
      summary: 'आज का दिन बिना किसी हड़बड़ी के शांति, समय पर दवा और पर्याप्त विश्राम के साथ बिताएं।',
      schedule: [
        {
          time: 'सुबह 7:00',
          activity: 'जागना, गुनगुना पानी पीना और हल्की ताजी हवा में बैठना',
          tip: 'सुबह की धूप में 10-15 मिनट बैठना हड्डियों के लिए अच्छा होता है।',
        },
        {
          time: 'सुबह 8:30',
          activity: 'पौष्टिक नाश्ता और सुबह की नियमित दवाएं',
          tip: 'दवा ताजे पानी के साथ लें।',
        },
        {
          time: 'दोपहर 1:00',
          activity: 'हल्का सुपाच्य दोपहर का भोजन',
          tip: 'भोजन के बाद 30-40 मिनट का हल्का विश्राम करें।',
        },
        {
          time: 'शाम 5:00',
          activity: 'शाम की चाय/दूध और परिवार या मित्रों से बातचीत',
          tip: 'मनपसंद संगीत सुनें या प्रियजनों से बात करें।',
        },
        {
          time: 'रात 8:00',
          activity: 'हल्का रात का भोजन और रात की दवाएं',
          tip: 'सोने से पहले भारी भोजन से बचें।',
        },
      ],
      wellnessNote: 'संतोष ही सबसे बड़ा धन है। शांत मन से स्वस्थ जीवन का आनंद लें।',
      source: 'fallback',
    };
  }

  return {
    greeting: 'Namaste! A gentle and peaceful plan for your day',
    summary: 'Here is a calm, unhurried routine focusing on hydration, timely meals, and good rest.',
    schedule: [
      {
        time: '7:00 AM',
        activity: 'Wake up, sip warm water, and enjoy gentle morning fresh air or balcony sunlight',
        tip: '15 minutes of gentle morning sunlight is wonderful for natural Vitamin D.',
      },
      {
        time: '8:30 AM',
        activity: 'Nutritious breakfast and morning medications',
        tip: 'Take pills with a full glass of water sitting comfortably upright.',
      },
      {
        time: '1:00 PM',
        activity: 'Wholesome warm lunch followed by a restful afternoon pause',
        tip: 'A 30-minute nap or quiet reading helps recharge your energy.',
      },
      {
        time: '5:00 PM',
        activity: 'Evening warm beverage, light stroll, or phone call with loved ones',
        tip: 'Connecting with family or listening to peaceful music brings great joy.',
      },
      {
        time: '8:00 PM',
        activity: 'Light dinner and evening routine',
        tip: 'Keep screens away an hour before sleep for peaceful rest.',
      },
    ],
    wellnessNote: 'Patience and gratitude bring quiet strength to the heart and mind.',
    source: 'fallback',
  };
}
