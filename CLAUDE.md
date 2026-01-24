# AML/CFT Entity Onboarding Compliance Application
## Claude Code Build Guide

**Version:** 1.0  
**Date:** January 24, 2026  
**Purpose:** Complete technical design specification and wireframes for Claude Code development

---

## Executive Summary

This application automates Customer Due Diligence (CDD) for entity onboarding in Business and Corporate Banking, ensuring full compliance with New Zealand's Anti-Money Laundering and Countering Financing of Terrorism Act 2009 (AML/CFT Act).

### Core Functionality
- **Input:** Business name or NZBN
- **Output:** Complete CDD requirements checklist with legislative references
- **Key Feature:** Automated determination of Simplified, Standard, or Enhanced CDD requirements

---

## High-Level Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Dashboard  │  │   Workflow   │  │   Approval Queue     │  │
│  │              │  │   Screens    │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ CDD Determination│ │ Risk Engine  │  │ Workflow Manager │    │
│  │     Engine      │  │              │  │                  │    │
│  └────────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Integration Layer                           │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  NZBN API      │  │ FATF Data    │  │ Document Storage │    │
│  │  (Companies    │  │ (High-Risk   │  │ (Encrypted)      │    │
│  │   Office)      │  │  Countries)  │  │                  │    │
│  └────────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             PostgreSQL / SQL Server Database              │   │
│  │  • Entities  • Beneficial Owners  • CDD Applications     │   │
│  │  • Documents • Audit Logs         • Reference Data       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework:** React 18+ with TypeScript
- **UI Library:** Material-UI (MUI) v5
- **State Management:** Redux Toolkit + RTK Query
- **Form Management:** React Hook Form + Zod validation
- **Routing:** React Router v6
- **Charts/Visualization:** Recharts (for risk assessment visualization)

### Backend
- **Framework:** Node.js with Express.js OR .NET Core 8
- **API Design:** RESTful API with OpenAPI 3.0 documentation
- **Authentication:** JWT with OAuth 2.0
- **Authorization:** Role-based access control (RBAC)

### Database
- **Primary:** PostgreSQL 15+ (preferred) or SQL Server 2019+
- **ORM:** Prisma (Node.js) or Entity Framework Core (.NET)
- **Migrations:** Database migration scripts versioned with application

### Document Storage
- **Storage:** AWS S3 / Azure Blob Storage with server-side encryption
- **Access:** Pre-signed URLs with 1-hour expiration
- **Scanning:** ClamAV for virus scanning on upload

### DevOps
- **Containerization:** Docker
- **Orchestration:** Kubernetes or Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Application Insights / CloudWatch

---

## Data Model

### Core Entities

```typescript
// Entity (Customer)
interface Entity {
  id: string;
  entityType: 'NZ_COMPANY' | 'OVERSEAS_COMPANY' | 'NZ_LIMITED_PARTNERSHIP' | 'TRUST' | 'FOUNDATION';
  legalName: string;
  nzbn?: string; // 13 digits
  overseasRegistrationNumber?: string;
  countryOfIncorporation: string;
  incorporationDate: Date;
  registeredAddress: Address;
  principalPlaceOfBusiness?: Address;
  entityStatus: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

// CDD Application
interface CDDApplication {
  id: string;
  entityId: string;
  applicationType: 'NEW_CUSTOMER' | 'EXISTING_UPLIFT';
  cddLevel: 'SIMPLIFIED' | 'STANDARD' | 'ENHANCED';
  cddLevelJustification: string;
  workflowState: 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'APPROVED' | 'REJECTED';
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';
  riskRatingJustification: string;
  naturePurposeRelationship: string;
  anticipatedMonthlyVolume: number;
  anticipatedMonthlyValue: number; // NZD
  productsRequested: string[]; // Array of product types
  assignedSpecialistId: string;
  assignedApproverId?: string;
  submittedDate?: Date;
  approvedDate?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Beneficial Owner
interface BeneficialOwner {
  id: string;
  applicationId: string;
  entityId: string;
  personId: string;
  ownershipBasis: ('ULTIMATE_OWNERSHIP' | 'EFFECTIVE_CONTROL' | 'PERSON_ON_WHOSE_BEHALF')[];
  ownershipPercentage?: number; // 0-100
  indirectOwnershipPath?: string;
  isNominee: boolean;
  nomineeForPersonId?: string;
  verificationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'VERIFIED';
  verifiedDate?: Date;
  verifiedBy?: string;
}

// Person (Natural Person)
interface Person {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  residentialAddress: Address;
  nationality: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  idDocumentExpiry?: Date;
  idDocumentCountry?: string;
  pepStatus: 'NOT_PEP' | 'DOMESTIC_PEP' | 'FOREIGN_PEP' | 'INTERNATIONAL_ORG_PEP';
  sanctionsScreeningResult?: string;
  sanctionsScreeningDate?: Date;
}

// Person Acting on Behalf (POABOC)
interface PersonActingOnBehalf {
  id: string;
  applicationId: string;
  personId: string;
  roleTitle: string;
  authorityDocumentType?: string;
  authorityDocumentReference?: string;
  verificationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'VERIFIED';
  verifiedDate?: Date;
  verifiedBy?: string;
}

// Document
interface Document {
  id: string;
  applicationId: string;
  beneficialOwnerId?: string;
  poabocId?: string;
  documentType: string;
  documentCategory: string;
  fileName: string;
  filePath: string; // Encrypted storage location
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  uploadedBy: string;
}

// Address
interface Address {
  street: string;
  city: string;
  postcode: string;
  country: string;
}

// Audit Log
interface AuditLog {
  id: string;
  applicationId?: string;
  userId: string;
  timestamp: Date;
  actionType: string;
  tableAffected: string;
  recordIdAffected: string;
  oldValue?: object;
  newValue?: object;
  ipAddress: string;
  sessionId: string;
}
```

---

## CDD Determination Logic

### Simplified CDD Criteria (Section 18, AML/CFT Act)

