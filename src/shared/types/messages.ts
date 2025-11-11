import type { CanonicalKey } from './profile';

export type BgCommand = 'fill-field' | 'fill-form';

export type MessageToContent =
  | { type: 'FILL_ONE'; payload: { profileId: string | null } }
  | { type: 'FILL_FORM'; payload: { profileId: string | null } }
  | { type: 'TOAST'; payload: { message: string; variant?: 'success' | 'error' | 'info' } }
  | { type: 'RECORD_CAPTURE'; payload: { mode: 'form' | 'field' } };

export type MessageToBackground =
  | { type: 'REQUEST_FILL_ONE' }
  | { type: 'REQUEST_FILL_FORM' }
  | { type: 'GET_ACTIVE_PROFILE_ID' }
  | { type: 'AI_CLASSIFY'; payload: { context: FieldContext } }
  | { type: 'PING' };

export type FieldContext = {
  tag: string;
  type?: string;
  autocomplete?: string;
  name?: string;
  id?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  ariaLabel?: string;
  nearbyText?: string;
};

export type AiClassifierResponse =
  | { ok: true; key: CanonicalKey }
  | { ok: false; error: string };


