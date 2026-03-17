import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabase
            .from('crawl_jobs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        const jobs = (data || []).map((job) => ({
            id: job.id,
            status: job.status || 'Pending',
            urls: Array.isArray(job.urls) ? job.urls : (typeof job.urls === 'string' && job.urls ? [job.urls] : []),
            maxArticlesRequest: typeof job.max_articles_request === 'number' ? job.max_articles_request : 0,
            articlesSaved: typeof job.articles_saved === 'number' ? job.articles_saved : 0,
            createdAt: job.created_at,
            startedAt: job.started_at,
            finishedAt: job.finished_at,
        }));

        return NextResponse.json({ 
            jobs,
            pagination: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching crawl jobs from Supabase:', error);
        return NextResponse.json({ error: 'Failed to fetch crawl jobs' }, { status: 500 });
    }
}
