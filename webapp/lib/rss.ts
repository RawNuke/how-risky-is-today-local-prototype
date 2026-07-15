export interface RssItem {
  title: string;
  url: string;
  publishedAt: string | null;
  description: string;
}

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const point = Number.parseInt(code, 10);
      return Number.isSafeInteger(point) && point <= 0x10ffff ? String.fromCodePoint(point) : "";
    })
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => {
      const point = Number.parseInt(code, 16);
      return Number.isSafeInteger(point) && point <= 0x10ffff ? String.fromCodePoint(point) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function dateValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseRss(xml: string): RssItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const item = match[1];
      return {
        title: tagValue(item, "title"),
        url: tagValue(item, "link") || tagValue(item, "guid"),
        publishedAt: dateValue(tagValue(item, "pubDate") || tagValue(item, "published")),
        description: tagValue(item, "description") || tagValue(item, "summary"),
      };
    })
    .filter((item) => item.title && item.url.startsWith("http"));
}
