import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as os from 'os';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for quizsink.duckdns.org (production
	// and localhost:3000 (development)
	app.enableCors({
		origin: [
			'https://quizsink.duckdns.org',
			'https://quiz-show-chi.vercel.app',
			'http://localhost:3000',
		],
		credentials: true, // Allow credentials (cookies, authorization headers)
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
		exposedHeaders: ['Authorization'],
	});

	app.useGlobalPipes(
		new ValidationPipe({
				whitelist: true, // Don't allow undecorated props
				forbidNonWhitelisted: true, // throws if extra props are present
				transform: true, // auto-transforms types (e.g., string -> number). Can be less safe, but convenient for rapid development 
			}));

	const port = process.env.PORT || 5200;
	await app.listen(
		port,
		'0.0.0.0',
	);

    const networkInterfaces = os.networkInterfaces();
    const urls: string[] = [];
    
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        if (interfaces) {
            for (const iface of interfaces) {
                 if (iface.family === 'IPv4' && !iface.internal) {
                    urls.push(`http://${iface.address}:${port}`);
                 }
            }
        }
    }

	console.log(`Server running on http://0.0.0.0:${port}`);
    if (urls.length > 0) {
        console.log(`Network URLs:`);
        urls.forEach(url => console.log(` - ${url}`));
    }
}

/* 
 * Litterally just calls bootstrap() and ignores the returned promise
 * 
 * We can't make bootstrap() of type void because async functions always return a promise
 * and only calling bootstrap() would lead to an unsafe call of an `error` typed value.
*/
void bootstrap(); 