```typescript
/**
 * Determines if entity qualifies for Simplified CDD
 * Returns: { eligible: boolean, reason: string, legalReference: string }
 */
function isSimplifiedCDDEligible(entity: Entity): SimplifiedCDDResult {
  const eligibleEntityTypes = [
    'Listed issuer on NZ stock exchange (NZX)',
    'Listed issuer on approved overseas exchange',
    'NZ public service agency',
    'NZ local authority',
    'NZ state enterprise',
    'NZ government department',
    'Subsidiary of listed company (verified)',
    'Overseas government body (FATF member country)'
  ];
  
  // Check NZBN data for NZ entities
  if (entity.nzbn) {
    const nzbnData = await fetchNZBNData(entity.nzbn);
    
    // Check if listed issuer
    if (nzbnData.isListedIssuer && nzbnData.exchange === 'NZX') {
      return {
        eligible: true,
        reason: 'Listed Issuer - NZX',
        legalReference: 'Section 18(1)(a), AML/CFT Act 2009'
      };
    }
    
    // Check if public service agency
    if (nzbnData.entityType === 'PUBLIC_SERVICE_AGENCY') {
      return {
        eligible: true,
        reason: 'NZ Public Service Agency',
        legalReference: 'Section 18(1)(b), AML/CFT Act 2009'
      };
    }
    
    // Check if local authority
    if (nzbnData.entityType === 'LOCAL_AUTHORITY') {
      return {
        eligible: true,
        reason: 'NZ Local Authority',
        legalReference: 'Section 18(1)(c), AML/CFT Act 2009'
      };
    }
    
    // Check if state enterprise
    if (nzbnData.entityType === 'STATE_ENTERPRISE') {
      return {
        eligible: true,
        reason: 'NZ State Enterprise',
        legalReference: 'Section 18(1)(d), AML/CFT Act 2009'
      };
    }
  }
  
  // Check overseas entities
  if (entity.countryOfIncorporation !== 'NZ') {
    const fatfMember = await isFATFMemberCountry(entity.countryOfIncorporation);
    
    if (entity.entityType === 'GOVERNMENT_BODY' && fatfMember) {
      return {
        eligible: true,
        reason: 'Overseas Government Body (FATF Member)',
        legalReference: 'Section 18(1)(e), AML/CFT Act 2009'
      };
    }
  }
  
  return {
    eligible: false,
    reason: 'Does not meet Simplified CDD criteria',
    legalReference: 'Standard CDD required per Section 14-17, AML/CFT Act 2009'
  };
}
```

### Enhanced CDD Triggers (Section 22, AML/CFT Act)

```typescript
/**
 * Determines if Enhanced CDD is required
 * Returns: { required: boolean, triggers: string[], legalReferences: string[] }
 */
function isEnhancedCDDRequired(
  entity: Entity, 
  beneficialOwners: BeneficialOwner[],
  riskFactors: RiskFactors
): EnhancedCDDResult {
  const triggers: string[] = [];
  const legalReferences: string[] = [];
  
  // Check country risk
  const countryRisk = await getCountryRisk(entity.countryOfIncorporation);
  if (countryRisk === 'HIGH') {
    triggers.push('Entity from FATF high-risk jurisdiction');
    legalReferences.push('Section 22(1)(a), AML/CFT Act 2009');
  }
  
  // Check ownership complexity
  const ownershipLayers = calculateOwnershipLayers(beneficialOwners);
  if (ownershipLayers > 3) {
    triggers.push(`Complex ownership structure (${ownershipLayers} layers)`);
    legalReferences.push('Section 22(1)(b), RBNZ Enhanced CDD Guideline April 2024');
  }
  
  // Check for nominee arrangements
  const hasNominees = beneficialOwners.some(bo => bo.isNominee);
  if (hasNominees) {
    triggers.push('Nominee shareholder or director arrangement present');
    legalReferences.push('Regulation 12, AML/CFT Regulations 2011 (as amended June 2024)');
  }
  
  // Check for PEPs
  const hasPEP = await checkForPEPs(beneficialOwners);
  if (hasPEP) {
    triggers.push('Politically Exposed Person (PEP) involved');
    legalReferences.push('Section 22(1)(d), AML/CFT Act 2009');
  }
  
  // Check if personal asset holding vehicle
  if (entity.entityType === 'TRUST' || riskFactors.personalAssetVehicle) {
    triggers.push('Entity is vehicle for holding personal assets');
    legalReferences.push('Section 22(1)(c), AML/CFT Act 2009');
  }
  
  // Check for bearer shares
  if (riskFactors.bearerShares) {
    triggers.push('Bearer shares identified');
    legalReferences.push('Section 22(1)(e), RBNZ Enhanced CDD Guideline April 2024');
  }
  
  // Non-resident from insufficient AML/CFT country
  if (!entity.nzbn && countryRisk === 'INSUFFICIENT_AML_CFT') {
    triggers.push('Non-resident customer from country with insufficient AML/CFT systems');
    legalReferences.push('Section 22(1)(f), AML/CFT Act 2009');
  }
  
  return {
    required: triggers.length > 0,
    triggers,
    legalReferences: [...new Set(legalReferences)] // Remove duplicates
  };
}
```

### Risk Rating Calculation

```typescript
/**
 * Calculates overall risk rating based on multiple factors
 * Returns: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED'
 */
function calculateRiskRating(
  entity: Entity,
  beneficialOwners: BeneficialOwner[],
  products: string[],
  relationship: RelationshipInfo
): RiskRating {
  let riskScore = 0;
  const factors: string[] = [];
  
  // Entity risk factors (0-30 points)
  if (entity.entityType === 'TRUST') {
    riskScore += 15;
    factors.push('Entity type: Trust (higher risk)');
  } else if (entity.entityType === 'FOUNDATION') {
    riskScore += 10;
    factors.push('Entity type: Foundation');
  }
  
  const ownershipLayers = calculateOwnershipLayers(beneficialOwners);
  if (ownershipLayers > 3) {
    riskScore += 15;
    factors.push(`Complex ownership: ${ownershipLayers} layers`);
  } else if (ownershipLayers > 1) {
    riskScore += 5;
    factors.push(`Moderate ownership complexity: ${ownershipLayers} layers`);
  }
  
  // Geographic risk factors (0-30 points)
  const countryRisk = await getCountryRisk(entity.countryOfIncorporation);
  if (countryRisk === 'HIGH') {
    riskScore += 30;
    factors.push('High-risk jurisdiction (FATF list)');
  } else if (countryRisk === 'MEDIUM') {
    riskScore += 15;
    factors.push('Medium-risk jurisdiction');
  }
  
  // Product risk factors (0-20 points)
  if (products.includes('FOREIGN_EXCHANGE') || products.includes('TRADE_FINANCE')) {
    riskScore += 10;
    factors.push('High-risk products requested');
  }
  
  // Anticipated transaction values (0-20 points)
  if (relationship.anticipatedMonthlyValue > 1000000) {
    riskScore += 15;
    factors.push('High anticipated transaction values (>$1M NZD/month)');
  } else if (relationship.anticipatedMonthlyValue > 500000) {
    riskScore += 10;
    factors.push('Elevated transaction values ($500K-$1M NZD/month)');
  }
  
  // Sanctions/PEP screening
  const sanctionsMatch = await checkSanctions(beneficialOwners);
  if (sanctionsMatch.exact) {
    return {
      rating: 'PROHIBITED',
      score: 100,
      factors: ['Sanctions list match - account opening prohibited']
    };
  } else if (sanctionsMatch.possible) {
    riskScore += 20;
    factors.push('Potential sanctions match - requires review');
  }
  
  // Determine rating
  if (riskScore >= 70) {
    return { rating: 'HIGH', score: riskScore, factors };
  } else if (riskScore >= 40) {
    return { rating: 'MEDIUM', score: riskScore, factors };
  } else {
    return { rating: 'LOW', score: riskScore, factors };
  }
}
```

