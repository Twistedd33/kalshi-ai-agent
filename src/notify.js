import { config } from './config.js';

export async function send(title, message, { url, priority = 'default', tags = 'moneybag' } = {}) {
  if (!config.ntfyTopic) return console.log(`[ntfy disabled] ${title}: ${message}`);
  const headers = { Title: title, Priority: priority, Tags: tags };
  if (url) headers.Click = url;
  try {
    await fetch(`${config.ntfyServer}/${config.ntfyTopic}`, {
      method: 'POST', body: message, headers, signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    console.error(`ntfy failed: ${e.message}`);
  }
}
