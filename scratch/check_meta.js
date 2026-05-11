const https = require('https');

const urls = [
    "https://jejutime.com/",
    "https://jejuqq.com/",
    "https://jejujapan.com/"
];

async function checkUrl(url) {
    return new Promise((resolve) => {
        console.log(`\n--- ${url} ---`);
        https.get(url, (res) => {
            console.log(`Status: ${res.statusCode}`);
            if (res.headers.location) console.log(`Redirect to: ${res.headers.location}`);
            
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const head = data.split('</head>')[0];
                const metaTags = head.match(/<meta[^>]+>/g) || [];
                metaTags.forEach(tag => {
                    if (tag.includes('og:') || tag.includes('twitter:')) {
                        console.log(tag);
                    }
                });
                resolve();
            });
        }).on('error', (err) => {
            console.error(`Error: ${err.message}`);
            resolve();
        });
    });
}

async function run() {
    for (const url of urls) {
        await checkUrl(url);
    }
}

run();
