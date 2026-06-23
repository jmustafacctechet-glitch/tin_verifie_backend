import * as cheerio from 'cheerio';
import { EtradeScrapeResult } from './types';

export class EtradeScraper {
  scrapeLicensePage(html: string): EtradeScrapeResult {
    const $ = cheerio.load(html);

    const businessName = this.extractText($, 'businessName', 'business_name', 'company-name');
    const licenseStatus = this.extractText($, 'licenseStatus', 'license_status', 'status');
    const tin = this.extractText($, 'tin', 'TIN', 'tin-number');
    const phone = this.extractText($, 'phone', 'phoneNumber', 'phone-number');

    if (!businessName || businessName.length === 0) {
      return this.fallbackScrape($, html);
    }

    return {
      businessName: businessName || 'Unknown Business',
      licenseStatus: licenseStatus || 'Unknown',
      tin: tin || '',
      phone: phone || undefined,
      rawHtml: html,
    };
  }

  private fallbackScrape(
    $: cheerio.CheerioAPI,
    html: string,
  ): EtradeScrapeResult {
    const bodyText = $('body').text();

    const businessName = this.guessField(bodyText, [
      'business name',
      'company name',
      'business_name',
      'ባለሙያ',
      'ድርጅት',
    ]);

    const licenseStatus = this.guessField(bodyText, [
      'status',
      'license status',
      'license_status',
    ]);

    const tin = this.guessField(bodyText, ['tin', 'tin number', 'TIN']);

    const phoneMatch = bodyText.match(
      /(?:phone|telephone|mobile|cell|የስልክ|ስልክ)\s*[:：]?\s*(\+?\d[\d\s\-()]{7,15})/i,
    );
    const phone = phoneMatch ? phoneMatch[1].trim() : undefined;

    return {
      businessName: businessName || 'Unknown Business',
      licenseStatus: licenseStatus || 'Unknown',
      tin: tin || '',
      phone,
      rawHtml: html,
    };
  }

  private extractText(
    $: cheerio.CheerioAPI,
    ...selectors: string[]
  ): string | undefined {
    for (const selector of selectors) {
      const el = $(`#${selector}, .${selector}, [name="${selector}"]`);
      if (el.length > 0) {
        const text = el.first().text().trim();
        if (text) return text;
      }

      const label = $(
        `:contains("${selector.replace(/([A-Z])/g, ' $1').trim()}")`,
      );
      if (label.length > 0) {
        const value = label.parent().find('td, span, div').last().text().trim();
        if (value) return value;
      }
    }
    return undefined;
  }

  private guessField(bodyText: string, labels: string[]): string | undefined {
    for (const label of labels) {
      const regex = new RegExp(
        `${label}\\s*[:：]?\\s*([^\\n]{2,100})`,
        'i',
      );
      const match = bodyText.match(regex);
      if (match) {
        const value = match[1].trim();
        if (value && value.length > 0) return value;
      }
    }
    return undefined;
  }
}
