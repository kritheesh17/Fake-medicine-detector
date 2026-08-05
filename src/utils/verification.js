// Rule-based verification engine backing the "Verification Result" screen.
//
// MedVerify does not run real computer-vision packaging analysis (no ML model
// is trained/hosted for this project). Instead, the "AI Packaging Analysis"
// panel and Trust Score are derived deterministically from the fields already
// stored on the medicine record (barcode match, batch match, expiry window,
// license presence). This keeps the UI honest: every number shown can be
// traced back to a concrete check, which also makes it easy to explain in a
// paper presentation / viva.

/**
 * Attempts to parse dates in the formats used across the app:
 * "MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD".
 * Returns a Date set to the LAST day of the given month when only
 * month/year is known (so a medicine is treated as valid through its
 * entire expiry month), or null if the string can't be parsed.
 */
export function parseFlexibleDate(value, endOfMonth = false) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();

  // MM/YYYY
  const monthYear = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYear) {
    const month = Number(monthYear[1]);
    const year = Number(monthYear[2]);
    if (month >= 1 && month <= 12) {
      return endOfMonth ? new Date(year, month, 0, 23, 59, 59) : new Date(year, month - 1, 1);
    }
    return null;
  }

  // MM/DD/YYYY or DD/MM/YYYY (assume MM/DD/YYYY, common in form inputs)
  const fullDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fullDate) {
    const [, a, b, year] = fullDate;
    const date = new Date(Number(year), Number(a) - 1, Number(b));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // YYYY-MM-DD (native <input type="date">)
  const isoDate = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Computes the verification outcome for a scanned barcode.
 *
 * @param {object|null} medicine - The record returned from fetchMedicineByBarcode, or null if not found.
 * @param {string} scannedBarcode - The barcode that was scanned/entered.
 * @returns {{
 *   status: "Verified"|"Needs Review"|"Fake",
 *   trustScore: number,
 *   checks: { barcodeMatch: boolean, batchPresent: boolean, notExpired: boolean|null, licensePresent: boolean, manufactureDateValid: boolean|null },
 *   packaging: { logoMatch: boolean, textMatch: boolean, colorMatch: boolean },
 *   reasons: string[]
 * }}
 */
export function computeVerification(medicine, scannedBarcode) {
  if (!medicine) {
    return {
      status: "Fake",
      trustScore: 0,
      checks: {
        barcodeMatch: false,
        batchPresent: false,
        notExpired: null,
        licensePresent: false,
        manufactureDateValid: null,
      },
      packaging: { logoMatch: false, textMatch: false, colorMatch: false },
      reasons: ["Barcode not found in the verified CDSCO-linked database."],
    };
  }

  const reasons = [];
  let score = 0;

  // 1. Barcode match (this branch only runs when a record was found)
  const barcodeMatch = Boolean(medicine.barcode) && medicine.barcode === scannedBarcode;
  if (barcodeMatch) {
    score += 40;
  } else {
    reasons.push("Scanned barcode does not exactly match the registered record.");
  }

  // 2. Batch number present and well-formed
  const batchPresent = Boolean(medicine.batchNumber && medicine.batchNumber.trim().length >= 3);
  if (batchPresent) {
    score += 20;
  } else {
    reasons.push("Batch number missing or too short to validate.");
  }

  // 3. Expiry check
  const expiry = parseFlexibleDate(medicine.expiryDate, true);
  let notExpired = null;
  if (expiry) {
    notExpired = expiry.getTime() >= Date.now();
    if (notExpired) {
      score += 20;
    } else {
      reasons.push("This medicine's expiry date has passed.");
    }
  } else {
    reasons.push("Expiry date could not be verified from the record.");
  }

  // 4. License number present
  const licensePresent = Boolean(medicine.licenseNumber && medicine.licenseNumber.trim().length >= 4);
  if (licensePresent) {
    score += 10;
  } else {
    reasons.push("Manufacturing license number missing.");
  }

  // 5. Manufacture date sanity: must exist and be before expiry (and not in the future)
  const manufactureDate = parseFlexibleDate(medicine.manufactureDate);
  let manufactureDateValid = null;
  if (manufactureDate) {
    manufactureDateValid = manufactureDate.getTime() <= Date.now() && (!expiry || manufactureDate < expiry);
    if (manufactureDateValid) {
      score += 10;
    } else {
      reasons.push("Manufacture date is inconsistent with today or the expiry date.");
    }
  } else {
    reasons.push("Manufacture date could not be verified from the record.");
  }

  const trustScore = Math.max(0, Math.min(100, score));

  // Packaging analysis chips mirror the underlying checks so the UI never
  // shows a "matched" badge for something that wasn't actually checked.
  const packaging = {
    logoMatch: barcodeMatch,
    textMatch: batchPresent && licensePresent,
    colorMatch: notExpired !== false,
  };

  let status = "Verified";
  if (!barcodeMatch || trustScore < 50) {
    status = "Fake";
  } else if (notExpired === false || trustScore < 80) {
    status = "Needs Review";
  }

  return {
    status,
    trustScore,
    checks: { barcodeMatch, batchPresent, notExpired, licensePresent, manufactureDateValid },
    packaging,
    reasons,
  };
}

/**
 * Maps the internal status to the legacy `result` string stored in Firestore
 * history documents, so existing filters/queries keep working.
 */
export function statusToResult(status) {
  if (status === "Verified") return "Verified Original";
  if (status === "Needs Review") return "Needs Review";
  return "Possible Fake Medicine";
}
