SELECT tenants.domain, content_articles.status, COUNT(*) 
FROM content_articles 
JOIN tenants ON content_articles.tenant_id = tenants.id 
GROUP BY tenants.domain, content_articles.status;
