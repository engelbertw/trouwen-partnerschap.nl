/**
 * PDF Generator voor Huwelijksaankondiging
 * Genereert een overzicht PDF van de aankondiging voor de gebruiker
 */

import { jsPDF } from 'jspdf';
import type { AankondigingData } from './aankondiging-storage';

// NL Design System kleuren
const COLORS = {
  primary: '#154273',
  text: '#1a1a1a',
  textLight: '#5a5a5a',
  border: '#d4d4d4',
  background: '#f5f5f5',
};

/**
 * Genereer PDF voor huwelijksaankondiging
 * Layout komt overeen met de samenvatting pagina
 */
export function generateAankondigingPDF(
  data: AankondigingData,
  dossierId: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper functie: Voeg regel toe
  const addLine = (
    text: string,
    fontSize: number = 10,
    bold: boolean = false,
    color: string = COLORS.text,
    indent: number = 0
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(color);
    
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin - 10) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin + indent, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 2;
  };

  // Helper functie: Voeg sectie titel toe (met border zoals samenvatting)
  const addSection = (title: string) => {
    // Check if we need a new page
    if (yPosition > pageHeight - margin - 40) {
      doc.addPage();
      yPosition = margin;
    }
    
    yPosition += 5;
    
    // Border rondom sectie
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.5);
    
    // Sectie titel met achtergrond
    doc.setFillColor(COLORS.background);
    doc.rect(margin, yPosition - 4, contentWidth, 10, 'FD');
    
    doc.setTextColor(COLORS.text);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yPosition + 2);
    yPosition += 10;
    doc.setTextColor(COLORS.text);
  };

  // Helper functie: Voeg veld toe (label + waarde)
  const addField = (label: string, value: string, indent: number = 3) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text(label, margin + indent, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    const lines = doc.splitTextToSize(value, contentWidth - indent);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin - 10) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin + indent, yPosition);
      yPosition += 4;
    });
    yPosition += 2;
  };
  
  // Helper functie: Sluit sectie af
  const closeSection = () => {
    yPosition += 3;
  };

  // ============================================================================
  // HEADER
  // ============================================================================
  
  // Logo placeholder (klein zoals in samenvatting)
  doc.setFillColor(COLORS.primary);
  doc.rect(margin, yPosition, 30, 12, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGO', margin + 2, yPosition + 5);
  doc.text('GEMEENTE', margin + 2, yPosition + 9);
  
  // Titel
  doc.setTextColor(COLORS.primary);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Samenvatting', margin + 35, yPosition + 8);
  
  yPosition += 18;
  
  // Subtitel
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text('Huwelijk of partnerschap aankondigen', margin, yPosition);
  yPosition += 5;
  
  // Dossiernummer
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textLight);
  doc.text(`Dossiernummer: ${dossierId.substring(0, 8).toUpperCase()}`, margin, yPosition);
  yPosition += 5;
  
  // Datum
  const today = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Datum: ${today}`, margin, yPosition);
  yPosition += 8;
  
  // Scheidingslijn
  doc.setDrawColor(COLORS.border);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Intro tekst
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  addLine('Controleer uw gegevens en kijk of alles klopt.', 9);
  addLine('Als er iets niet klopt, kunt u dit aanpassen voordat u de aanvraag vervolgt.', 9);
  yPosition += 3;

  // ============================================================================
  // AANKONDIGING SECTIE
  // ============================================================================
  
  addSection('Aankondiging');
  addField(
    'Wat wilt u aankondigen bij de gemeente?',
    data.type === 'huwelijk' ? 'Huwelijk' : 'Geregistreerd partnerschap'
  );
  closeSection();

  // ============================================================================
  // PARTNER 1 SECTIE
  // ============================================================================
  
  if (data.partner1) {
    addSection('Gegevens partner 1');
    
    addField('Voornamen', data.partner1.voornamen || 'Niet opgegeven');
    addField('Achternaam', data.partner1.achternaam || 'Niet opgegeven');
    
    if (data.partner1.geboorteNaam && data.partner1.geboorteNaam !== data.partner1.achternaam) {
      addField('Geboortenaam', data.partner1.geboorteNaam);
    }
    
    addField('Geboortedatum', data.partner1.geboortedatum || 'Niet opgegeven');
    
    if (data.partner1.plaats) {
      addField('Geboorteplaats', data.partner1.plaats);
    }
    
    if (data.partner1.adres) {
      const adresText = `${data.partner1.adres}${data.partner1.postcode ? `\n${data.partner1.postcode}` : ''}${data.partner1.plaats ? ` ${data.partner1.plaats}` : ''}`;
      addField('Adres', adresText);
    }
    
    if (data.partner1.burgerlijkeStaat) {
      addField('Burgerlijke staat', data.partner1.burgerlijkeStaat);
    }
    
    if (data.partner1.email) {
      addField('E-mailadres', data.partner1.email);
    }
    
    closeSection();
  }

  // ============================================================================
  // PARTNER 2 SECTIE
  // ============================================================================
  
  if (data.partner2) {
    addSection('Gegevens partner 2');
    
    addField('Voornamen', data.partner2.voornamen || 'Niet opgegeven');
    addField('Achternaam', data.partner2.achternaam || 'Niet opgegeven');
    
    if (data.partner2.geboorteNaam && data.partner2.geboorteNaam !== data.partner2.achternaam) {
      addField('Geboortenaam', data.partner2.geboorteNaam);
    }
    
    addField('Geboortedatum', data.partner2.geboortedatum || 'Niet opgegeven');
    
    if (data.partner2.plaats) {
      addField('Geboorteplaats', data.partner2.plaats);
    }
    
    if (data.partner2.adres) {
      const adresText = `${data.partner2.adres}${data.partner2.postcode ? `\n${data.partner2.postcode}` : ''}${data.partner2.plaats ? ` ${data.partner2.plaats}` : ''}`;
      addField('Adres', adresText);
    }
    
    if (data.partner2.burgerlijkeStaat) {
      addField('Burgerlijke staat', data.partner2.burgerlijkeStaat);
    }
    
    if (data.partner2.email) {
      addField('E-mailadres', data.partner2.email);
    }
    
    closeSection();
  }

  // ============================================================================
  // CURATELE SECTIE
  // ============================================================================
  
  if (data.curatele) {
    addSection('Curatele');
    
    const partner1Status = data.curatele.partner1UnderGuardianship
      ? 'Ja' 
      : 'Nee';
    addField(
      `Staat ${data.partner1?.voornamen || 'partner 1'} onder curatele?`,
      partner1Status
    );
    
    if (data.curatele.partner1Document) {
      const docName = typeof data.curatele.partner1Document === 'string' 
        ? data.curatele.partner1Document 
        : (data.curatele.partner1Document as { name: string }).name;
      addField('Toestemmingsformulier van de curator', docName);
    }
    
    const partner2Status = data.curatele.partner2UnderGuardianship
      ? 'Ja' 
      : 'Nee';
    addField(
      `Staat ${data.partner2?.voornamen || 'partner 2'} onder curatele?`,
      partner2Status
    );
    
    if (data.curatele.partner2Document) {
      const docName = typeof data.curatele.partner2Document === 'string' 
        ? data.curatele.partner2Document 
        : (data.curatele.partner2Document as { name: string }).name;
      addField('Toestemmingsformulier van de curator', docName);
    }
    
    closeSection();
  }

  // ============================================================================
  // KINDEREN SECTIE
  // ============================================================================
  
  if (data.kinderen) {
    addSection('Kinderen uit een ander huwelijk');
    
    // Partner 1 kinderen
    addField(
      `Heeft ${data.partner1?.voornamen || 'partner 1'} kinderen uit een ander huwelijk?`,
      data.kinderen.partner1HasChildren ? 'Ja' : 'Nee'
    );
    
    if (data.kinderen.partner1HasChildren && data.kinderen.partner1Children && data.kinderen.partner1Children.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Kinderen', margin + 3, yPosition);
      yPosition += 5;
      
      data.kinderen.partner1Children.forEach((kind, index) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.textLight);
        doc.text(
          `• ${kind.voornamen} ${kind.achternaam}, geboren op ${kind.geboortedatum}`,
          margin + 6,
          yPosition
        );
        yPosition += 5;
      });
      yPosition += 2;
    }
    
    // Partner 2 kinderen
    addField(
      `Heeft ${data.partner2?.voornamen || 'partner 2'} kinderen uit een ander huwelijk?`,
      data.kinderen.partner2HasChildren ? 'Ja' : 'Nee'
    );
    
    if (data.kinderen.partner2HasChildren && data.kinderen.partner2Children && data.kinderen.partner2Children.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text);
      doc.text('Kinderen', margin + 3, yPosition);
      yPosition += 5;
      
      data.kinderen.partner2Children.forEach((kind, index) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.textLight);
        doc.text(
          `• ${kind.voornamen} ${kind.achternaam}, geboren op ${kind.geboortedatum}`,
          margin + 6,
          yPosition
        );
        yPosition += 5;
      });
      yPosition += 2;
    }
    
    closeSection();
  }

  // ============================================================================
  // BLOEDVERWANTSCHAP SECTIE
  // ============================================================================
  
  if (data.bloedverwantschap !== undefined) {
    addSection('Bloedverwantschap');
    addField(
      'Zijn de partners bloedverwanten van elkaar?',
      data.bloedverwantschap === true || data.bloedverwantschap === 'ja' || data.bloedverwantschap.areBloodRelatives ? 'Ja' : 'Nee'
    );
    closeSection();
  }

  // ============================================================================
  // FOOTER
  // ============================================================================
  
  // Ga naar onderkant van de pagina
  const footerY = pageHeight - 25;
  
  if (yPosition > footerY - 10) {
    doc.addPage();
  }
  
  doc.setDrawColor(COLORS.border);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  
  const footerLine1 = 'Dit is een automatisch gegenereerd overzicht van uw aankondiging.';
  const footerLine2 = 'Bewaar dit document voor uw administratie.';
  
  doc.text(footerLine1, margin, footerY + 5);
  doc.text(footerLine2, margin, footerY + 9);

  return doc;
}

/**
 * Download PDF direct in de browser
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/**
 * Open PDF in een nieuwe tab
 */
export function openPDFInNewTab(doc: jsPDF): void {
  // Converteer PDF naar blob
  const pdfBlob = doc.output('blob');
  
  // Creëer een URL voor de blob
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Open in nieuwe tab
  window.open(pdfUrl, '_blank');
  
  // Cleanup URL na 100ms (genoeg tijd om te openen)
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
}

/**
 * Genereer en download aankondiging PDF in één keer
 */
export function generateAndDownloadAankondigingPDF(
  data: AankondigingData,
  dossierId: string
): void {
  const doc = generateAankondigingPDF(data, dossierId);
  const filename = `huwelijksaankondiging-${dossierId.substring(0, 8)}.pdf`;
  downloadPDF(doc, filename);
}

/**
 * Genereer en open aankondiging PDF in nieuwe tab
 */
export function generateAndOpenAankondigingPDF(
  data: AankondigingData,
  dossierId: string
): void {
  const doc = generateAankondigingPDF(data, dossierId);
  openPDFInNewTab(doc);
}

