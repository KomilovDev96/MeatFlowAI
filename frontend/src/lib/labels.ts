import i18n from '../i18n';

export function statusLabel(value?: string | null) {
  if (!value) return '';
  return i18n.t(`status.${value}`, { defaultValue: value });
}

export function roleLabel(value?: string | null) {
  if (!value) return '';
  return i18n.t(`roles.${value}`, { defaultValue: value });
}

export function unitLabel(value?: string | null) {
  if (!value) return '';
  return i18n.t(`units.${value}`, { defaultValue: value });
}

export function paymentTypeLabel(value?: string | null) {
  if (!value) return '';
  return i18n.t(`orderType.${value}`, { defaultValue: value });
}

export function paymentMethodLabel(value?: string | null) {
  if (!value) return '';
  return i18n.t(`paymentMethod.${value}`, { defaultValue: value });
}

export function actionLabel(value?: string | null) {
  if (!value) return '';
  return i18n.t(`actions.${value}`, { defaultValue: value });
}
