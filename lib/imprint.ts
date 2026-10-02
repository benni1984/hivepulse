/**
 * The operator's details for the Impressum, required by § 5 DDG (formerly § 5 TMG) for any
 * German commercial website, and by Apple and Google before an app may be listed.
 *
 * Fill these in once. While any required field is empty, /impressum answers 404 and the
 * footer shows no link — an Impressum with blank mandatory fields is worse than none, since
 * it is the one page that must be correct.
 *
 * Required: name, street, city, email. A phone number is not strictly required as long as a
 * second fast channel exists, but it removes any argument, so leave it in if you have one.
 */
export interface ImprintDetails {
  /** Full legal name, or company name plus legal form. */
  name: string;
  /** Street and house number — a PO box is not sufficient. */
  street: string;
  /** Postal code and town. */
  city: string;
  /** Country, spelled out. */
  country: string;
  /** An address that is read, not a contact form. */
  email: string;
  /** Optional. */
  phone: string;
  /** Optional, only if a VAT ID exists (§ 27a UStG). */
  vatId: string;
}

export const IMPRINT: ImprintDetails = {
  name: 'Benjamin Müller',
  street: 'Sonnhaldenweg 5D',
  city: '4450 Sissach',
  country: 'Schweiz',
  email: 'hivepulse@multihead.de',
  phone: '',
  vatId: '',
};

const REQUIRED: (keyof ImprintDetails)[] = ['name', 'street', 'city', 'country', 'email'];

export function imprintIsComplete(details: ImprintDetails = IMPRINT): boolean {
  return REQUIRED.every(field => details[field].trim().length > 0);
}

/** The fields still to fill in — used by the test that reminds us this is pending. */
export function missingImprintFields(details: ImprintDetails = IMPRINT): string[] {
  return REQUIRED.filter(field => details[field].trim().length === 0);
}
