import { Request } from 'express';
import { UserRole } from '../generated/prisma';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT Payload
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

// CDD Determination Result
export interface CDDDeterminationResult {
  level: 'SIMPLIFIED' | 'STANDARD' | 'ENHANCED';
  reason: string;
  legalReferences: string[];
  triggers?: CDDTriggerInfo[];
}

export interface CDDTriggerInfo {
  triggerType: string;
  description: string;
  legalReference: string;
}

// Risk Assessment Result
export interface RiskAssessmentResult {
  rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';
  score: number;
  factors: RiskFactorInfo[];
}

export interface RiskFactorInfo {
  category: string;
  description: string;
  points: number;
}

// NZBN API Types
export interface NZBNSearchResult {
  nzbn: string;
  entityName: string;
  entityTypeName: string;
  entityStatusDescription: string;
  registrationDate?: string;
}

export interface NZBNEntity {
  nzbn: string;
  entityName: string;
  tradingName?: string;
  entityTypeCode: string;
  entityTypeName: string;
  entityStatusCode: string;
  entityStatusDescription: string;
  registrationDate?: string;
  annualReturnFilingMonth?: number;
  addresses?: NZBNAddress[];
  directors?: NZBNDirector[];
  shareholders?: NZBNShareholder[];
}

export interface NZBNAddress {
  addressType: string;
  address1: string;
  address2?: string;
  address3?: string;
  address4?: string;
  postCode?: string;
  countryCode: string;
}

export interface NZBNDirector {
  directorNumber: string;
  fullName: string;
  appointmentDate?: string;
  residentialAddress?: NZBNAddress;
}

export interface NZBNShareholder {
  shareholderName: string;
  shareholderType: string;
  numberOfShares?: number;
  allocationDate?: string;
}

// Simplified CDD Eligibility Check Result
export interface SimplifiedCDDResult {
  eligible: boolean;
  reason: string;
  legalReference: string;
}

// Enhanced CDD Check Result
export interface EnhancedCDDResult {
  required: boolean;
  triggers: string[];
  legalReferences: string[];
}

// Country Risk Info
export interface CountryRiskInfo {
  countryCode: string;
  countryName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isFATFMember: boolean;
  isFATFHighRisk: boolean;
  fatfStatus?: string;
}

// Application Statistics
export interface ApplicationStats {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  returned: number;
  rejected: number;
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
