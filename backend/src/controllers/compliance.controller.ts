// @ts-nocheck
import { Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../types';

export const generateChecklist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: {
        entity: true,
        beneficialOwners: {
          include: {
            person: true,
          },
        },
        personsActingOnBehalf: {
          include: {
            person: true,
          },
        },
        riskFactors: true,
      },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Compliance Checklist - ${application.applicationNumber}</title>
        <style>
          body { font-family: sans-serif; margin: 2em; }
          h1, h2 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 2em; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Compliance Checklist</h1>
        <h2>Application: ${application.applicationNumber}</h2>

        <h3>Entity Details</h3>
        <table>
          <tr><th>Legal Name</th><td>${application.entity.legalName}</td></tr>
          <tr><th>Entity Type</th><td>${application.entity.entityType}</td></tr>
          <tr><th>NZBN</th><td>${application.entity.nzbn || 'N/A'}</td></tr>
        </table>

        <h3>CDD and Risk</h3>
        <table>
          <tr><th>CDD Level</th><td>${application.cddLevel}</td></tr>
          <tr><th>Risk Rating</th><td>${application.riskRating || 'N/A'}</td></tr>
          <tr><th>Risk Score</th><td>${application.riskScore || 'N/A'}</td></tr>
        </table>

        <h3>Beneficial Owners</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Ownership %</th>
              <th>Verification Status</th>
            </tr>
          </thead>
          <tbody>
            ${application.beneficialOwners
              .map(
                (bo) => `
              <tr>
                <td>${bo.person.fullName}</td>
                <td>${bo.ownershipPercentage || 'N/A'}</td>
                <td>${bo.verificationStatus}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <h3>Persons Acting on Behalf</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Verification Status</th>
            </tr>
          </thead>
          <tbody>
            ${application.personsActingOnBehalf
              .map(
                (p) => `
              <tr>
                <td>${p.person.fullName}</td>
                <td>${p.roleTitle}</td>
                <td>${p.verificationStatus}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.header('Content-Type', 'text/html').send(html);
  }
);
