// Brønnøysundregistrene API Types

export interface BrregEnhet {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: {
    kode: string;
    beskrivelse: string;
  };
  registreringsdatoEnhetsregisteret?: string;
  registrertIMvaregisteret?: boolean;
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte?: number;
  forretningsadresse?: {
    land: string;
    landkode: string;
    postnummer?: string;
    poststed?: string;
    adresse?: string[];
    kommune?: string;
    kommunenummer?: string;
  };
  beliggenhetsadresse?: {
    land: string;
    landkode: string;
    postnummer?: string;
    poststed?: string;
    adresse?: string[];
    kommune?: string;
    kommunenummer?: string;
  };
  stiftelsesdato?: string;
  institusjonellSektorkode?: {
    kode: string;
    beskrivelse: string;
  };
  registrertIForetaksregisteret?: boolean;
  registrertIStiftelsesregisteret?: boolean;
  registrertIFrivillighetsregisteret?: boolean;
  konkurs?: boolean;
  underAvvikling?: boolean;
  underTvangsavviklingEllerTvangsopplosning?: boolean;
  maalform?: string;
  hjemmeside?: string;
}

export interface BrregUnderenhet {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: {
    kode: string;
    beskrivelse: string;
  };
  overordnetEnhet?: string;
  oppstartsdato?: string;
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte?: number;
  beliggenhetsadresse?: {
    land: string;
    landkode: string;
    postnummer?: string;
    poststed?: string;
    adresse?: string[];
    kommune?: string;
    kommunenummer?: string;
  };
}

export interface BrregRolle {
  type: {
    kode: string;
    beskrivelse: string;
  };
  person?: {
    fornavn: string;
    etternavn?: string;
    fodselsdato?: string;
  };
  enhet?: {
    organisasjonsnummer: string;
    navn: string;
  };
  fratraadt?: boolean;
}

export interface BrregEnheterResponse {
  _embedded?: {
    enheter: BrregEnhet[];
  };
  _links?: {
    self: { href: string };
    next?: { href: string };
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface BrregUnderenheterResponse {
  _embedded?: {
    underenheter: BrregUnderenhet[];
  };
  _links?: {
    self: { href: string };
    next?: { href: string };
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface BrregRollerResponse {
  rollegrupper?: Array<{
    type: {
      kode: string;
      beskrivelse: string;
    };
    roller: BrregRolle[];
  }>;
}

export interface BrregOppdatering {
  oppdateringsid: number;
  dato: string;
  organisasjonsnummer: string;
  updateringer?: string[];
}

export interface BrregOppdateringerResponse {
  _embedded?: {
    oppdaterteEnheter?: BrregOppdatering[];
  };
  _links?: {
    self: { href: string };
    next?: { href: string };
  };
}

export interface BrregOrganisasjonsform {
  kode: string;
  beskrivelse: string;
  utgaatt?: boolean;
}

export interface BrregRolletype {
  kode: string;
  beskrivelse: string;
}
