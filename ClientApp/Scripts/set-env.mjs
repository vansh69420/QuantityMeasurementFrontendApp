import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const apiBaseUrl = process.env.NG_APP_API_BASE_URL;

if (!apiBaseUrl || !apiBaseUrl.trim()) {
  console.error('Missing required environment variable: NG_APP_API_BASE_URL');
  process.exit(1);
}

const outputPath = 'src/environments/environment.prod.ts';
const outputDir = dirname(outputPath);

mkdirSync(outputDir, { recursive: true });

const fileContent = `export const environment = {
  production: true,
  apiBaseUrl: '${apiBaseUrl.trim()}'
};
`;

writeFileSync(outputPath, fileContent, { encoding: 'utf8' });

console.log(`Generated ${outputPath} with NG_APP_API_BASE_URL=${apiBaseUrl.trim()}`);
