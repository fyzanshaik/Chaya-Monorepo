import { prisma } from "@chaya/shared";

export async function generateSurveyNumber(): Promise<string> {
  let isUnique = false;
  let surveyNumber = "";

  while (!isUnique) {
    const letters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");
    const numbers = String(Math.floor(Math.random() * 10000000)).padStart(
      7,
      "0"
    );
    surveyNumber = `${letters}${numbers}`;
    const exists = await prisma.farmer.findUnique({
      where: { surveyNumber },
    });
    if (!exists) isUnique = true;
  }

  return surveyNumber;
}

export function generateBatchCode(
  crop: string,
  date: Date,
  lotNo: number
): string {
  const cropCode = crop.slice(0, 3).toUpperCase();
  const dateCode = date.toISOString().split("T")[0].replace(/-/g, "");
  const lotCode = lotNo.toString();

  const batchCode = `${cropCode}${dateCode}${lotCode}`.padEnd(11, "0");

  return batchCode;
}
