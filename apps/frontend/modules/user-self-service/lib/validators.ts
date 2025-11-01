/**
 * User Self-Service Validators
 *
 * セルフサービスモジュールで使用するバリデーション関数群。
 */

/**
 * メールアドレスの形式を検証する
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * パスワードの強度を検証する
 * 最低8文字以上
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * パスワードの詳細な強度を検証する
 * - 最低8文字
 * - 大文字、小文字、数字を含む
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('8文字以上で入力してください');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('大文字を1文字以上含めてください');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('小文字を1文字以上含めてください');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('数字を1文字以上含めてください');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 氏名を検証する
 */
export function validateName(name: string): boolean {
  return name.trim().length > 0;
}