---

## API Specifications

### NZBN API Integration

```typescript
// NZBN API Client
class NZBNClient {
  private baseUrl = 'https://api.business.govt.nz/services/v4';
  private oauth2Token: string;
  
  async authenticate(): Promise<void> {
    // OAuth 2.0 three-legged flow
    // Implementation depends on MBIE API credentials
  }
  
  async searchEntities(query: string): Promise<NZBNSearchResult[]> {
    const response = await fetch(
      `${this.baseUrl}/entities?search-term=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${this.oauth2Token}`,
          'Ocp-Apim-Subscription-Key': process.env.NZBN_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`NZBN API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getEntityByNZBN(nzbn: string): Promise<NZBNEntity> {
    // Validate NZBN format (13 digits)
    if (!/^\d{13}$/.test(nzbn)) {
      throw new Error('Invalid NZBN format');
    }
    
    const response = await fetch(
      `${this.baseUrl}/entities/${nzbn}`,
      {
        headers: {
          'Authorization': `Bearer ${this.oauth2Token}`,
          'Ocp-Apim-Subscription-Key': process.env.NZBN_API_KEY
        }
      }
    );
    
    if (response.status === 404) {
      throw new Error('Entity not found in Companies Office');
    }
    
    if (!response.ok) {
      throw new Error(`NZBN API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getDirectors(nzbn: string): Promise<Director[]> {
    const response = await fetch(
      `${this.baseUrl}/entities/${nzbn}/directors`,
      {
        headers: {
          'Authorization': `Bearer ${this.oauth2Token}`,
          'Ocp-Apim-Subscription-Key': process.env.NZBN_API_KEY
        }
      }
    );
    
    return response.json();
  }
  
  async getShareholders(nzbn: string): Promise<Shareholder[]> {
    const response = await fetch(
      `${this.baseUrl}/entities/${nzbn}/shareholders`,
      {
        headers: {
          'Authorization': `Bearer ${this.oauth2Token}`,
          'Ocp-Apim-Subscription-Key': process.env.NZBN_API_KEY
        }
      }
    );
    
    return response.json();
  }
}
```

### Backend API Endpoints

```typescript
// Application API Routes
POST   /api/v1/applications                    // Create new CDD application
GET    /api/v1/applications/:id                // Get application by ID
PUT    /api/v1/applications/:id                // Update application
DELETE /api/v1/applications/:id                // Delete draft application
POST   /api/v1/applications/:id/submit         // Submit for approval
POST   /api/v1/applications/:id/approve        // Approve application
POST   /api/v1/applications/:id/return         // Return for corrections
POST   /api/v1/applications/:id/reject         // Reject application

// Entity lookup
GET    /api/v1/entities/search?q={query}       // Search NZ entities by name
GET    /api/v1/entities/nzbn/{nzbn}            // Lookup by NZBN
POST   /api/v1/entities/overseas               // Create overseas entity

// Beneficial Owners
POST   /api/v1/applications/:id/beneficial-owners     // Add beneficial owner
PUT    /api/v1/beneficial-owners/:id                   // Update beneficial owner
DELETE /api/v1/beneficial-owners/:id                   // Remove beneficial owner

// Persons Acting on Behalf
POST   /api/v1/applications/:id/persons-acting        // Add POABOC
PUT    /api/v1/persons-acting/:id                      // Update POABOC
DELETE /api/v1/persons-acting/:id                      // Remove POABOC

// Documents
POST   /api/v1/applications/:id/documents             // Upload document
GET    /api/v1/documents/:id                           // Get document metadata
GET    /api/v1/documents/:id/download                  // Download document
DELETE /api/v1/documents/:id                           // Delete document

// Risk & CDD Determination
POST   /api/v1/applications/:id/determine-cdd-level   // Calculate CDD level
POST   /api/v1/applications/:id/calculate-risk        // Calculate risk rating

// Reporting & Audit
GET    /api/v1/reports/applications                    // Management reports
GET    /api/v1/audit-logs?applicationId={id}          // Audit trail

// Reference Data
GET    /api/v1/reference/countries                     // Country list with risk
GET    /api/v1/reference/fatf-jurisdictions           // FATF high-risk list
GET    /api/v1/reference/entity-types                 // Entity type options
```

---

## Wireframes

### 1. Dashboard - Onboarding Specialist View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AML/CFT Compliance System                    👤 John Smith   [Settings] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Search or Create New Application                             │  │
│  │  ┌────────────────────────────────────────┐  ┌────────────────┐ │  │
│  │  │ Enter business name or NZBN...         │  │ [+ New Entity] │ │  │
│  │  └────────────────────────────────────────┘  └────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MY APPLICATIONS (6)                                   [Filter ▼] │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Entity Name          │ Type     │ CDD Level  │ Status  │ Updated │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 🏢 ABC Trading Ltd    │ NZ Co    │ Standard   │ 📝 Draft│ 2h ago  │  │
│  │ 🏢 XYZ Holdings Inc   │ Overseas │ Enhanced   │ 📝 Draft│ 1d ago  │  │
│  │ 🏢 Smith Investments  │ NZ Co    │ Standard   │ ✅ Subm.│ 2d ago  │  │
│  │ 🏛️ City Council       │ NZ Local │ Simplified │ ✅ Appr.│ 3d ago  │  │
│  │ 🏢 Jones & Partners   │ NZ LP    │ Standard   │ 🔄 Ret. │ 4d ago  │  │
│  │ 🏢 Global Trust Ltd   │ Overseas │ Enhanced   │ ✅ Appr.│ 5d ago  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  TASKS REQUIRING ATTENTION │  │  RECENT ACTIVITY               │   │
│  ├────────────────────────────┤  ├────────────────────────────────┤   │
│  │ ⚠️ ABC Trading Ltd         │  │ • City Council approved        │   │
│  │   Upload missing ID docs   │  │ • XYZ Holdings updated         │   │
│  │                            │  │ • Jones & Partners returned    │   │
│  │ ⚠️ XYZ Holdings Inc        │  │ • Smith Investments submitted  │   │
│  │   Complete SoW/SoF fields  │  │ • ABC Trading created          │   │
│  └────────────────────────────┘  └────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Entity Search & Identification

```
┌─────────────────────────────────────────────────────────────────────────┐
│ New Application > Entity Identification                           [Help] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1 of 9: Entity Identification                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                          │
│  Select entity location:                                                │
│  ┌─────────────────────────┐  ┌─────────────────────────┐             │
│  │  🇳🇿 NEW ZEALAND ENTITY  │  │  🌏 OVERSEAS ENTITY      │             │
│  │  (Search Companies Off.) │  │  (Manual entry)         │             │
│  └─────────────────────────┘  └─────────────────────────┘             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Search New Zealand Entities                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ Enter company name or NZBN (13 digits)...                  │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  Search Results:                                                │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ ✓ ABC TRADING LIMITED                                      │ │  │
│  │  │   NZBN: 9429041561467                                      │ │  │
│  │  │   Type: NZ Limited Company                                 │ │  │
│  │  │   Status: Registered                                       │ │  │
│  │  │   Incorporated: 15/03/2018                                 │ │  │
│  │  │   Address: 123 Queen St, Auckland 1010                     │ │  │
│  │  │                                      [Select This Entity]  │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ ✓ ABC TRADING COMPANY LIMITED                              │ │  │
│  │  │   NZBN: 9429041561999                                      │ │  │
│  │  │   Type: NZ Limited Company                                 │ │  │
│  │  │   Status: Registered                                       │ │  │
│  │  │                                      [Select This Entity]  │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [← Back]                                              [Continue →]    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. CDD Level Determination

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Application #A-2026-0042 > CDD Determination                      [Help] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 2 of 9: CDD Level Determination                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                          │
│  Entity: ABC TRADING LIMITED (NZBN: 9429041561467)                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ⚙️ AUTOMATIC CDD LEVEL DETERMINATION                            │  │
│  │                                                                  │  │
│  │  ✅ STANDARD CDD REQUIRED                                        │  │
│  │                                                                  │  │
│  │  Reason: Entity does not meet Simplified CDD criteria           │  │
│  │  Legal Reference: Sections 14-17, AML/CFT Act 2009              │  │
│  │                                                                  │  │
│  │  Simplified CDD Assessment:                                     │  │
│  │  ❌ Not a listed issuer                                         │  │
│  │  ❌ Not a public service agency                                 │  │
│  │  ❌ Not a local authority                                       │  │
│  │  ❌ Not a state enterprise                                      │  │
│  │  ❌ Not a government department                                 │  │
│  │                                                                  │  │
│  │  Enhanced CDD Assessment:                                       │  │
│  │  ✅ No high-risk country involvement                            │  │
│  │  ✅ Standard ownership structure                                │  │
│  │  ✅ No PEP involvement detected                                 │  │
│  │  ✅ No nominee arrangements                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📋 STANDARD CDD REQUIREMENTS                                    │  │
│  │                                                                  │  │
│  │  You will need to:                                              │  │
│  │  • Verify entity identity and registration                      │  │
│  │  • Identify and verify beneficial owners (>25% ownership)       │  │
│  │  • Identify and verify persons acting on behalf                 │  │
│  │  • Obtain nature and purpose of business relationship           │  │
│  │  • Complete risk assessment                                     │  │
│  │  • Upload required documentation                                │  │
│  │                                                                  │  │
│  │  Legislative Requirements:                                      │  │
│  │  • Section 14: Verify customer identity                         │  │
│  │  • Section 15: Obtain beneficial owner information              │  │
│  │  • Section 16: Obtain nature and purpose information            │  │
│  │  • Section 17: Conduct ongoing CDD                              │  │
│  │                                                                  │  │
│  │  RBNZ Guidance:                                                 │  │
│  │  • Customer Due Diligence - Companies Guideline (April 2024)    │  │
│  │  • Beneficial Ownership Guideline (April 2024)                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [← Back]                                              [Continue →]    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. Beneficial Ownership (Auto-populated from NZBN)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Application #A-2026-0042 > Beneficial Ownership                   [Help] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 3 of 9: Beneficial Ownership Identification                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                          │
│  ℹ️ Auto-populated from NZ Companies Office (NZBN data)                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📊 OWNERSHIP STRUCTURE                                          │  │
│  │                                                                  │  │
│  │  ABC TRADING LIMITED                                            │  │
│  │  └─ John Smith (55%) - Director & Shareholder                   │  │
│  │  └─ Mary Johnson (45%) - Shareholder                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  BENEFICIAL OWNERS                           [+ Add Manual Entry] │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ✅ John Smith                                                   │  │
│  │  ├─ Ownership: 55% (Direct shareholding)                        │  │
│  │  ├─ Beneficial Owner Basis:                                     │  │
│  │  │  ☑ Ultimate Ownership (>25%)                                 │  │
│  │  │  ☑ Effective Control (Director)                              │  │
│  │  │  ☐ Person on whose behalf transaction conducted              │  │
│  │  ├─ Nominee Arrangement: ☐ No  ☐ Yes                            │  │
│  │  ├─ Verification Status: 🔴 Not Started                         │  │
│  │  └─ [Verify Identity] [Edit] [Remove]                           │  │
│  │                                                                  │  │
│  │  ✅ Mary Johnson                                                 │  │
│  │  ├─ Ownership: 45% (Direct shareholding)                        │  │
│  │  ├─ Beneficial Owner Basis:                                     │  │
│  │  │  ☑ Ultimate Ownership (>25%)                                 │  │
│  │  │  ☐ Effective Control                                         │  │
│  │  │  ☐ Person on whose behalf transaction conducted              │  │
│  │  ├─ Nominee Arrangement: ☐ No  ☐ Yes                            │  │
│  │  ├─ Verification Status: 🔴 Not Started                         │  │
│  │  └─ [Verify Identity] [Edit] [Remove]                           │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ⚠️ Legislative Requirement (Section 15, AML/CFT Act 2009):             │
│  You must identify all individuals who:                                 │
│  • Own more than 25% of the entity, OR                                  │
│  • Have effective control of the entity, OR                             │
│  • Are persons on whose behalf the transaction is conducted             │
│                                                                          │
│  [← Back]                                              [Continue →]    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5. Enhanced CDD Trigger Screen

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Application #A-2026-0043 > Enhanced CDD Required                  [Help] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 2 of 9: CDD Level Determination                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                          │
│  Entity: GLOBAL INVESTMENTS TRUST (Cayman Islands)                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ⚠️ ENHANCED CDD REQUIRED                                        │  │
│  │                                                                  │  │
│  │  This application has been automatically flagged for Enhanced   │  │
│  │  Customer Due Diligence based on the following risk factors:    │  │
│  │                                                                  │  │
│  │  TRIGGERS IDENTIFIED:                                           │  │
│  │                                                                  │  │
│  │  1. ❌ High-Risk Jurisdiction                                   │  │
│  │     Entity incorporated in Cayman Islands (FATF Monitored)      │  │
│  │     Legal Reference: Section 22(1)(a), AML/CFT Act 2009         │  │
│  │                                                                  │  │
│  │  2. ❌ Complex Ownership Structure                              │  │
│  │     4 layers of ownership detected                              │  │
│  │     Legal Reference: RBNZ Enhanced CDD Guideline (April 2024)   │  │
│  │                                                                  │  │
│  │  3. ❌ Nominee Director Arrangement                             │  │
│  │     Corporate service provider identified as nominee            │  │
│  │     Legal Reference: Regulation 12, AML/CFT Regulations 2011    │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📋 ENHANCED CDD REQUIREMENTS                                    │  │
│  │                                                                  │  │
│  │  In addition to Standard CDD, you must obtain:                  │  │
│  │                                                                  │  │
│  │  ✅ Source of Wealth (SoW)                                       │  │
│  │     Origin of the customer's entire body of wealth              │  │
│  │     Legislative Requirement: Section 22(2)(a), AML/CFT Act      │  │
│  │                                                                  │  │
│  │  ✅ Source of Funds (SoF)                                        │  │
│  │     Origin of specific funds for this transaction               │  │
│  │     Legislative Requirement: Section 22(2)(b), AML/CFT Act      │  │
│  │                                                                  │  │
│  │  ✅ Enhanced Verification                                        │  │
│  │     Additional verification from independent, reliable sources  │  │
│  │     AIVCOP 2013 Enhanced Verification Requirements              │  │
│  │                                                                  │  │
│  │  ✅ Senior Management Approval                                   │  │
│  │     Compliance Officer approval required before completion      │  │
│  │     Internal Policy Requirement                                 │  │
│  │                                                                  │  │
│  │  ✅ Enhanced Monitoring                                          │  │
│  │     Quarterly review triggers will be activated                 │  │
│  │     RBNZ Guidance: Ongoing CDD for high-risk customers          │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [← Back]                                              [Continue →]    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6. Risk Assessment Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Application #A-2026-0042 > Risk Assessment                        [Help] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 7 of 9: Risk Assessment                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  OVERALL RISK RATING                                            │  │
│  │                                                                  │  │
│  │         🟡 MEDIUM RISK                                           │  │
│  │         Risk Score: 45/100                                      │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ Risk Score Distribution:                                   │ │  │
│  │  │ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  45%                                 │ │  │
│  │  │ └─────┬─────┬─────┬─────┬─────┘                           │ │  │
│  │  │      Low   Medium  High  Prohibited                        │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  RISK FACTOR BREAKDOWN                                          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  Entity Risk Factors (15/30 points):                            │  │
│  │  • Entity type: Private Company (+5)                            │  │
│  │  • Ownership complexity: 2 layers (+5)                          │  │
│  │  • Age: Established >5 years (+0)                               │  │
│  │  • Cash-intensive business (+5)                                 │  │
│  │                                                                  │  │
│  │  Geographic Risk Factors (10/30 points):                        │  │
│  │  • Country: New Zealand - Low Risk (+0)                         │  │
│  │  • International operations: Australia (+5)                     │  │
│  │  • No FATF high-risk jurisdictions (+0)                         │  │
│  │                                                                  │  │
│  │  Product Risk Factors (10/20 points):                           │  │
│  │  • Transaction account (+0)                                     │  │
│  │  • Foreign exchange services (+10)                              │  │
│  │                                                                  │  │
│  │  Transaction Risk Factors (10/20 points):                       │  │
│  │  • Anticipated monthly value: $750,000 NZD (+10)                │  │
│  │  • Transaction volume: Medium (+0)                              │  │
│  │                                                                  │  │
│  │  Beneficial Owner Risk (0/20 points):                           │  │
│  │  • No PEP involvement (+0)                                      │  │
│  │  • No sanctions matches (+0)                                    │  │
│  │  • No adverse media (+0)                                        │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  REGULATORY REQUIREMENTS FOR MEDIUM RISK                        │  │
│  │                                                                  │  │
│  │  ✅ Standard CDD procedures apply                                │  │
│  │  ✅ Standard verification requirements (AIVCOP 2013)             │  │
│  │  ✅ Team Manager approval required                               │  │
│  │  ✅ Annual CDD review trigger                                    │  │
│  │  ⚠️ Enhanced monitoring for FX transactions                      │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Override Risk Rating]     [← Back]              [Continue →]         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7. Compliance Checklist Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Application #A-2026-0042 > Compliance Checklist                   [Help] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 9 of 9: Review and Submit                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                          │
│  Entity: ABC TRADING LIMITED                                            │
│  CDD Level: STANDARD CDD                                                │
│  Risk Rating: 🟡 MEDIUM RISK                                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📋 AML/CFT COMPLIANCE CHECKLIST                                 │  │
│  │                                                                  │  │
│  │  ENTITY IDENTIFICATION (Section 14, AML/CFT Act)                │  │
│  │  ✅ Entity legal name verified                                  │  │
│  │  ✅ NZBN confirmed: 9429041561467                               │  │
│  │  ✅ Entity type verified: NZ Limited Company                    │  │
│  │  ✅ Registered address verified                                 │  │
│  │  ✅ Registration status: Active                                 │  │
│  │  ✅ Certificate of Incorporation uploaded                       │  │
│  │                                                                  │  │
│  │  BENEFICIAL OWNERSHIP (Section 15, AML/CFT Act)                 │  │
│  │  ✅ 2 beneficial owners identified (>25% threshold)             │  │
│  │  ✅ John Smith (55%) - Identity verified                        │  │
│  │  ✅ Mary Johnson (45%) - Identity verified                      │  │
│  │  ✅ Ownership structure documented                              │  │
│  │  ✅ No nominee arrangements detected                            │  │
│  │  ⚠️ Verification: AIVCOP 2013 standard level                    │  │
│  │                                                                  │  │
│  │  PERSONS ACTING ON BEHALF (Section 11(1)(c), AML/CFT Act)      │  │
│  │  ✅ John Smith - Director (Board Resolution verified)           │  │
│  │  ✅ Identity verified                                           │  │
│  │  ✅ Authority to act confirmed                                  │  │
│  │                                                                  │  │
│  │  NATURE & PURPOSE (Section 16, AML/CFT Act)                    │  │
│  │  ✅ Business relationship purpose documented                    │  │
│  │  ✅ Products requested: Transaction Account, Foreign Exchange   │  │
│  │  ✅ Anticipated transaction values documented                   │  │
│  │  ✅ Source of funds identified: Business revenue                │  │
│  │  ✅ International transaction countries listed                  │  │
│  │                                                                  │  │
│  │  RISK ASSESSMENT (Section 58, AML/CFT Act)                     │  │
│  │  ✅ Risk rating calculated: Medium                              │  │
│  │  ✅ Risk factors documented (see detailed assessment)           │  │
│  │  ✅ No Enhanced CDD triggers identified                         │  │
│  │  ✅ Ongoing monitoring frequency: Annual review                 │  │
│  │                                                                  │  │
│  │  DOCUMENTATION (RBNZ Guideline Requirements)                    │  │
│  │  ✅ Certificate of Incorporation                                │  │
│  │  ✅ Company Constitution                                        │  │
│  │  ✅ Register of Directors and Shareholders                      │  │
│  │  ✅ Board Resolution                                            │  │
│  │  ✅ Beneficial Owner ID documents (2/2)                         │  │
│  │  ✅ POABOC ID documents (1/1)                                   │  │
│  │                                                                  │  │
│  │  REGULATORY COMPLIANCE SUMMARY                                  │  │
│  │  ✅ Section 11: CDD requirements - COMPLIANT                    │  │
│  │  ✅ Sections 14-17: Standard CDD - COMPLIANT                    │  │
│  │  ✅ Section 58: Risk assessment - COMPLIANT                     │  │
│  │  ✅ AIVCOP 2013: Identity verification - COMPLIANT              │  │
│  │  ✅ RBNZ Companies Guideline (April 2024) - COMPLIANT           │  │
│  │  ✅ RBNZ Beneficial Ownership Guideline (April 2024) - COMPLIANT│  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ⚠️ Ready for Submission                                                │
│  Assigned Approver: Sarah Williams (Team Manager)                       │
│                                                                          │
│  [Save as Draft]  [← Back]                      [Submit for Approval]  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8. Approver Queue Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AML/CFT Compliance System - Approval Queue        👤 Sarah Williams     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PENDING APPROVALS (8)                      [Filter ▼] [Sort ▼]  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Priority │ Entity Name      │ Specialist │ CDD Level │ Risk │ Age│  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 🔴 HIGH  │Global Trust Ltd  │John Smith  │Enhanced   │HIGH  │12h│  │
│  │ 🔴 HIGH  │Offshore Holdings │Jane Doe    │Enhanced   │HIGH  │18h│  │
│  │ 🟡 MED   │ABC Trading Ltd   │John Smith  │Standard   │MED   │6h │  │
│  │ 🟡 MED   │XYZ Investments   │Mike Brown  │Standard   │MED   │1d │  │
│  │ 🟢 LOW   │Local Cafe Ltd    │Jane Doe    │Standard   │LOW   │2d │  │
│  │ 🟢 LOW   │Smith Services    │John Smith  │Standard   │LOW   │2d │  │
│  │ 🔵 SIM   │City Council      │Mike Brown  │Simplified │LOW   │3d │  │
│  │ 🔵 SIM   │Govt Department   │Jane Doe    │Simplified │LOW   │3d │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  APPROVAL STATISTICS       │  │  TEAM PERFORMANCE              │   │
│  ├────────────────────────────┤  ├────────────────────────────────┤   │
│  │ This Week:                 │  │ Avg. Approval Time:            │   │
│  │ • Approved: 24             │  │ • Standard CDD: 1.2 days       │   │
│  │ • Returned: 3              │  │ • Enhanced CDD: 3.5 days       │   │
│  │ • Rejected: 1              │  │                                │   │
│  │                            │  │ Current Backlog: 8             │   │
│  │ Pending by Risk:           │  │ Oldest Application: 3 days     │   │
│  │ • High: 2                  │  │                                │   │
│  │ • Medium: 2                │  │ Compliance Rate: 97%           │   │
│  │ • Low: 4                   │  │ (This Quarter)                 │   │
│  └────────────────────────────┘  └────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ESCALATIONS REQUIRING COMPLIANCE OFFICER REVIEW (2)            │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ • Global Trust Ltd - Multiple Enhanced CDD triggers              │  │
│  │ • Offshore Holdings - PEP involvement + High-risk jurisdiction   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: MVP (Months 1-4)
**Goal:** Core CDD functionality with NZBN integration

**Deliverables:**
1. **Month 1: Foundation**
   - Project setup (repo, CI/CD, environments)
   - Database schema implementation
   - Authentication & authorization framework
   - Basic UI scaffolding (React + MUI)

2. **Month 2: Entity & CDD Determination**
   - NZBN API integration
   - Entity identification workflows (NZ + Overseas)
   - CDD level determination engine
   - Simplified/Standard/Enhanced logic
   - Basic dashboard

3. **Month 3: Beneficial Ownership & Verification**
   - Beneficial owner management module
   - POABOC management module
   - Document upload system
   - Verification workflows
   - Risk rating engine

4. **Month 4: Workflow & Approval**
   - Application workflow state machine
   - Approval queue for managers
   - Audit logging
   - Compliance checklist generation
   - Testing & UAT

### Phase 2: Enhancements (Months 5-7)
**Goal:** Integration and advanced features

**Deliverables:**
1. **Month 5: External Integrations**
   - Core banking system integration (if available)
   - Sanctions/PEP screening API integration
   - FATF watchlist auto-update

2. **Month 6: Advanced Features**
   - Visual ownership tree builder
   - Advanced reporting & analytics
   - Existing customer CDD refresh workflows
   - Enhanced document management

3. **Month 7: Optimization**
   - Performance optimization
   - Mobile responsiveness improvements
   - Advanced search & filtering
   - Workflow automation rules

### Phase 3: Scale & Compliance (Months 8-9)
**Goal:** Production readiness and compliance certification

**Deliverables:**
1. **Month 8: Security & Compliance**
   - Security audit & penetration testing
   - Compliance certification preparation
   - RBNZ guideline alignment verification
   - Data retention & archival system

2. **Month 9: Production Launch**
   - Production deployment
   - User training programs
   - Go-live support
   - Post-launch monitoring

---

## Development Guidelines

### Code Quality Standards

```typescript
// Example: CDD Level Determination Service
// File: src/services/cdd-determination.service.ts

import { Injectable } from '@nestjs/common';
import { Entity } from '../entities/entity.entity';
import { CDDLevel, CDDDetermination } from '../types/cdd.types';

/**
 * Service responsible for determining the appropriate CDD level
 * based on entity characteristics and regulatory requirements.
 * 
 * Implements:
 * - Section 18 (Simplified CDD) - AML/CFT Act 2009
 * - Sections 14-17 (Standard CDD) - AML/CFT Act 2009
 * - Section 22 (Enhanced CDD) - AML/CFT Act 2009
 */
@Injectable()
export class CDDDeterminationService {
  
  /**
   * Determines the appropriate CDD level for an entity
   * 
   * @param entity - The entity to assess
   * @returns CDDDetermination with level, reason, and legal references
   */
  async determineCDDLevel(entity: Entity): Promise<CDDDetermination> {
    // Check for Simplified CDD eligibility first
    const simplifiedResult = await this.checkSimplifiedCDDEligibility(entity);
    if (simplifiedResult.eligible) {
      return {
        level: CDDLevel.SIMPLIFIED,
        reason: simplifiedResult.reason,
        legalReferences: [simplifiedResult.legalReference],
        requirements: this.getSimplifiedCDDRequirements()
      };
    }
    
    // Check for Enhanced CDD triggers
    const enhancedResult = await this.checkEnhancedCDDTriggers(entity);
    if (enhancedResult.required) {
      return {
        level: CDDLevel.ENHANCED,
        reason: enhancedResult.triggers.join('; '),
        legalReferences: enhancedResult.legalReferences,
        requirements: this.getEnhancedCDDRequirements()
      };
    }
    
    // Default to Standard CDD
    return {
      level: CDDLevel.STANDARD,
      reason: 'Entity does not meet Simplified CDD criteria',
      legalReferences: ['Sections 14-17, AML/CFT Act 2009'],
      requirements: this.getStandardCDDRequirements()
    };
  }
  
  /**
   * Checks if entity qualifies for Simplified CDD
   * Implements Section 18, AML/CFT Act 2009
   */
  private async checkSimplifiedCDDEligibility(entity: Entity) {
    // Implementation as shown in CDD Determination Logic section
  }
  
  /**
   * Checks for Enhanced CDD triggers
   * Implements Section 22, AML/CFT Act 2009
   */
  private async checkEnhancedCDDTriggers(entity: Entity) {
    // Implementation as shown in CDD Determination Logic section
  }
  
  // Additional helper methods...
}
```

### Testing Requirements

```typescript
// Example: Unit Test for CDD Determination
// File: src/services/cdd-determination.service.spec.ts

describe('CDDDeterminationService', () => {
  let service: CDDDeterminationService;
  
  beforeEach(() => {
    service = new CDDDeterminationService();
  });
  
  describe('Simplified CDD Eligibility', () => {
    it('should identify NZX listed company as Simplified CDD eligible', async () => {
      const entity = createMockEntity({
        nzbn: '9429041561467',
        isListedIssuer: true,
        exchange: 'NZX'
      });
      
      const result = await service.determineCDDLevel(entity);
      
      expect(result.level).toBe(CDDLevel.SIMPLIFIED);
      expect(result.reason).toContain('Listed Issuer - NZX');
      expect(result.legalReferences).toContain('Section 18(1)(a), AML/CFT Act 2009');
    });
    
    it('should identify NZ local authority as Simplified CDD eligible', async () => {
      const entity = createMockEntity({
        nzbn: '9429041561468',
        entityType: 'LOCAL_AUTHORITY'
      });
      
      const result = await service.determineCDDLevel(entity);
      
      expect(result.level).toBe(CDDLevel.SIMPLIFIED);
      expect(result.legalReferences).toContain('Section 18(1)(c), AML/CFT Act 2009');
    });
  });
  
  describe('Enhanced CDD Triggers', () => {
    it('should trigger Enhanced CDD for high-risk country', async () => {
      const entity = createMockEntity({
        countryOfIncorporation: 'KP', // North Korea (FATF high-risk)
        entityType: 'COMPANY'
      });
      
      const result = await service.determineCDDLevel(entity);
      
      expect(result.level).toBe(CDDLevel.ENHANCED);
      expect(result.reason).toContain('FATF high-risk jurisdiction');
      expect(result.legalReferences).toContain('Section 22(1)(a), AML/CFT Act 2009');
    });
    
    it('should trigger Enhanced CDD for complex ownership structure', async () => {
      const entity = createMockEntity({
        ownershipLayers: 4
      });
      
      const result = await service.determineCDDLevel(entity);
      
      expect(result.level).toBe(CDDLevel.ENHANCED);
      expect(result.reason).toContain('Complex ownership structure (4 layers)');
    });
  });
  
  describe('Standard CDD Default', () => {
    it('should default to Standard CDD for typical NZ private company', async () => {
      const entity = createMockEntity({
        nzbn: '9429041561469',
        entityType: 'PRIVATE_COMPANY',
        countryOfIncorporation: 'NZ'
      });
      
      const result = await service.determineCDDLevel(entity);
      
      expect(result.level).toBe(CDDLevel.STANDARD);
      expect(result.legalReferences).toContain('Sections 14-17, AML/CFT Act 2009');
    });
  });
});
```

### Security Implementation

```typescript
// Example: Audit Logging Decorator
// File: src/decorators/audit-log.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'auditLog';

/**
 * Decorator to automatically log actions to audit trail
 * 
 * Usage:
 * @AuditLog('APPLICATION_APPROVED')
 * async approveApplication(id: string, userId: string) { ... }
 */
export const AuditLog = (actionType: string) => 
  SetMetadata(AUDIT_LOG_KEY, actionType);

// Audit Logging Interceptor
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const actionType = this.reflector.get<string>(
      AUDIT_LOG_KEY, 
      context.getHandler()
    );
    
    if (!actionType) {
      return next.handle();
    }
    
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const ipAddress = request.ip;
    
    // Capture before state
    const beforeState = { ...request.body };
    
    return next.handle().pipe(
      tap((response) => {
        // Log to audit trail
        this.auditService.log({
          userId,
          actionType,
          timestamp: new Date(),
          ipAddress,
          oldValue: beforeState,
          newValue: response,
          applicationId: request.params.id
        });
      })
    );
  }
}
```

---

## Deployment Checklist

### Pre-Production Checklist

```markdown
## Environment Setup
- [ ] Production database provisioned (encrypted at rest)
- [ ] Document storage bucket created (encrypted, versioned)
- [ ] Environment variables configured in secure vault
- [ ] SSL/TLS certificates installed (TLS 1.3)
- [ ] Load balancer configured
- [ ] Auto-scaling policies defined

## Security
- [ ] Penetration testing completed
- [ ] Vulnerability scan passed (no high/critical issues)
- [ ] OWASP Top 10 mitigations verified
- [ ] Database connection strings encrypted
- [ ] API keys rotated and stored in vault
- [ ] RBAC permissions reviewed and approved
- [ ] Session timeout configured (30 minutes)
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS configured correctly
- [ ] Content Security Policy headers set

## Compliance
- [ ] AML/CFT Act 2009 requirements verified by Legal
- [ ] RBNZ Guidelines compliance confirmed
- [ ] AIVCOP 2013 verification requirements implemented
- [ ] Audit trail retention policy configured (5 years)
- [ ] Data retention policy implemented
- [ ] Privacy Act 2020 compliance verified
- [ ] Information security policies documented

## Integration Testing
- [ ] NZBN API integration tested in production environment
- [ ] Core banking system integration tested (if applicable)
- [ ] Email notifications working
- [ ] Document upload/download tested with production storage
- [ ] Authentication/SSO tested with production AD/Azure AD

## Performance
- [ ] Load testing completed (50 concurrent users)
- [ ] Page load times < 2 seconds verified
- [ ] Document upload tested (10MB files)
- [ ] Database queries optimized (execution plans reviewed)
- [ ] Caching strategy implemented

## Monitoring & Logging
- [ ] Application monitoring configured (Application Insights/CloudWatch)
- [ ] Error logging configured
- [ ] Performance metrics tracking enabled
- [ ] Uptime monitoring configured (99.5% SLA)
- [ ] Alerting rules defined (critical errors, performance degradation)
- [ ] Log aggregation configured
- [ ] Audit log monitoring dashboard created

## Disaster Recovery
- [ ] Database backup schedule configured (daily incremental, weekly full)
- [ ] Backup restoration tested (RPO: 24 hours)
- [ ] Disaster recovery plan documented (RTO: 4 hours)
- [ ] Failover procedures tested
- [ ] Data replication configured (if multi-region)

## Documentation
- [ ] API documentation published (OpenAPI/Swagger)
- [ ] User guides completed and reviewed
- [ ] Administrator guide completed
- [ ] Runbook for operations team prepared
- [ ] Training materials finalized

## User Acceptance
- [ ] UAT completed by Business Banking team
- [ ] UAT completed by Corporate Banking team
- [ ] UAT completed by Compliance team
- [ ] All critical bugs resolved
- [ ] Sign-off obtained from business stakeholders

## Go-Live Preparation
- [ ] Cutover plan documented
- [ ] Rollback plan documented
- [ ] Support team trained
- [ ] Go-live date communicated to all stakeholders
- [ ] Hypercare support schedule confirmed (first 2 weeks)
```

---

## Reference Data

### FATF High-Risk Jurisdictions (Example - as of Jan 2024)

```typescript
// File: src/data/fatf-high-risk.data.ts

/**
 * FATF-identified jurisdictions with strategic AML/CFT deficiencies
 * Source: FATF Public Statements
 * Last Updated: October 2024 (update quarterly)
 */
export const FATF_HIGH_RISK_JURISDICTIONS = [
  {
    countryCode: 'KP',
    countryName: 'Democratic People's Republic of Korea (North Korea)',
    riskLevel: 'HIGH',
    fatfStatus: 'Call for action',
    lastUpdated: '2024-10-20'
  },
  {
    countryCode: 'IR',
    countryName: 'Iran',
    riskLevel: 'HIGH',
    fatfStatus: 'Call for action',
    lastUpdated: '2024-10-20'
  },
  {
    countryCode: 'MM',
    countryName: 'Myanmar',
    riskLevel: 'HIGH',
    fatfStatus: 'Enhanced monitoring',
    lastUpdated: '2024-10-20'
  }
  // Additional jurisdictions...
];

/**
 * FATF member countries with "sufficient AML/CFT systems"
 * Used for Simplified CDD eligibility for government bodies
 */
export const FATF_MEMBER_COUNTRIES = [
  'AU', 'AT', 'BE', 'BR', 'CA', 'CN', 'DK', 'FI', 'FR', 'DE', 
  'GR', 'HK', 'IS', 'IN', 'IE', 'IL', 'IT', 'JP', 'KR', 'LU',
  'MY', 'MX', 'NL', 'NZ', 'NO', 'PT', 'RU', 'SA', 'SG', 'ZA',
  'ES', 'SE', 'CH', 'TR', 'GB', 'US'
];
```

### Entity Type Mapping

```typescript
// File: src/data/entity-types.data.ts

export const ENTITY_TYPES = {
  NZ: [
    { value: 'NZ_LIMITED_COMPANY', label: 'NZ Limited Company', simplifiedEligible: false },
    { value: 'NZ_LIMITED_PARTNERSHIP', label: 'NZ Limited Partnership', simplifiedEligible: false },
    { value: 'NZ_LOCAL_AUTHORITY', label: 'NZ Local Authority', simplifiedEligible: true },
    { value: 'NZ_STATE_ENTERPRISE', label: 'NZ State Enterprise', simplifiedEligible: true },
    { value: 'NZ_PUBLIC_SERVICE_AGENCY', label: 'NZ Public Service Agency', simplifiedEligible: true },
    { value: 'NZ_GOVT_DEPARTMENT', label: 'NZ Government Department', simplifiedEligible: true },
    { value: 'NZ_LISTED_ISSUER', label: 'NZ Listed Issuer (NZX)', simplifiedEligible: true }
  ],
  OVERSEAS: [
    { value: 'OVERSEAS_COMPANY_PUBLIC', label: 'Overseas Company (Public)', simplifiedEligible: false },
    { value: 'OVERSEAS_COMPANY_PRIVATE', label: 'Overseas Company (Private)', simplifiedEligible: false },
    { value: 'OVERSEAS_LIMITED_PARTNERSHIP', label: 'Overseas Limited Partnership', simplifiedEligible: false },
    { value: 'OVERSEAS_TRUST', label: 'Overseas Trust', simplifiedEligible: false },
    { value: 'OVERSEAS_FOUNDATION', label: 'Overseas Foundation', simplifiedEligible: false },
    { value: 'OVERSEAS_GOVT_BODY', label: 'Overseas Government Body', simplifiedEligible: true }
  ]
};
```

---

## Conclusion

This technical design specification provides a complete blueprint for building an AML/CFT-compliant entity onboarding application. The system automates CDD determination while ensuring full compliance with New Zealand's regulatory requirements.

### Key Success Factors

1. **Regulatory Compliance First**: Every feature is grounded in specific sections of the AML/CFT Act and RBNZ guidelines
2. **Automation with Oversight**: System automates determination but allows manual override with justification
3. **Comprehensive Audit Trail**: Every action logged for regulatory audit purposes
4. **Risk-Based Approach**: CDD level and verification requirements scale with risk
5. **User-Friendly Interface**: Complex compliance made simple through intuitive workflows

### Next Steps for Development

1. Review and approve technical design with stakeholders
2. Set up development environment and tooling
3. Begin Phase 1 implementation following the roadmap
4. Establish regular compliance review checkpoints with Legal/Compliance team
5. Schedule RBNZ guidance review quarterly to ensure ongoing compliance

---

**Document Version Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 24 Jan 2026 | Claude AI | Initial comprehensive build guide with wireframes |

---

**End of Claude Code Build Guide**
