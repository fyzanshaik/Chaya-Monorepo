import { prisma } from '@chaya/shared';

export async function generateSurveyNumber(): Promise<string> {
  let isUnique = false;
  let surveyNumber = '';

  while (!isUnique) {
    const letters = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const numbers = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
    surveyNumber = `${letters}${numbers}`;
    const exists = await prisma.farmer.findUnique({
      where: { surveyNumber },
    });
    if (!exists) isUnique = true;
  }

  return surveyNumber;
}

export function generateBatchCode(crop: string, date: Date, lotNo: number): string {
  const cropCode = crop.slice(0, 3).toUpperCase();
  const dateCode = date.toISOString().split('T')[0].replace(/-/g, '');
  const lotCode = lotNo.toString();

  const base = `${cropCode}${dateCode}${lotCode}`;
  const batchCode = base.padEnd(11, '0');

  return batchCode;
}

export async function generateProcessingBatchCode(
  crop: string,
  lotNo: number,
  dateOfProcessing: Date
): Promise<string> {
  const cropCode = crop.slice(0, 3).toUpperCase();
  const dateCode = dateOfProcessing.toISOString().split('T')[0].replace(/-/g, '');
  const lotStr = lotNo.toString();

  let isUnique = false;
  let uniqueSuffix = '';
  let processingBatchCode = '';

  while (!isUnique) {
    uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    processingBatchCode = `PBC-${cropCode}-${lotStr}-${dateCode}-${uniqueSuffix}`;

    const exists = await prisma.processingBatch.findUnique({
      where: { batchCode: processingBatchCode },
    });
    if (!exists) isUnique = true;
  }
  return processingBatchCode;
}
