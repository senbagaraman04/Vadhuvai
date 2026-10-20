// 1. Core Application State Machine
export type ApplicationState = 
  | 'DRAFT'
  | 'DOCUMENT_VERIFIED'
  | 'PAYMENT_PENDING'
  | 'SLOT_LOCKED'
  | 'SRO_APPROVED';

// 2. Applicant & Ceremony Particulars
export interface ApplicantDetails {
  brideName: string;
  brideDob: string;
  brideMobile: string;
  groomName: string;
  groomDob: string;
  groomMobile: string;
  marriageDate: string;
  sroDistrict: string;
}

// 3. Complete Registration Payload
export interface RegistrationApplication {
  applicationId: string;
  status: ApplicationState;
  details: ApplicantDetails;
  ocrVerified: boolean;
  createdAt: string;
  updatedAt: string;
}