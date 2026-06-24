const handler = require('./dist/src/vercel.js').default;
handler({ method: 'GET', url: '/' }, { status: (c) => ({ json: (d) => console.log(d) }), end: () => console.log('end') });
