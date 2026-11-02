# VeriFactu Integration Documentation

## Overview

This document describes the integration of the Spanish Tax Agency's (AEAT) VeriFactu system into the HolaMotor workshop management application. VeriFactu is a mandatory billing verification system for Spanish businesses that requires electronic invoice submission and verification.

## Reference Documentation

The official AEAT VeriFactu user manual is available at:
- **PDF**: [Manual_Usuario_Verifactu_Accesible.pdf](./Manual_Usuario_Verifactu_Accesible.pdf)
- **Online**: https://sede.agenciatributaria.gob.es/static_files/Sede/Biblioteca/Manual/Practicos/Manual_facturacion/Manual_Usuario_Verifactu_Accesible.pdf

## Architecture

### Service Layer

The VeriFactu integration is implemented through the following services:

1. **VerifactuService** (`src/app/core/services/verifactu.service.ts`)
   - Handles communication with the VeriFactu API
   - Manages API authentication and configuration
   - Provides methods for invoice submission and status checking
   - Generates QR codes for VeriFactu compliance

2. **BillingService** (`src/app/features/facturacion/services/billing.service.ts`)
   - Integrates VeriFactu submission into the invoice workflow
   - Converts internal invoice format to AEAT-compliant format
   - Handles invoice status updates after VeriFactu submission

### Data Models

#### VeriFactu Invoice Request Structure

```typescript
interface FacturaOnlineInvoiceRequest {
  factura: {
    IDEmisorFactura: string;          // Emitter's NIF
    NumSerieFactura: string;          // Invoice series number
    FechaExpedicionFactura: string;   // Issue date (YYYY-MM-DD)
    HoraExpedicionFactura: string;   // Issue time (HH:MM)
    Destinatarios: Array<{
      NIF: string;                    // Recipient's NIF
      NombreRazon: string;            // Recipient's name
    }>;
    TipoDesglose: {
      DesgloseFactura: {
        Sujeta: {
          NoExenta: {
            TipoNoExenta: string;     // S2 for standard invoices
            DesgloseIVA: Array<{
              BaseImponible: string;   // Taxable base
              TipoImpositivo: string;  // Tax rate (e.g., "21")
              CuotaRepercutida: string; // Tax amount
            }>;
          };
        };
      };
    };
    ImporteTotal: string;             // Total amount
    Descripcion?: string;             // Description
    Vencimiento?: string;             // Due date
  };
}
```

## Configuration

### Settings

VeriFactu integration requires the following settings (configured in Settings component):

- **verifactuApiKey**: API key for VeriFactu service
- **verifactuSandbox**: Boolean flag for sandbox mode (true for testing)
- **taxId**: Workshop's NIF/CIF (emitter identifier)
- **workshopName**: Official business name

### Environment

The service supports two environments:
- **Sandbox**: `https://sandbox.verifacti.com` (for testing)
- **Production**: `https://api.verifacti.com` (for live operations)

## Workflow

### Invoice Submission Process

1. **Create Invoice**: User creates an invoice through the billing module
2. **Prepare VeriFactu Data**: System converts invoice to AEAT format
3. **Submit to VeriFactu**: Invoice is sent to the VeriFactu API
4. **Receive Response**: API returns:
   - Invoice ID
   - Status
   - QR code
   - Digital signature
5. **Update Invoice Status**: Invoice status updated to "Enviada" (Sent)
6. **Generate QR Code**: QR code generated for customer verification

### Invoice Status Checking

The system can query the status of previously submitted invoices:
- Check if invoice was accepted by AEAT
- Verify invoice signature
- Retrieve QR code for verification

## API Methods

### VerifactuService Methods

#### `getApiStatus()`
Checks if the VeriFactu API is accessible and properly configured.

#### `getInvoiceStatus(request)`
Queries the status of a specific invoice from AEAT.

#### `createInvoice(request)`
Creates and submits a new invoice to VeriFactu/AEAT.

#### `sendInvoice(request)`
Sends an invoice in FacturaOnline format (AEAT compliant).

#### `getInvoiceSignature(invoiceId)`
Retrieves the digital signature for a submitted invoice.

#### `generateQRCode(invoiceData)`
Generates a VeriFactu-compliant QR code for invoice verification.

#### `isConfigured()`
Checks if VeriFactu API key is configured.

## Compliance Requirements

### Invoice Data Requirements

According to AEAT regulations, invoices must include:

1. **Emitter Information**
   - NIF/CIF
   - Business name
   - Commercial name (if different)

2. **Recipient Information**
   - NIF (if applicable)
   - Name or reason
   - Address (optional but recommended)

3. **Invoice Details**
   - Series and number
   - Issue date and time
   - Due date (if applicable)
   - Total amount

4. **Tax Breakdown**
   - Taxable base per tax rate
   - Tax rate percentage
   - Tax amount per rate

5. **Digital Signature**
   - AEAT-generated signature
   - QR code for verification

### QR Code Format

The VeriFactu QR code contains:
- Emitter's NIF
- Invoice series and number
- Issue date
- Total amount
- Digital signature

## Testing

### Sandbox Testing

To test VeriFactu integration:

1. Set `verifactuSandbox` to `true` in settings
2. Use sandbox API key (obtained from AEAT)
3. Submit test invoices
4. Verify responses and QR codes
5. Check invoice status

### Production Deployment

Before going to production:

1. Obtain production API key from AEAT
2. Set `verifactuSandbox` to `false`
3. Verify all invoice data is correct
4. Test with a limited number of invoices
5. Monitor API responses and error handling

## Error Handling

The service handles the following error scenarios:

- Missing API key configuration
- Invalid invoice data
- API communication failures
- AEAT validation errors
- Network timeout errors

All errors are logged to the console and returned as observables for proper handling in the UI.

## Security Considerations

1. **API Key Security**
   - Store API key securely in settings
   - Never commit API keys to version control
   - Use environment variables for deployment

2. **Data Protection**
   - Encrypt sensitive invoice data in transit
   - Follow GDPR guidelines for customer data
   - Implement proper access controls

3. **Digital Signatures**
   - Validate AEAT signatures
   - Store signatures securely
   - Use signatures for invoice verification

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Solution: Configure verifactuApiKey in settings

2. **Invoice submission fails**
   - Check network connectivity
   - Verify API key validity
   - Ensure invoice data is complete and valid

3. **QR code not generated**
   - Verify invoice was successfully submitted
   - Check if signature was returned by API
   - Ensure all required fields are present

## References

- AEAT VeriFactu Documentation: https://www.agenciatributaria.es
- FacturaE Specification: https://www.facturae.es
- Spanish Royal Decree 1619/2012: Invoice regulations

## Changelog

### 2026-11-02
- Initial VeriFactu integration
- Added AEAT-compliant invoice structures
- Implemented QR code generation
- Added digital signature support
- Integrated with billing workflow
