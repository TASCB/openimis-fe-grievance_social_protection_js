import { EXTERNAL_REPORTER_TYPE } from '../constants';

export const externalReporterLocationFieldNames = {
  region: 'externalReporterRegion',
  district: 'externalReporterDistrict',
  ward: 'externalReporterWard',
  village: 'externalReporterVillage',
  eventLocation: 'externalReporterLocation',
};

export function normalizeReporterType(value) {
  return (value ?? '').toString().trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function isExternalReporterType(value) {
  return [EXTERNAL_REPORTER_TYPE, 'externalreporter'].includes(normalizeReporterType(value));
}

export function getReporterType(ticket = {}) {
  return ticket.reporterTypeName ?? ticket.reporterType ?? null;
}

export function parseSerializedReporter(reporter) {
  if (!reporter) return null;
  if (typeof reporter !== 'string') return reporter;
  try {
    const parsedReporter = JSON.parse(reporter || '{}');
    return typeof parsedReporter === 'string'
      ? JSON.parse(parsedReporter || '{}')
      : parsedReporter;
  } catch (e) {
    return null;
  }
}

export function isExternalReporter(ticket = {}) {
  return isExternalReporterType(getReporterType(ticket));
}

export function isKnownRegistryReporterType(value) {
  return ['individual', 'beneficiary', 'user'].includes(normalizeReporterType(value));
}

export function isUsablePhone(phone) {
  if (!/^\+?[0-9][0-9\s().-]*$/.test(phone || "")) return false;
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  return new Set(digits).size > 1;
}

export function isValidOptionalEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function externalReporterValidationErrorIds(ticket = {}) {
  const errors = [];
  if (!String(ticket.externalReporterFirstName || '').trim()) {
    errors.push('ticket.externalReporter.validation.firstName');
  }
  if (!String(ticket.externalReporterLastName || '').trim()) {
    errors.push('ticket.externalReporter.validation.lastName');
  }
  const phone = String(ticket.externalReporterPhone || '').trim();
  if (!phone) {
    errors.push('ticket.externalReporter.validation.phone');
  } else if (!isUsablePhone(phone)) {
    errors.push('ticket.externalReporter.validation.phoneInvalid');
  }
  const email = String(ticket.externalReporterEmail || '').trim();
  if (!isValidOptionalEmail(email)) {
    errors.push('ticket.externalReporter.validation.emailInvalid');
  }
  if (!ticket.externalReporterRegion) {
    errors.push('ticket.externalReporter.validation.region');
  }
  if (!ticket.externalReporterDistrict) {
    errors.push('ticket.externalReporter.validation.district');
  }
  if (!ticket.externalReporterWard) {
    errors.push('ticket.externalReporter.validation.ward');
  }
  if (!ticket.externalReporterVillage) {
    errors.push('ticket.externalReporter.validation.village');
  }
  return errors;
}

export function clearExternalReporterFields(ticket = {}) {
  return {
    ...ticket,
    externalReporterFirstName: null,
    externalReporterLastName: null,
    externalReporterPhone: null,
    externalReporterEmail: null,
    externalReporterRegion: null,
    externalReporterDistrict: null,
    externalReporterWard: null,
    externalReporterVillage: null,
    externalReporterLocation: null,
  };
}
