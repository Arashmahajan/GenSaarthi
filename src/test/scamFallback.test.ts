import { describe, it, expect } from 'vitest';
import { scanTextForScamSignals } from '../../server/fallbacks/scamScan';
import {
  extractLiteralRupeeAmount,
  extractLiteralDueDate,
  generateHonestFallbackCheck,
} from '../../server/fallbacks/documentScan';

describe('Scam Fallback Detection Logic', () => {
  it('detects utility disconnection scam with immediate threat and phone number', () => {
    const text = 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM. Call officer at 9876543210.';
    const result = scanTextForScamSignals(text, 'en');
    expect(result.risk).toBe('scam');
    expect(result.helpline).toBe('1930');
    expect(result.detectedSignals.strong).toContain('utility_disconnection');
  });

  it('detects digital arrest and police extortion threat', () => {
    const text = 'This is CBI officer. A parcel with drugs was seized in your name. Digital arrest warrant issued. Transfer money immediately to avoid arrest.';
    const result = scanTextForScamSignals(text, 'en');
    expect(result.risk).toBe('scam');
    expect(result.detectedSignals.strong).toContain('arrest_extortion');
  });

  it('does NOT trigger arrest signal for benign medical or cultural terms', () => {
    const text1 = 'Grandpa suffered a sudden cardiac arrest last year and is in recovery.';
    const result1 = scanTextForScamSignals(text1, 'en');
    expect(result1.detectedSignals.strong).not.toContain('arrest_extortion');
    expect(result1.risk).not.toBe('scam');

    const text2 = 'Watched an episode of arrested development on TV with family.';
    const result2 = scanTextForScamSignals(text2, 'en');
    expect(result2.detectedSignals.strong).not.toContain('arrest_extortion');
    expect(result2.risk).not.toBe('scam');
  });

  it('detects new-number family emergency scam', () => {
    const text = 'Hi Papa, lost my phone, this is my new number. Need urgent money send 5000 via UPI.';
    const result = scanTextForScamSignals(text, 'en');
    expect(result.risk).toBe('scam');
    expect(result.detectedSignals.strong).toContain('family_impersonation');
  });

  it('detects part-time job review / like task scam', () => {
    const text = 'Earn daily Rs 3000 per day by giving like and subscribe on YouTube and join our Telegram group.';
    const result = scanTextForScamSignals(text, 'en');
    expect(result.risk).toBe('scam');
    expect(result.detectedSignals.strong).toContain('job_task_scam');
  });

  it('supports Hindi and Hinglish scam detection', () => {
    const hinglish = 'Aapka bijli connection aaj raat cut ho jayega. Turant call karein 9876543210.';
    const resultHinglish = scanTextForScamSignals(hinglish, 'hi');
    expect(resultHinglish.risk).toBe('scam');

    const hindi = 'आपका बिजली कनेक्शन आज रात काट दिया जाएगा। तुरंत कॉल करें 9876543210.';
    const resultHindi = scanTextForScamSignals(hindi, 'hi');
    expect(resultHindi.risk).toBe('scam');
  });

  it('marks long gibberish or unrecognizable text as careful', () => {
    const gibberish = 'qwxzjk lmpqrtv bnmzqwxy zkljvhgf dsqwertyuiopasdfghjkl zxcvbnm qwertyui';
    const result = scanTextForScamSignals(gibberish, 'en');
    expect(result.risk).toBe('careful');
  });
});

describe('Document Fact Extraction Fallbacks', () => {
  it('extracts literal rupee amount matching Indian bill labels', () => {
    const text1 = 'BESCOM Bill\nTotal Due: Rs. 1,450.50\nBill Date: 12 Jan 2026';
    expect(extractLiteralRupeeAmount(text1)).toBe('Rs. 1,450.50');

    const text2 = 'Net Amount Payable: ₹ 12,345\nDue: 15-Mar-2026';
    expect(extractLiteralRupeeAmount(text2)).toBe('₹ 12,345');

    const text3 = 'Bill Amount: INR 1,23,456.00';
    expect(extractLiteralRupeeAmount(text3)).toBe('INR 1,23,456.00');

    const textZero = 'Total Due: NIL';
    expect(extractLiteralRupeeAmount(textZero)).toBe('Rs 0');
  });

  it('does not confuse phone numbers with amounts', () => {
    const textPhone = 'Call helpline 9876543210 for assistance. No dues mentioned.';
    expect(extractLiteralRupeeAmount(textPhone)).toBeNull();
  });

  it('extracts literal due date with label requirement and skips bill dates', () => {
    const bill = 'Bill Date: 10 Jan 2026\nDue Date: 28 Feb 2026\nReading Date: 05 Jan 2026';
    expect(extractLiteralDueDate(bill)).toBe('28 Feb 2026');

    const payBy = 'Pay by 15-Mar-2026 to avoid penalty.';
    expect(extractLiteralDueDate(payBy)).toBe('15-Mar-2026');

    const hindiBill = 'बिल दिनांक: 10 Jan 2026\nदेय तिथि: 15 मार्च 2026';
    expect(extractLiteralDueDate(hindiBill)).toBe('15 मार्च 2026');

    const onlyBillDate = 'Bill Date: 12-01-2026 (only bill date, no due date)';
    expect(extractLiteralDueDate(onlyBillDate)).toBeNull();
  });

  it('honest fallback check on empty text returns careful with clear guidance', () => {
    const fallback = generateHonestFallbackCheck('', 'en');
    expect(fallback.risk).toBe('careful');
    expect(fallback.title).toBe('I could not read this photo');
    expect(fallback.steps).toContain('Type or paste the message text here to check it');
    expect(fallback.source).toBe('fallback');
  });
});
