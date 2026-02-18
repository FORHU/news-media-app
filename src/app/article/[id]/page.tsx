import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) notFound();

  if (!prisma) notFound();

  const row = await prisma.contentArticle.findUnique({
    where: { id: numId },
    include: { category: true },
  });

  if (!row) notFound();

  const formattedDate = new Date(row.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const imageUrl =
    row.imageUrl ??
    `https://placehold.co/800x400/e5e7eb/9ca3af?text=${encodeURIComponent(row.title.slice(0, 30))}`;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#ff4500] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <article>
          <header>
            <span className="inline-block px-2 py-0.5 bg-[#ff4500] text-white rounded text-xs font-semibold uppercase mb-4">
              {row.category.categoryName}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {row.title}
            </h1>
            <p className="text-gray-500">{formattedDate}</p>
            <div className="mt-6 rounded-xl overflow-hidden bg-gray-200">
              <img
                src={imageUrl}
                alt={row.title}
                className="w-full h-auto object-cover"
              />
            </div>
          </header>
          <div className="mt-8 text-gray-700 leading-relaxed whitespace-pre-wrap">
            {row.content}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
