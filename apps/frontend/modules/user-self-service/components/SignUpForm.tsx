/**
 * SignUpForm Component
 *
 * サインアップフォームコンポーネント。
 * User Story 1 (セルフサインアップとプロフィール確認) で使用。
 */

'use client';

import { useState, type FormEvent } from 'react';

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * サインアップフォームコンポーネント
 */
export function SignUpForm({ onSubmit, isSubmitting = false }: SignUpFormProps) {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    password: '',
    acceptedTerms: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // バリデーション
    const newErrors: Partial<Record<keyof SignUpFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '氏名を入力してください';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }

    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = '利用規約に同意してください';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="signup-form" className="signup-form">
      <div className="form-field">
        <label htmlFor="name">氏名 *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" className="error-message" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="email">メールアドレス *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" className="error-message" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="password">パスワード *</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isSubmitting}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" className="error-message" role="alert">
            {errors.password}
          </span>
        )}
        <small className="field-hint">8文字以上で入力してください</small>
      </div>

      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
            disabled={isSubmitting}
            aria-invalid={!!errors.acceptedTerms}
            aria-describedby={errors.acceptedTerms ? 'terms-error' : undefined}
          />
          <span>利用規約に同意する *</span>
        </label>
        {errors.acceptedTerms && (
          <span id="terms-error" className="error-message" role="alert">
            {errors.acceptedTerms}
          </span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="submit-button">
        {isSubmitting ? '登録中...' : '登録する'}
      </button>
    </form>
  );
}
