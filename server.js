require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const cluster = require('cluster');
const os = require('os');

// Production Middlewares
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 3000;

if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`);
    
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });

} else {
    const app = express();

    // 1. Security Headers
    // Disable Content-Security-Policy temporarily if it breaks inline scripts in EJS
    app.use(helmet({
        contentSecurityPolicy: false,
    }));

    // 2. GZIP Compression
    app.use(compression());

    // 3. Rate Limiting (Global)
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 300, // Limit each IP to 300 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use('/api/', limiter); // Apply rate limiter to API routes

    // Standard Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // 4. Static Files with Caching
    app.use(express.static(path.join(__dirname, 'public'), {
        maxAge: '1d' // Cache static assets for 1 day
    }));

    // View Engine
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Mount Modular Routes
    const routes = require('./src/routes/index');
    app.use('/', routes);

    // Start Server Worker
    app.listen(PORT, () => {
        console.log(`Worker ${process.pid} started and listening on http://localhost:${PORT}`);
    });
}
