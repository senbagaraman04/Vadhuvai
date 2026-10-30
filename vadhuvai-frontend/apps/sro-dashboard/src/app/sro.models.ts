export interface SroApplication {
  id: string;
  applicationId: string;
  status: string;
  groomName: string;
  groomDob: string;
  groomMobile: string;
  brideName: string;
  brideDob: string;
  brideMobile: string;
  marriageDate: string;
  venueDetails: string;
  sroDistrict: string;
  appointmentSlot: string | null;
  ocrVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SroReview {
  application: SroApplication;
  documentUrls: string[];
  ocrMatchConfidenceScores: Record<string, number>;
  flags: string[];
  officerRemarks: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface SroQueue {
  content: SroReview[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface SroDecision {
  officerRemarks: string;
  digitalSignatureHash: string;
  approved: boolean;
}