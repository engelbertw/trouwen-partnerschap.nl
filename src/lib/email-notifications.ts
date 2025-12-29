import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@huwelijk.gemeente.nl';

/**
 * Send email notification to BABS when assigned to a new ceremony
 * Privacy-first: Only includes date, time, and location (no personal data)
 */
export async function notifyBabsNewCeremony(
  babsEmail: string,
  ceremonyDate: string,
  ceremonyTime: string,
  location: string
): Promise<{ success: boolean; error?: string }> {
  // Skip if no API key configured (development mode)
  if (!process.env.RESEND_API_KEY) {
    console.log('Email notification skipped (RESEND_API_KEY not configured):', {
      babsEmail,
      ceremonyDate,
      ceremonyTime,
      location,
    });
    return { success: true };
  }

  // Validate email
  if (!babsEmail || !babsEmail.includes('@')) {
    console.warn('Invalid email address for BABS notification:', babsEmail);
    return { success: false, error: 'Invalid email address' };
  }

  try {
    // Format date in Dutch format
    const dateObj = new Date(ceremonyDate);
    const formattedDate = dateObj.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: babsEmail,
      subject: 'Nieuwe trouwceremonie toegewezen',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #1e40af;
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 8px 8px;
              }
              .info-box {
                background-color: white;
                border-left: 4px solid #1e40af;
                padding: 15px;
                margin: 20px 0;
              }
              .info-label {
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 5px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Nieuwe Trouwceremonie</h1>
            </div>
            <div class="content">
              <p>Beste BABS,</p>
              
              <p>Er is een nieuwe trouwceremonie aan u toegewezen:</p>
              
              <div class="info-box">
                <div class="info-label">Datum</div>
                <div>${formattedDate}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Tijd</div>
                <div>${ceremonyTime}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Locatie</div>
                <div>${location}</div>
              </div>
              
              <p>
                Log in op het BABS portaal om meer details te bekijken of om uw beschikbaarheid te beheren.
              </p>
              
              <p>
                Met vriendelijke groet,<br>
                Het Huwelijk Systeem
              </p>
            </div>
            <div class="footer">
              <p>Dit is een automatisch gegenereerd bericht. Gelieve niet te antwoorden.</p>
              <p>Voor vragen, neem contact op met uw gemeente.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Nieuwe Trouwceremonie

Beste BABS,

Er is een nieuwe trouwceremonie aan u toegewezen:

Datum: ${formattedDate}
Tijd: ${ceremonyTime}
Locatie: ${location}

Log in op het BABS portaal om meer details te bekijken of om uw beschikbaarheid te beheren.

Met vriendelijke groet,
Het Huwelijk Systeem

---
Dit is een automatisch gegenereerd bericht. Gelieve niet te antwoorden.
Voor vragen, neem contact op met uw gemeente.
      `.trim(),
    });

    if (error) {
      console.error('Error sending email notification:', error);
      return { success: false, error: error.message };
    }

    console.log('Email notification sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Exception sending email notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

