import { MedicineExplainerResponse, Language } from '../types';

export function generateHonestFallbackMedicineReply(
  medicineName: string,
  dosage?: string,
  instructions?: string,
  language: Language = 'en'
): MedicineExplainerResponse {
  if (language === 'hi') {
    return {
      simpleName: medicineName,
      whatItDoes: 'यह दवा आपके डॉक्टर द्वारा आपके स्वास्थ्य और लक्षणों को संतुलित रखने के लिए लिखी गई है।',
      bestTimeToTake: instructions || 'अपने डॉक्टर की सलाह के अनुसार नियमित समय पर लें।',
      foodGuidance: 'आमतौर पर भोजन के बाद ताजे पानी के साथ लेना बेहतर होता है।',
      simplePrecautions: [
        'हर दिन एक ही निश्चित समय पर दवा लें।',
        'डॉक्टर की सलाह के बिना दवा की मात्रा में कोई बदलाव न करें।',
      ],
      missedDoseAdvice: 'यदि खुराक छूट जाती है, तो कृपया अपने डॉक्टर या फार्मासिस्ट से परामर्श लें कि क्या करना है। कभी भी एक साथ दो गोलियां न लें।',
      storageTip: 'दवा को नमी और सीधी धूप से दूर किसी सुरक्षित और सूखी जगह पर रखें।',
      disclaimer: 'मैं केवल सामान्य जानकारी देता हूँ; अंतिम निर्णय आपके डॉक्टर का होता है।',
      source: 'fallback',
    };
  }

  return {
    simpleName: medicineName,
    whatItDoes: 'This medication is prescribed by your doctor to manage your specific health condition and keep you feeling well.',
    bestTimeToTake: instructions || 'Take at a consistent time each day as recommended on your prescription.',
    foodGuidance: 'Generally best taken with water according to the instructions on the strip or prescription.',
    simplePrecautions: [
      'Take at the same fixed time each day for steady benefit.',
      'Do not discontinue or alter the dose without consulting your doctor.',
    ],
    missedDoseAdvice: 'Please ask your doctor or pharmacist what to do if you miss a dose. Never take a double dose to make up for a missed one.',
    storageTip: 'Store in a cool, dry place away from heat, direct sunlight, and moisture.',
    disclaimer: 'I only explain; your doctor decides. Always follow your physician’s exact prescription.',
    source: 'fallback',
  };
}
