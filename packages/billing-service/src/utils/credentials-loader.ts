/**
 * OAuth Credentials Loader
 * 
 * Loads OAuth credentials from JSON file or environment variables.
 * Supports both Metronome OAuth format and Google service account format.
 */

import * as fs from 'fs';
import * as path from 'path';
import { MetronomeOAuthCredentials } from '@metronome-integration/types';

export interface CredentialsFile {
  // Metronome OAuth format
  client_id?: string;
  client_secret?: string;
  token_url?: string;
  scope?: string;
  
  // Google service account format (for reference, not directly used)
  type?: string;
  project_id?: string;
  private_key?: string;
  client_email?: string;
  auth_uri?: string;
  token_uri?: string;
}

/**
 * Load OAuth credentials from JSON file or environment variables
 */
export function loadOAuthCredentials(
  credentialsPath?: string
): MetronomeOAuthCredentials {
  let credentials: CredentialsFile = {};

  // Try to load from JSON file if path is provided
  if (credentialsPath) {
    try {
      const fullPath = path.isAbsolute(credentialsPath)
        ? credentialsPath
        : path.join(process.cwd(), credentialsPath);

      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        credentials = JSON.parse(fileContent);
        console.log(`✅ Loaded OAuth credentials from: ${fullPath}`);
      } else {
        console.warn(`⚠️  Credentials file not found: ${fullPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load credentials file: ${error}`);
    }
  }

  // Fall back to environment variables or use file values
  const metronomeCredentials: MetronomeOAuthCredentials = {
    client_id:
      credentials.client_id ||
      process.env.METRONOME_OAUTH_CLIENT_ID ||
      '',
    client_secret:
      credentials.client_secret ||
      process.env.METRONOME_OAUTH_CLIENT_SECRET ||
      '',
    token_url:
      credentials.token_url ||
      credentials.token_uri || // Support Google format token_uri
      process.env.METRONOME_OAUTH_TOKEN_URL ||
      'http://localhost:3001/oauth/token',
    scope:
      credentials.scope ||
      process.env.METRONOME_OAUTH_SCOPE ||
      'billing:read billing:write',
  };

  // Validate required fields
  if (!metronomeCredentials.client_id || !metronomeCredentials.client_secret) {
    console.warn(
      '⚠️  OAuth credentials incomplete. Using defaults for mock server.'
    );
    console.warn(
      '   Set METRONOME_OAUTH_CLIENT_ID and METRONOME_OAUTH_CLIENT_SECRET in .env or provide credentials JSON file.'
    );
  }

  return metronomeCredentials;
}

/**
 * Expected Metronome OAuth credentials JSON format:
 * 
 * {
 *   "client_id": "your_client_id",
 *   "client_secret": "your_client_secret",
 *   "token_url": "http://localhost:3001/oauth/token",
 *   "scope": "billing:read billing:write"
 * }
 */
export const EXPECTED_CREDENTIALS_FORMAT = {
  client_id: 'string - OAuth client ID',
  client_secret: 'string - OAuth client secret',
  token_url: 'string - OAuth token endpoint URL',
  scope: 'string (optional) - OAuth scope',
};


