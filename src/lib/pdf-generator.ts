import { jsPDF } from 'jspdf';
import type { GenerateTravelPlanOutput } from '@/ai/flows/generate-travel-plan';
import type { GenerateLocalTravelSuggestionsOutput } from '@/ai/flows/generate-local-travel-suggestions';

export function exportPlanToPdf(plan: GenerateTravelPlanOutput, destinationName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      y = margin + 5;
      renderPageHeader();
    }
  };

  const renderPageHeader = () => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`JourneyAI Travel Plan | ${plan.tripTitle || destinationName}`, margin, margin);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
    y = margin + 7;
  };

  // --- COVER / HEADER BANNER ---
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'F');

  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('JOURNEYAI • PERSONALIZED TRAVEL ITINERARY', margin + 6, y + 8);

  doc.setFontSize(16);
  const title = plan.tripTitle || `Trip to ${destinationName}`;
  const splitTitle = doc.splitTextToSize(title, contentWidth - 12);
  doc.text(splitTitle[0] || title, margin + 6, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const daysCount = plan.dailyItinerary?.length || 0;
  const metaText = `Destination: ${destinationName}  |  Duration: ${daysCount} Days  |  Est. Budget: ${plan.currency} ${plan.estimatedCost?.toLocaleString() || 'N/A'}`;
  doc.text(metaText, margin + 6, y + 27);

  y += 40;

  // --- TRIP OVERVIEW ---
  if (plan.overallSummary) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Trip Overview', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(plan.overallSummary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.5 + 4;
  }

  // --- TRANSPORTATION & LOGISTICS ---
  if (plan.transportationDetails) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Transportation & Logistics', margin, y);
    y += 5;

    const { gettingToDestination, localTransportInDestination, interCityTravel } =
      plan.transportationDetails;

    if (gettingToDestination) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('• Getting There:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(gettingToDestination, contentWidth - 30);
      doc.text(lines, margin + 28, y);
      y += lines.length * 4.2 + 2;
    }

    if (localTransportInDestination) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('• Getting Around:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(localTransportInDestination, contentWidth - 30);
      doc.text(lines, margin + 28, y);
      y += lines.length * 4.2 + 2;
    }

    if (interCityTravel) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('• Inter-City:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(interCityTravel, contentWidth - 30);
      doc.text(lines, margin + 28, y);
      y += lines.length * 4.2 + 2;
    }
    y += 3;
  }

  // --- ACCOMMODATION ---
  if (plan.accommodationRecommendations && plan.accommodationRecommendations.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Recommended Accommodation', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    plan.accommodationRecommendations.forEach((item) => {
      checkPageBreak(10);
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.2 + 1;
    });
    y += 3;
  }

  // --- DAILY ITINERARY ---
  if (plan.dailyItinerary && plan.dailyItinerary.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Day-by-Day Itinerary', margin, y);
    y += 6;

    plan.dailyItinerary.forEach((day) => {
      checkPageBreak(30);

      // Day Header box
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);

      const dayTitle = `Day ${day.day}: ${day.theme || (day.date ? day.date : '')}`;
      doc.text(dayTitle, margin + 3, y + 5.5);
      y += 11;

      if (day.dailySummary) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const daySummaryLines = doc.splitTextToSize(day.dailySummary, contentWidth - 4);
        doc.text(daySummaryLines, margin + 2, y);
        y += daySummaryLines.length * 4 + 3;
      }

      const renderActivityGroup = (timeSlot: string, activities?: typeof day.morningActivities) => {
        if (!activities || activities.length === 0) return;
        checkPageBreak(18);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text(timeSlot, margin + 2, y);
        y += 4;

        activities.forEach((act) => {
          checkPageBreak(15);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);

          const actMeta = act.estimatedDuration ? ` (${act.estimatedDuration})` : '';
          doc.text(`- ${act.name}${actMeta}`, margin + 5, y);
          y += 3.8;

          if (act.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            const descLines = doc.splitTextToSize(act.description, contentWidth - 10);
            doc.text(descLines, margin + 7, y);
            y += descLines.length * 3.6 + 1.5;
          }

          if (act.notes) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            const notesLines = doc.splitTextToSize(`Tip: ${act.notes}`, contentWidth - 10);
            doc.text(notesLines, margin + 7, y);
            y += notesLines.length * 3.4 + 1.5;
          }
        });
        y += 2;
      };

      renderActivityGroup('Morning', day.morningActivities);
      renderActivityGroup('Afternoon', day.afternoonActivities);
      renderActivityGroup('Evening', day.eveningActivities);

      y += 3;
    });
  }

  // --- PACKING LIST ---
  if (plan.packingList && plan.packingList.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Packing Suggestions', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    plan.packingList.forEach((item) => {
      checkPageBreak(8);
      const lines = doc.splitTextToSize(`[  ]  ${item}`, contentWidth - 6);
      doc.text(lines, margin + 3, y);
      y += lines.length * 3.8 + 1;
    });
    y += 3;
  }

  // --- TIPS & CUSTOMS ---
  if (plan.localCustomsOrTips && plan.localCustomsOrTips.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Local Customs & Etiquette', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    plan.localCustomsOrTips.forEach((tip) => {
      checkPageBreak(8);
      const lines = doc.splitTextToSize(`• ${tip}`, contentWidth - 6);
      doc.text(lines, margin + 3, y);
      y += lines.length * 3.8 + 1;
    });
    y += 3;
  }

  // --- EMERGENCY CONTACTS ---
  if (plan.emergencyContacts && plan.emergencyContacts.length > 0) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Emergency Contacts', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    plan.emergencyContacts.forEach((contact) => {
      checkPageBreak(8);
      doc.text(`• ${contact.name}: ${contact.number}`, margin + 3, y);
      y += 4;
    });
  }

  // --- FOOTER FOR ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by JourneyAI', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
  }

  // Sanitize filename
  const cleanDestination = destinationName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `JourneyAI_${cleanDestination}_Itinerary.pdf`;
  doc.save(filename);
}

