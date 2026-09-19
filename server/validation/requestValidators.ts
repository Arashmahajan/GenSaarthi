import {
  LIMITS,
  ALLOWED_IMAGE_MIME_TYPES,
  AllowedImageMimeType,
} from '../config';
import {
  CheckRequest,
  ChatRequest,
  MedicineExplainerRequest,
  PlanDayRequest,
  Language,
} from '../types';

export interface ValidationResult<T> {
  isValid: boolean;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
  };
  data?: T;
}

export interface ValidatedCheckData {
  text?: string;
  imageCleanBase64?: string;
  imageMimeType?: AllowedImageMimeType;
  language: Language;
  userName?: string;
}

export function validateCheckRequest(body: any): ValidationResult<ValidatedCheckData> {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Please provide a valid request body.',
        statusCode: 400,
      },
    };
  }

  const { text, image, language = 'en', userName } = body;

  const hasText = typeof text === 'string' && text.trim().length > 0;
  const hasImage = typeof image === 'string' && image.trim().length > 0;

  if (!hasText && !hasImage) {
    return {
      isValid: false,
      error: {
        code: 'MISSING_INPUT',
        message: 'Please provide either text or an image to check.',
        statusCode: 400,
      },
    };
  }

  if (hasText && text.length > LIMITS.MAX_TEXT_LENGTH) {
    return {
      isValid: false,
      error: {
        code: 'TEXT_TOO_LONG',
        message: `Text is too long. Please keep it under ${LIMITS.MAX_TEXT_LENGTH} characters.`,
        statusCode: 400,
      },
    };
  }

  let imageCleanBase64: string | undefined;
  let imageMimeType: AllowedImageMimeType | undefined;

  if (hasImage) {
    // Expected format: data:image/jpeg;base64,.... or data:image/png;base64,...
    const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      return {
        isValid: false,
        error: {
          code: 'INVALID_IMAGE_FORMAT',
          message: 'The image format is not recognized. Please use JPEG, PNG, or WebP.',
          statusCode: 400,
        },
      };
    }

    const detectedMime = match[1].toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(detectedMime as AllowedImageMimeType)) {
      return {
        isValid: false,
        error: {
          code: 'UNSUPPORTED_IMAGE_TYPE',
          message: 'Only JPEG, PNG, and WebP images are supported.',
          statusCode: 400,
        },
      };
    }
    imageMimeType = detectedMime as AllowedImageMimeType;

    const base64Data = match[2];
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch {
      return {
        isValid: false,
        error: {
          code: 'INVALID_IMAGE_DATA',
          message: 'The image data could not be processed. Please try another photo.',
          statusCode: 400,
        },
      };
    }

    if (buffer.length > LIMITS.MAX_IMAGE_SIZE_BYTES) {
      return {
        isValid: false,
        error: {
          code: 'IMAGE_TOO_LARGE',
          message: 'The photo is larger than 4 MB. Please try a smaller photo.',
          statusCode: 400,
        },
      };
    }

    imageCleanBase64 = base64Data;
  }

  const validLang: Language = language === 'hi' ? 'hi' : 'en';

  return {
    isValid: true,
    data: {
      text: hasText ? text.trim() : undefined,
      imageCleanBase64,
      imageMimeType,
      language: validLang,
      userName: typeof userName === 'string' ? userName.slice(0, 50).trim() : undefined,
    },
  };
}

export interface ValidatedChatData {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'model'; text: string }>;
  language: Language;
  userName?: string;
  stream: boolean;
}

export function validateChatRequest(body: any): ValidationResult<ValidatedChatData> {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Please provide a valid request body.',
        statusCode: 400,
      },
    };
  }

  const { message, conversationHistory, language = 'en', userName, stream = false } = body;

  if (typeof message !== 'string' || message.trim().length === 0) {
    return {
      isValid: false,
      error: {
        code: 'MISSING_MESSAGE',
        message: 'Please enter a question or message.',
        statusCode: 400,
      },
    };
  }

  if (message.length > LIMITS.MAX_CHAT_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: {
        code: 'MESSAGE_TOO_LONG',
        message: `Message is too long. Please keep it under ${LIMITS.MAX_CHAT_MESSAGE_LENGTH} characters.`,
        statusCode: 400,
      },
    };
  }

  const formattedHistory: Array<{ role: 'user' | 'model'; text: string }> = [];
  if (Array.isArray(conversationHistory)) {
    const sliced = conversationHistory.slice(-LIMITS.MAX_CHAT_HISTORY_TURNS);
    for (const item of sliced) {
      if (item && typeof item.text === 'string') {
        const role: 'user' | 'model' =
          item.role === 'model' || item.sender === 'saarthi' ? 'model' : 'user';
        formattedHistory.push({
          role,
          text: item.text.slice(0, LIMITS.MAX_CHAT_MESSAGE_LENGTH),
        });
      }
    }
  }

  return {
    isValid: true,
    data: {
      message: message.trim(),
      conversationHistory: formattedHistory,
      language: language === 'hi' ? 'hi' : 'en',
      userName: typeof userName === 'string' ? userName.slice(0, 50).trim() : undefined,
      stream: Boolean(stream),
    },
  };
}

export interface ValidatedMedicineData {
  medicineName: string;
  dosage?: string;
  instructions?: string;
  language: Language;
  userName?: string;
}

export function validateMedicineRequest(body: any): ValidationResult<ValidatedMedicineData> {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Please provide medicine details.',
        statusCode: 400,
      },
    };
  }

  const { medicineName, dosage, instructions, language = 'en', userName } = body;

  if (typeof medicineName !== 'string' || medicineName.trim().length === 0) {
    return {
      isValid: false,
      error: {
        code: 'MISSING_MEDICINE_NAME',
        message: 'Please enter the medicine name.',
        statusCode: 400,
      },
    };
  }

  if (medicineName.length > LIMITS.MAX_MEDICINE_NAME_LENGTH) {
    return {
      isValid: false,
      error: {
        code: 'MEDICINE_NAME_TOO_LONG',
        message: `Medicine name should be under ${LIMITS.MAX_MEDICINE_NAME_LENGTH} characters.`,
        statusCode: 400,
      },
    };
  }

  return {
    isValid: true,
    data: {
      medicineName: medicineName.trim(),
      dosage: typeof dosage === 'string' ? dosage.slice(0, 200).trim() : undefined,
      instructions: typeof instructions === 'string' ? instructions.slice(0, 300).trim() : undefined,
      language: language === 'hi' ? 'hi' : 'en',
      userName: typeof userName === 'string' ? userName.slice(0, 50).trim() : undefined,
    },
  };
}

export interface ValidatedPlanData {
  routinesOrNotes?: string;
  language: Language;
  userName?: string;
}

export function validatePlanRequest(body: any): ValidationResult<ValidatedPlanData> {
  const { routinesOrNotes, language = 'en', userName } = body || {};

  if (typeof routinesOrNotes === 'string' && routinesOrNotes.length > LIMITS.MAX_PLAN_TEXT_LENGTH) {
    return {
      isValid: false,
      error: {
        code: 'PLAN_TEXT_TOO_LONG',
        message: `Routines description is too long. Please keep it under ${LIMITS.MAX_PLAN_TEXT_LENGTH} characters.`,
        statusCode: 400,
      },
    };
  }

  return {
    isValid: true,
    data: {
      routinesOrNotes: typeof routinesOrNotes === 'string' ? routinesOrNotes.trim() : undefined,
      language: language === 'hi' ? 'hi' : 'en',
      userName: typeof userName === 'string' ? userName.slice(0, 50).trim() : undefined,
    },
  };
}
