export interface SroOffice {
  /** Value stored on the ceremony district selection. */
  code: string;
  district: string;
  officeName: string;
  address: string;
}

/** Mock SRO master data. Replace with the SRO directory once it is available. */
export const SRO_OFFICES: readonly SroOffice[] = [
  {
    code: 'CHN',
    district: 'Chennai',
    officeName: 'Sub-Registrar Office, Chennai North',
    address: 'Address from SRO master data',
  },
  {
    code: 'CBE',
    district: 'Coimbatore',
    officeName: 'Sub-Registrar Office, Coimbatore North',
    address: 'Address from SRO master data',
  },
  {
    code: 'MDU',
    district: 'Madurai',
    officeName: 'Sub-Registrar Office, Madurai North',
    address: 'Address from SRO master data',
  },
  {
    code: 'TRY',
    district: 'Tiruchirappalli',
    officeName: 'Sub-Registrar Office, Tiruchirappalli',
    address: 'Address from SRO master data',
  },
  {
    code: 'SLM',
    district: 'Salem',
    officeName: 'Sub-Registrar Office, Salem',
    address: 'Address from SRO master data',
  },
  {
    code: 'TVL',
    district: 'Tirunelveli',
    officeName: 'Sub-Registrar Office, Tirunelveli',
    address: 'Address from SRO master data',
  },
  {
    code: 'ERD',
    district: 'Erode',
    officeName: 'Sub-Registrar Office, Erode',
    address: 'Address from SRO master data',
  },
  {
    code: 'VLR',
    district: 'Vellore',
    officeName: 'Sub-Registrar Office, Vellore',
    address: 'Address from SRO master data',
  },
];

export const APPOINTMENT_TIME_SLOT = '10:30 AM - 11:00 AM';
