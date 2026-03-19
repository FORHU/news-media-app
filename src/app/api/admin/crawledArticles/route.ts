import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || 'All Sources';
    const dateFilter = searchParams.get('date') || 'All Time';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
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
