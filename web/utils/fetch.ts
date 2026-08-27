// Framework-free fetch helpers shared by the viewer page and the admin.
// They live outside utils/apis.ts so viewer-path code (e.g. the chat service)
// does not drag the admin API barrel — and its dependencies like semver —
// into the boot bundle.

/* eslint-disable prefer-destructuring */
const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
const ADMIN_STREAMKEY = process.env.NEXT_PUBLIC_ADMIN_STREAMKEY;

export const ADMIN_CSRF_HEADER = 'X-Owncast-CSRF-Protection';

export interface FetchOptions {
  data?: any;
  method?: string;
  auth?: boolean;
}

export function extractAPIErrorMessage(status: number, body?: any, fallbackText = '') {
  if (body && typeof body === 'object') {
    if (typeof body.error === 'string' && body.error.trim() !== '') {
      return body.error;
    }
    if (typeof body.message === 'string' && body.message.trim() !== '') {
      return body.message;
    }
  }

  if (fallbackText.trim() !== '') {
    return fallbackText;
  }

  return `An error has occurred: ${status}`;
}

export async function fetchData<T = any>(url: string, options?: FetchOptions): Promise<T> {
  const { data, method = 'GET', auth = true } = options || {};

  // eslint-disable-next-line no-undef
  const requestOptions: RequestInit = {
    method,
  };

  const headers: Record<string, string> = {};
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    headers[ADMIN_CSRF_HEADER] = '1';
  }

  if (data) {
    requestOptions.body = JSON.stringify(data);
  }

  requestOptions.headers = headers;

  if (auth && ADMIN_USERNAME && ADMIN_STREAMKEY) {
    const encoded = btoa(`${ADMIN_USERNAME}:${ADMIN_STREAMKEY}`);
    headers.Authorization = `Basic ${encoded}`;
    requestOptions.mode = 'cors';
    requestOptions.credentials = 'include';
  }

  const response = await fetch(url, requestOptions);
  const text = await response.text();
  let json: T = {} as T;
  if (text) {
    try {
      json = JSON.parse(text) as T;
    } catch {
      if (response.ok) {
        throw new Error('Invalid JSON response from server');
      }
    }
  }

  if (!response.ok) {
    throw new Error(extractAPIErrorMessage(response.status, json, text));
  }
  return json;
}

export async function getUnauthedData(url: string, options?: FetchOptions) {
  const opts = {
    method: 'GET',
    auth: false,
    ...options,
  };
  return fetchData(url, opts);
}