export function exportLocalSuggestionsToPdf(
  suggestions: GenerateLocalTravelSuggestionsOutput,
  locationName: string,
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      y = margin + 5;
      renderPageHeader();
    }
  };

  const renderPageHeader = () => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`JourneyAI Local Explorer | ${suggestions.title || locationName}`, margin, margin);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
    y = margin + 7;
  };

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'F');

  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('JOURNEYAI • LOCAL EXPLORER GUIDE', margin + 6, y + 8);

  doc.setFontSize(15);
  const title = suggestions.title || `Local Spots in ${locationName}`;
  const splitTitle = doc.splitTextToSize(title, contentWidth - 12);
  doc.text(splitTitle[0] || title, margin + 6, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const spotsCount = suggestions.suggestedItinerary?.length || 0;
  const metaText = `Location: ${locationName}  |  Recommended Spots: ${spotsCount} Places`;
  doc.text(metaText, margin + 6, y + 27);

  y += 40;

  // Introduction
  if (suggestions.introduction) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Overview', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const introLines = doc.splitTextToSize(suggestions.introduction, contentWidth);
    doc.text(introLines, margin, y);
    y += introLines.length * 4.5 + 4;
  }

  // Suggested Activities
  if (suggestions.suggestedItinerary && suggestions.suggestedItinerary.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Recommended Local Activities & Places', margin, y);
    y += 6;

    suggestions.suggestedItinerary.forEach((item, index) => {
      checkPageBreak(35);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);

      const itemTitle = `${index + 1}. ${item.name} (${item.category}${item.specificType ? ` - ${item.specificType}` : ''})`;
      doc.text(itemTitle, margin + 3, y + 5.5);
      y += 11;

      // Meta details (Duration, Address, Hours, Cost, Booking)
      const meta = [
        item.estimatedDuration ? `Duration: ${item.estimatedDuration}` : '',
        item.openingHours ? `Hours: ${item.openingHours}` : '',
        item.estimatedCost ? `Cost: ${item.estimatedCost}` : '',
        item.bookingNeeded ? `Booking: ${item.bookingNeeded}` : '',
      ]
        .filter(Boolean)
        .join('  |  ');

      if (meta) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text(meta, margin + 3, y);
        y += 4;
      }

      if (item.address) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Location: ${item.address}`, margin + 3, y);
        y += 4;
      }

      if (item.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(item.description, contentWidth - 6);
        doc.text(descLines, margin + 3, y);
        y += descLines.length * 3.8 + 2;
      }

      if (item.reasonWhySuggested) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(14, 116, 144);
        const fitLines = doc.splitTextToSize(
          `Why it fits: ${item.reasonWhySuggested}`,
          contentWidth - 6,
        );
        doc.text(fitLines, margin + 3, y);
        y += fitLines.length * 3.6 + 2;
      }

      y += 3;
    });
  }

  // Alternative Option
  if (suggestions.alternativeSuggestion) {
    const alt = suggestions.alternativeSuggestion;
    checkPageBreak(30);

    doc.setFillColor(254, 243, 199); // Amber 100
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text(`Alternative Spot: ${alt.name}`, margin + 3, y + 5.5);
    y += 11;

    if (alt.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const altLines = doc.splitTextToSize(alt.description, contentWidth - 6);
      doc.text(altLines, margin + 3, y);
      y += altLines.length * 3.8 + 3;
    }
  }

  // Time Management Notes
  if (suggestions.overallTimeManagementNotes) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Time Management & Route Notes', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const tm = doc.splitTextToSize(suggestions.overallTimeManagementNotes, contentWidth);
    doc.text(tm, margin, y);
    y += tm.length * 4 + 3;
  }

  // Transportation Advice
  if (suggestions.transportationAdvice) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Transportation Advice', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const ta = doc.splitTextToSize(suggestions.transportationAdvice, contentWidth);
    doc.text(ta, margin, y);
    y += ta.length * 4 + 3;
  }

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by JourneyAI Local Explorer', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
  }

  const cleanLoc = locationName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`JourneyAI_Local_${cleanLoc}_Guide.pdf`);
}
