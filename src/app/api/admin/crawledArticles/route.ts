import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

const DATE_PRESETS = ['All Time', 'Today', 'Last 7 Days', 'This Month'] as const;

const QuerySchema = z
    .object({
        source: z.string().optional().default('All Sources'),
        date: z.enum(DATE_PRESETS).optional().default('All Time'),
        from: z
            .string()
            .optional()
            .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), { message: 'Invalid from date' }),
        to: z
            .string()
            .optional()
            .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), { message: 'Invalid to date' }),
        q: z.string().optional().default(''),
        page: z
            .preprocess((v) => (typeof v === 'string' ? Number.parseInt(v, 10) : v), z.number().int().min(1))
            .optional()
            .default(1),
        limit: z
            .preprocess((v) => (typeof v === 'string' ? Number.parseInt(v, 10) : v), z.number().int().min(1).max(100))
            .optional()
            .default(10)
    })
    .superRefine((val, ctx) => {
        if ((val.from || val.to) && val.date !== 'All Time') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Use either from/to range OR date preset, not both',
                path: ['date']
            });
        }
    });

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const parsed = QuerySchema.safeParse({
        source: searchParams.get('source') ?? undefined,
        date: searchParams.get('date') ?? undefined,
        from: searchParams.get('from') ?? undefined,
        to: searchParams.get('to') ?? undefined,
        q: searchParams.get('q') ?? undefined,
        page: searchParams.get('page') ?? undefined,
        limit: searchParams.get('limit') ?? undefined
    });

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: 'Invalid query parameters',
                details: parsed.error.flatten()
            },
            { status: 400 }
        );
    }

    const { source, date: dateFilter, from, to, q, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    try {
        // Build the base query for counting and fetching
        let query = supabase
            .from('raw_articles')
            .select(`
                *,
                category:categories(*),
                crawledUrl:crawled_urls(*),
                contentArticle:content_articles(id)
            `, { count: 'exact' });

        // Apply Date Filter (range takes precedence over presets)
        if (from || to) {
            if (from) {
                const fromStart = new Date(from);
                fromStart.setHours(0, 0, 0, 0);
                if (!Number.isNaN(fromStart.getTime())) query = query.gte('created_at', fromStart.toISOString());
            }
            if (to) {
                const toEnd = new Date(to);
                toEnd.setHours(23, 59, 59, 999);
                if (!Number.isNaN(toEnd.getTime())) query = query.lte('created_at', toEnd.toISOString());
            }
        } else {
            const now = new Date();
            if (dateFilter === 'Today') {
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                query = query.gte('created_at', today);
            } else if (dateFilter === 'Last 7 Days') {
                const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                query = query.gte('created_at', lastWeek);
            } else if (dateFilter === 'This Month') {
                const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                query = query.gte('created_at', firstOfMonth);
            }
        }

        if (source !== 'All Sources') {
            query = query.filter('crawledUrl.url', 'ilike', `%${source}%`);
        }

        if (q) {
            query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
        }

        // Apply pagination and ordering
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        // Fetch unique sources for the filter (always fetch all for the dropdown)
        const { data: sourcesData } = await supabase
            .from('crawled_urls')
            .select('url');

        const uniqueSources = ['All Sources', ...new Set((sourcesData || []).map((s: { url: string }) => {
            try {
                return new URL(s.url).hostname.replace('www.', '');
            } catch {
                return s.url;
            }
        }) || [])];

        interface RawArticleSupabase {
            id: string;
            title: string;
            content: string | null;
            image_url: string | null;
            publish_date: string | null;
            created_at: string;
            status: string;
            category: { category_name: string } | null;
            crawledUrl: { url: string } | null;
            contentArticle: { id: string }[] | { id: string } | null;
        }

        // Map data to match the component's expected structure
        const articles = ((data as unknown as RawArticleSupabase[]) || []).map((article) => {
            const rawImg = article.image_url;
            const imageUrl = typeof rawImg === 'string' && rawImg.trim().length > 0 ? rawImg.trim() : null;
            return {
                id: article.id,
                title: article.title,
                content: article.content,
                imageUrl,
                publishDate: article.publish_date,
                createdAt: article.created_at,
                status: article.status,
                category: {
                    categoryName: article.category?.category_name || 'Uncategorized'
                },
                crawledUrl: {
                    url: article.crawledUrl?.url || ''
                },
                contentArticle: Array.isArray(article.contentArticle)
                    ? (article.contentArticle[0] || null)
                    : (article.contentArticle || null)
            };
        });

        return NextResponse.json({
            articles,
            sources: uniqueSources,
            pagination: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching crawled articles from Supabase SDK:', error);
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}
