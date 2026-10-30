export type ApplicationStatus =
  | 'DRAFT'
  | 'OCR_VERIFIED'
  | 'PAYMENT_PENDING'
  | 'SLOT_LOCKED'
  | 'REJECTED';

export type MaritalStatus = 'UNMARRIED' | 'DIVORCED' | 'WIDOWED';

export interface PartyDetails {
  fullName: string;
  dateOfBirth: string;
  mobileNumber: string;
  address: string;
  maritalStatus: MaritalStatus | '';
}

export interface CeremonyDetails {
  marriageDate: string;
  venue: string;
  sroDistrict: string;
}

export interface ApplicationDraft {
  groom: PartyDetails;
  bride: PartyDetails;
  ceremony: CeremonyDetails;
}

export type TimelineEventId =
  | 'APPLICATION_SUBMITTED'
  | 'OCR_PASSED'
  | 'FEE_PAID'
  | 'SLOT_SCHEDULED';

export interface TimelineEntry {
  id: TimelineEventId;
  timestamp: string;
}

export interface Appointment {
  applicationId: string;
  officeName: string;
  officeAddress: string;
  appointmentDate: string;
  timeSlot: string;
  gateEntryCode: string;
}
