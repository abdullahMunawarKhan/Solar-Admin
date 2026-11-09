import assert from 'assert';
import { generateArticleHtml, generateBlogsListingHtml, updateSitemapXml, removeUrlFromSitemap } from './api/lib/html-generator.js';
import publishHandler from './netlify/functions/publish-blog.js';
import unpublishHandler from './netlify/functions/unpublish-blog.js';

async function runTests() {
  console.log('=== STARTING AUTOMATED TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. HTML Generator Tests
  console.log('--- 1. HTML Generator & Branding Tests ---');
  test('generateArticleHtml includes Proud Indian Solar branding and canonical URL', () => {
    const blog = {
      title: 'Solar Energy Revolution in India',
      slug: 'solar-energy-revolution-in-india',
      excerpt: 'Comprehensive guide to rooftop solar subsidies.',
      content_html: '<p>Solar panels are changing the future of clean energy.</p>',
      author_name: 'Solar Expert',
      category: 'Residential Solar',
      published_at: '2026-03-01T12:00:00Z',
    };

    const html = generateArticleHtml(blog, {
      siteOrigin: 'https://www.proudindiansolar.com',
      blogDirectory: 'blog',
    });

    assert(html.includes('Proud Indian Solar'), 'Missing Proud Indian Solar branding');
    assert(html.includes('https://www.proudindiansolar.com/blog/solar-energy-revolution-in-india.html'), 'Missing canonical URL');
    assert(html.includes('Solar Energy Revolution in India'), 'Missing title');
    assert(html.includes('Comprehensive guide to rooftop solar subsidies.'), 'Missing meta description');
    assert(!html.includes('example.com'), 'Contains obsolete example.com');
    assert(!html.includes('Solar &amp; Renewable Solutions'), 'Contains old branding');
  });

  test('generateBlogsListingHtml creates listing with Proud Indian Solar branding', () => {
    const blogs = [
      {
        id: '1',
        title: 'Solar ROI Analysis',
        slug: 'solar-roi-analysis',
        excerpt: 'Payback period in 2026.',
        category: 'Commercial',
        published_at: '2026-03-01T12:00:00Z',
      },
    ];

    const listingHtml = generateBlogsListingHtml(blogs, null, {
      siteOrigin: 'https://www.proudindiansolar.com',
      blogDirectory: 'blog',
    });

    assert(listingHtml.includes('Proud Indian Solar'), 'Missing Proud Indian Solar in listing');
    assert(listingHtml.includes('Solar ROI Analysis'), 'Missing blog card title');
    assert(listingHtml.includes('/blog/solar-roi-analysis.html'), 'Missing blog link');
    assert(!listingHtml.includes('example.com'), 'Listing contains example.com');
  });

  test('updateSitemapXml and removeUrlFromSitemap manage sitemap entries correctly', () => {
    const canonical = 'https://www.proudindiansolar.com/blog/test-solar-post.html';
    const sitemap1 = updateSitemapXml(null, canonical, '2026-03-01');
    assert(sitemap1.includes(canonical), 'Sitemap missing canonical URL');
    assert(sitemap1.includes('2026-03-01'), 'Sitemap missing lastmod');

    const sitemap2 = removeUrlFromSitemap(sitemap1, canonical);
    assert(!sitemap2.includes(canonical), 'Sitemap failed to remove canonical URL');
  });

  // 2. Netlify Functions v2 Direct Contract Tests
  console.log('\n--- 2. Netlify Functions Contract Tests ---');

  await testAsync('publish-blog rejects GET requests with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost:8888/api/publish-blog', { method: 'GET' });
    const res = await publishHandler(req, {});
    assert.strictEqual(res.status, 405);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  await testAsync('publish-blog responds to OPTIONS with 204 CORS headers', async () => {
    const req = new Request('http://localhost:8888/api/publish-blog', { method: 'OPTIONS' });
    const res = await publishHandler(req, {});
    assert.strictEqual(res.status, 204);
    assert(res.headers.get('Access-Control-Allow-Methods').includes('POST'));
  });

  await testAsync('publish-blog rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost:8888/api/publish-blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId: 'some-uuid' }),
    });
    const res = await publishHandler(req, {});
    assert.strictEqual(res.status, 401, `Expected status 401, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert(json.error.includes('Authorization header'), `Unexpected error message: ${json.error}`);
  });

  await testAsync('unpublish-blog rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost:8888/api/unpublish-blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId: 'some-uuid' }),
    });
    const res = await unpublishHandler(req, {});
    assert.strictEqual(res.status, 401, `Expected status 401, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert(json.error.includes('Authorization header'), `Unexpected error message: ${json.error}`);
  });

  await testAsync('publish-blog rejects invalid Bearer tokens with 401 when Supabase is initialized', async () => {
    process.env.SUPABASE_URL = 'https://mock-solar-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-test-value';
    const req = new Request('http://localhost:8888/api/publish-blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token-mock-12345',
      },
      body: JSON.stringify({ blogId: 'test-id' }),
    });
    const res = await publishHandler(req, {});
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert(json.error.toLowerCase().includes('token') || json.error.toLowerCase().includes('session'));
  });

  // 3. Removal of Simulated Publishing Test
  console.log('\n--- 3. Verification of Zero Simulated Publishing ---');
  await testAsync('Missing GITHUB_TOKEN produces error rather than simulated success', async () => {
    delete process.env.GITHUB_TOKEN;
    const { getGitHubConfig } = await import('./api/lib/github.js');
    const config = getGitHubConfig();
    assert.strictEqual(config.token, undefined);
    assert.strictEqual(config.owner, 'abdullahMunawarKhan');
    assert.strictEqual(config.repo, 'Solar-Agency-');

    const { commitFilesToRepo } = await import('./api/lib/github.js');
    await assert.rejects(
      async () => {
        await commitFilesToRepo([{ path: 'test.html', content: 'test' }], 'Test commit');
      },
      /GITHUB_TOKEN environment variable is not configured/
    );
  });

  // 4. HTTP Server Endpoints Test (Local workflow)
  console.log('\n--- 4. Local HTTP Server Integration Tests ---');
  await testAsync('Server.js routes /api/publish-blog and /api/unpublish-blog via adapter', async () => {
    process.env.PORT = '3098';
    const { server } = await import('./server.js');
    
    // Give server a moment to bind
    await new Promise((r) => setTimeout(r, 200));

    // Test unauthenticated call to server endpoint
    const postRes = await fetch('http://localhost:3098/api/publish-blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId: 'test-uuid' }),
    });

    assert.strictEqual(postRes.status, 401, `Expected 401 from server endpoint, got ${postRes.status}`);
    const postJson = await postRes.json();
    assert.strictEqual(postJson.success, false);

    // Test unpublish endpoint
    const unpubRes = await fetch('http://localhost:3098/api/unpublish-blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId: 'test-uuid' }),
    });
    assert.strictEqual(unpubRes.status, 401, `Expected 401 from unpublish endpoint, got ${unpubRes.status}`);

    // Test 404 for unknown route
    const notFoundRes = await fetch('http://localhost:3098/api/unknown-endpoint');
    assert.strictEqual(notFoundRes.status, 404);

    await new Promise((r) => server.close(r));
  });

  console.log(`\n=== ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});
