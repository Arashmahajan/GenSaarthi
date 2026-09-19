import { Language } from '../types';

export function generateHonestFallbackChatReply(msg: string, language: Language = 'en'): string {
  // Use word boundary matching
  const hasGreeting = /\b(?:hello|namaste|pranam|hey|good morning|good evening)\b/i.test(msg) ||
    /\bhi\b/i.test(msg); // Note: \bhi\b won't match "this", "which", "white"

  const hasPension = /\b(?:pension|jeevan pramaan|life certificate|epfo|ppo)\b/i.test(msg);
  const hasWisdom = /\b(?:story|kahani|thought|shloka|peace|doha|kabir)\b/i.test(msg);
  const hasTech = /\b(?:whatsapp|phonepe|gpay|paytm|camera|zoom|video call)\b/i.test(msg);

  if (language === 'hi') {
    if (hasGreeting) {
      return 'नमस्ते! मैं सारथी हूँ, आपका डिजिटल साथी। आप मुझसे कोई भी संदेश जांचने, बिल समझने, दवाइयों के बारे में पूछने या दिन की दिनचर्या बनाने के लिए कह सकते हैं। आज मैं आपकी क्या सहायता करूँ?';
    }
    if (hasPension) {
      return 'जीवन प्रमाण (डिजिटल लाइफ सर्टिफिकेट) के लिए अब बैंक जाने की आवश्यकता नहीं है। आप अपने स्मार्टफोन में जीवन प्रमाण ऐप और आधार फेस आरडी ऐप से घर बैठे प्रमाण पत्र जमा कर सकते हैं।';
    }
    if (hasWisdom) {
      return 'संत कबीर का शांत विचार:\n\n"धीरे-धीरे रे मना, धीरे सब कुछ होय।\nमाली सींचे सौ घड़ा, ऋतु आए फल होय॥"\n\nहर काम अपने सही समय पर ही शांति से पूरा होता है। मन को शांत रखें, थोड़ा विश्राम करें और दिन का आनंद लें!';
    }
    if (hasTech) {
      return 'नई तकनीक सीखना बहुत आसान है जब हम इसे शांति से कदम-दर-कदम समझें। आप कोई भी ऐप खोलते समय घबराएं नहीं। कभी भी अनजान लिंक पर क्लिक न करें या अपना ओटीपी किसी के साथ साझा न करें।';
    }
    return 'नमस्ते! मैं आपके साथ हूँ। यदि आपके पास कोई बिल, पत्र, या फोन पर आया कोई संदेश है, तो आप मुझे दिखा सकते हैं। मैं उसे सरल शब्दों में समझा दूंगा।';
  }

  // English fallback
  if (hasGreeting) {
    return 'Namaste! I am Saarthi, your digital companion. You can ask me to check a suspicious message, explain a utility bill or prescription, or help organize your day. How may I help you today?';
  }
  if (hasPension) {
    return 'For your Jeevan Pramaan (Digital Life Certificate), you can submit it conveniently from home using the official Jeevan Pramaan Face app and Aadhaar Face RD service on an Android phone, without standing in bank queues.';
  }
  if (hasWisdom) {
    return 'A peaceful reflection for your day:\n\n"Patience is the companion of wisdom."\n\nTake a slow, gentle breath, sip some warm water, and remember that life is best enjoyed one calm moment at a time. Wishing you peace and good health today!';
  }
  if (hasTech) {
    return 'Using modern apps like WhatsApp or digital payments is simple when taken step by step. Always remember the golden safety rule: never share your 6-digit bank OTP or UPI PIN with anyone, even if they claim to be from customer care.';
  }

  return 'Namaste! I am here by your side. If you have an electricity bill, a letter from the bank, or an SMS you would like me to check, please share it and I will explain it in plain, simple words.';
}
