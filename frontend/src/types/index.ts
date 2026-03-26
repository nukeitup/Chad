// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export type UserRole = 'SPECIALIST' | 'TEAM_MANAGER' | 'COMPLIANCE_OFFICER' | 'ADMIN';

// Entity types
export interface Entity {
  id: string;
  entityType: EntityType;
  legalName: string;
  tradingName?: string;
  nzbn?: string;
  companyNumber?: string;
  overseasRegistrationNumber?: string;
  countryOfIncorporation: string;
  incorporationDate?: string;
  anzsicCode?: string;
  anzsicDescription?: string;
  entityStatus: EntityStatus;
  registeredStreet?: string;
  registeredCity?: string;
  registeredPostcode?: string;
  registeredCountry?: string;
  businessStreet?: string;
  businessCity?: string;
  businessPostcode?: string;
  businessCountry?: string;
  isListedIssuer?: boolean;
  listedExchange?: string;
  createdAt: string;
  updatedAt: string;
}

export type EntityType =
  | 'NZ_COMPANY'
  | 'NZ_LIMITED_PARTNERSHIP'
  | 'NZ_LOCAL_AUTHORITY'
  | 'NZ_STATE_ENTERPRISE'
  | 'NZ_PUBLIC_SERVICE_AGENCY'
  | 'NZ_GOVT_DEPARTMENT'
  | 'NZ_LISTED_ISSUER'
  | 'OVERSEAS_COMPANY'
  | 'TRUST'
  | 'FOUNDATION';

export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'STRUCK_OFF' | 'LIQUIDATION';

// Application types
export interface CDDApplication {
  id: string;
  applicationNumber: string;
  entityId: string;
  entity?: Entity;
  applicationType: ApplicationType;
  cddLevel: CDDLevel;
  cddLevelJustification?: string;
  workflowState: WorkflowState;
  riskRating?: RiskRating;
  riskScore?: number;
  riskRatingJustification?: string;
  assignedSpecialistId?: string;
  assignedSpecialist?: User;
  assignedApproverId?: string;
  assignedApprover?: User;
  approvedById?: string;
  approvedBy?: User;
  submittedDate?: string;
  approvedDate?: string;
  returnedDate?: string;
  returnedReason?: string;
  rejectedDate?: string;
  rejectedReason?: string;
  beneficialOwners?: BeneficialOwner[];
  personsActingOnBehalf?: PersonActingOnBehalf[];
  documents?: Document[];
  cddTriggers?: CDDTrigger[];
  riskFactors?: RiskFactor[];
  createdAt: string;
  updatedAt: string;
}

export type ApplicationType = 'NEW_CUSTOMER' | 'EXISTING_UPLIFT';
export type CDDLevel = 'SIMPLIFIED' | 'STANDARD' | 'ENHANCED';
export type WorkflowState = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'RETURNED' | 'APPROVED' | 'REJECTED';
export type RiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';

// Person types
export interface Person {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  residentialStreet?: string;
  residentialCity?: string;
  residentialPostcode?: string;
  residentialCountry?: string;
  nationality?: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  idDocumentExpiry?: string;
  idDocumentCountry?: string;
  pepStatus: PEPStatus;
  pepDetails?: string;
  sanctionsScreeningResult?: string;
  sanctionsScreeningDate?: string;
}

export type PEPStatus = 'NOT_PEP' | 'DOMESTIC_PEP' | 'FOREIGN_PEP' | 'INTERNATIONAL_ORG_PEP';

// Beneficial Owner types
export interface BeneficialOwner {
  id: string;
  applicationId: string;
  entityId: string;
  personId: string;
  person?: Person;
  ownershipBasis: OwnershipBasis[];
  ownershipPercentage?: number;
  indirectOwnershipPath?: string;
  isNominee: boolean;
  nomineeForPersonId?: string;
  verificationStatus: VerificationStatus;
  verifiedDate?: string;
  verifiedById?: string;
  verifiedBy?: User;
  verificationNotes?: string;
  documents?: Document[];
}

export type OwnershipBasis = 'ULTIMATE_OWNERSHIP' | 'EFFECTIVE_CONTROL' | 'PERSON_ON_WHOSE_BEHALF';
export type VerificationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED';

// Person Acting on Behalf types
export interface PersonActingOnBehalf {
  id: string;
  applicationId: string;
  personId: string;
  person?: Person;
  roleTitle: string;
  authorityDocumentType?: string;
  authorityDocumentRef?: string;
  verificationStatus: VerificationStatus;
  verifiedDate?: string;
  verifiedById?: string;
  verifiedBy?: User;
  verificationNotes?: string;
  documents?: Document[];
}

// Document types
export interface Document {
  id: string;
  applicationId: string;
  beneficialOwnerId?: string;
  poabocId?: string;
  documentType: string;
  documentCategory: DocumentCategory;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploadedById: string;
  uploadedBy?: User;
}

export type DocumentCategory =
  | 'ENTITY_IDENTIFICATION'
  | 'BENEFICIAL_OWNER_ID'
  | 'POABOC_ID'
  | 'AUTHORITY_DOCUMENT'
  | 'SOURCE_OF_WEALTH'
  | 'SOURCE_OF_FUNDS'
  | 'OTHER';

// CDD Trigger types
export interface CDDTrigger {
  id: string;
  applicationId: string;
  triggerType: string;
  triggerDescription: string;
  legalReference: string;
}

// Risk Factor types
export interface RiskFactor {
  id: string;
  applicationId: string;
  factorCategory: string;
  factorDescription: string;
  riskPoints: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Dashboard Statistics
export interface ApplicationStats {
  total: number;
  byStatus: {
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    returned: number;
    rejected: number;
  };
  byRiskRating: {
    low: number;
    medium: number;
    high: number;
    prohibited: number;
  };
  byCDDLevel: {
    simplified: number;
    standard: number;
    enhanced: number;
  };
}

// NZBN Search types
export interface NZBNSearchResult {
  nzbn: string;
  entityName: string;
  entityTypeDescription: string;  // NZBN API v5 field name
  entityTypeName?: string;         // legacy alias — may be undefined
  entityStatusDescription: string;
  registrationDate?: string;
  tradingNames?: { name: string }[];
}
