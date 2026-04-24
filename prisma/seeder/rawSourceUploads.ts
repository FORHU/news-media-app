import type { PrismaClient } from "../../src/generated/prisma/client";

export async function seedRawSourceUploads(prisma: PrismaClient): Promise<string[]> {
  const makeCuid = () =>
    `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random()
      .toString(36)
      .slice(2, 10)}`.slice(0, 25);

  const seed = [
    {
      s3ImageUrl: "https://placehold.co/1200x675/png",
      language: "en",
      extractedText:
        "Sample OCR extracted text from an uploaded image. Used to test the upload source pipeline.",
      prompt: "Convert this extracted text into a publishable article.",
    },
  ] as const;

  const createdIds: string[] = [];

  for (const u of seed) {
    const existing = (await prisma.$queryRaw<
      Array<{ id: string }>
    >`SELECT id FROM raw_source_uploads WHERE s3_image_url = ${u.s3ImageUrl} AND extracted_text = ${u.extractedText} LIMIT 1`)?.[0];
    if (existing?.id) {
      createdIds.push(existing.id);
      continue;
    }

    const id = makeCuid();
    await prisma.$executeRaw`
      INSERT INTO raw_source_uploads (
        id,
        prompt,
        s3_image_url,
        language,
        extracted_text,
        created_at,
        updated_at
      ) VALUES (
        ${id},
        ${u.prompt},
        ${u.s3ImageUrl},
        ${u.language},
        ${u.extractedText},
        now(),
        now()
      )
    `;
    createdIds.push(id);
  }

  return createdIds;
}

