import assert from "node:assert/strict";
import test from "node:test";
import {
  annualRateToDailyMicromorts,
  chooseScene,
  isDelhiDaylight,
} from "../lib/risk-engine";
import { parseImdFeed } from "../supabase/functions/_shared/refresh-risk.ts";
import { parseRss } from "../lib/rss";
import {
  filterLocatedRiskSignal,
  publisherContext,
  signalExpiresAt,
} from "../lib/risk-signal-filter";

const base = {
  temperatureC: 31,
  apparentTemperatureC: 35,
  precipitationMm: 0,
  weatherCode: 0,
  usAqi: 80,
  roadSignalCount: 0,
};

test("converts the 31.7 annual rate example to approximately 0.87 daily micromorts", () => {
  assert.ok(Math.abs(annualRateToDailyMicromorts(31.7) - 0.86849) < 0.0001);
});

test("rejects invalid annual rates", () => {
  assert.throws(() => annualRateToDailyMicromorts(-1), RangeError);
});

test("rain takes visual priority when precipitation is present", () => {
  assert.equal(chooseScene({ ...base, precipitationMm: 0.4, temperatureC: 43 }), "rain");
});

test("heat activates from apparent-temperature threshold", () => {
  assert.equal(chooseScene({ ...base, apparentTemperatureC: 44 }), "heat");
});

test("haze activates only at an unhealthy AQI threshold", () => {
  assert.equal(chooseScene({ ...base, usAqi: 151 }), "haze");
});

test("road strain needs at least four recent road leads", () => {
  assert.equal(chooseScene({ ...base, roadSignalCount: 4 }), "road");
  assert.equal(chooseScene({ ...base, roadSignalCount: 3 }), "quiet");
});

test("RSS parser extracts CDATA headlines, links, and timestamps", () => {
  const feed = `
    <rss><channel><item>
      <title><![CDATA[Delhi rain &amp; traffic &#8216;update&#8217;]]></title>
      <link>https://example.com/delhi-rain</link>
      <pubDate>Tue, 14 Jul 2026 08:00:00 +0000</pubDate>
    </item></channel></rss>`;

  const items = parseRss(feed);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Delhi rain & traffic ‘update’");
  assert.equal(items[0].url, "https://example.com/delhi-rain");
  assert.equal(items[0].publishedAt, "2026-07-14T08:00:00.000Z");
});

test("filters generic policy news with no local risk mechanism", () => {
  assert.equal(
    filterLocatedRiskSignal("Delhi CM unveils renamed women aid scheme and states exclusions"),
    null,
  );
});

test("filters historical retrospectives rather than mapping them as current risk", () => {
  assert.equal(
    filterLocatedRiskSignal("When a mob tried to burn down a house near Jantar Mantar in 1966"),
    null,
  );
});

test("locates an institutional safety concern at the named hospital", () => {
  const signal = filterLocatedRiskSignal(
    "IVF treatment gone wrong. The couple approached SCI International Hospital in South Delhi and filed an FIR alleging deception and stillbirth.",
  );
  assert.equal(signal?.location, "SCI International Hospital, Greater Kailash I");
  assert.equal(signal?.category, "civic");
  assert.equal(signal?.riskType, "institutional-safety");
  assert.equal(signal?.behavior, "static");
  assert.match(signal?.riskExplanation ?? "", /one-off incident.*not indicate an ongoing citywide threat/i);
  assert.match(signal?.severityReason ?? "", /materially affect safety/i);
  assert.deepEqual([signal?.longitude, signal?.latitude], [77.2340192, 28.5498848]);
});

test("locates a protest disruption at Jantar Mantar", () => {
  const signal = filterLocatedRiskSignal(
    "The CJP protest and hunger strike is continuing at Jantar Mantar with a growing crowd.",
  );
  assert.equal(signal?.location, "Jantar Mantar");
  assert.equal(signal?.category, "road");
  assert.equal(signal?.riskType, "traffic-disruption");
  assert.equal(signal?.behavior, "live");
  assert.match(signal?.riskExplanation ?? "", /closures, diversions, crowds and congestion/i);
});

test("classifies Yamuna flooding as live life-safety exposure", () => {
  const signal = filterLocatedRiskSignal(
    "Yamuna River levels are rising with flooding reported near low-lying areas",
  );
  assert.equal(signal?.location, "Yamuna river and floodplain");
  assert.equal(signal?.riskType, "life-safety");
  assert.equal(signal?.behavior, "live");
  assert.match(signal?.riskExplanation ?? "", /strong currents.*low-lying areas/i);
});

test("uses five inspectable severity bands with an explanation", () => {
  const high = filterLocatedRiskSignal("Fatal crash killed one person near ITO");
  assert.equal(high?.severity, "high");
  assert.match(high?.severityReason ?? "", /fatality|threat to life/i);

  const guarded = filterLocatedRiskSignal("Road closure and diversion active near Connaught Place");
  assert.equal(guarded?.severity, "guarded");
  assert.match(guarded?.severityReason ?? "", /warrants caution/i);
});

test("expires live observations after six hours and static incidents after seven days", () => {
  const observedAt = new Date("2026-07-14T10:00:00.000Z");
  assert.equal(
    signalExpiresAt("live", "2026-07-10T00:00:00.000Z", observedAt),
    "2026-07-14T16:00:00.000Z",
  );
  assert.equal(
    signalExpiresAt("static", "2026-07-12T08:00:00.000Z", observedAt),
    "2026-07-19T08:00:00.000Z",
  );
});

test("prioritises the event location in the headline over secondary article mentions", () => {
  const signal = filterLocatedRiskSignal(
    "Delhi court allows NIA to dispose remains of Red Fort blast victims",
    "The report later mentions investigators in Faridabad.",
  );
  assert.equal(signal, null, "an administrative court follow-up is not an active risk event");

  const activeSignal = filterLocatedRiskSignal(
    "Fresh fire reported near Red Fort",
    "The report later mentions investigators in Faridabad.",
  );
  assert.equal(activeSignal?.location, "Red Fort");
});

test("rejects a risk headline when it has no precise venue or neighbourhood", () => {
  assert.equal(filterLocatedRiskSignal("Traffic accident reported somewhere in Delhi"), null);
});

test("extracts publisher description and JSON-LD article body", () => {
  const html = `<html><head><meta name="description" content="Protest at Jantar Mantar." /></head>
    <script type="application/ld+json">{"articleBody":"A hunger strike is continuing at Jantar Mantar."}</script></html>`;
  assert.match(publisherContext(html), /hunger strike is continuing at Jantar Mantar/);
});

test("Delhi daylight switches at 6 AM and 6 PM local time", () => {
  assert.equal(isDelhiDaylight(new Date("2026-07-14T00:30:00Z")), true);
  assert.equal(isDelhiDaylight(new Date("2026-07-14T12:30:00Z")), false);
});

test("IMD discovery keeps NCR alerts and ignores unrelated regions", () => {
  const feed = `
    <rss><channel>
      <item>
        <title>Thunderstorm warning</title>
        <link>https://example.gov/delhi-alert.xml</link>
        <description>Thunderstorm likely over Delhi and Haryana.</description>
        <author>IMD</author>
        <pubDate>Tue, 14 Jul 2026 08:00:00 +0000</pubDate>
      </item>
      <item>
        <title>Heavy rainfall</title>
        <link>https://example.gov/kerala-alert.xml</link>
        <description>Heavy rainfall likely over Kerala.</description>
        <author>IMD</author>
        <pubDate>Tue, 14 Jul 2026 08:00:00 +0000</pubDate>
      </item>
    </channel></rss>`;

  const alerts = parseImdFeed(feed);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].source_url, "https://example.gov/delhi-alert.xml");
  assert.equal(alerts[0].domain, "imd.gov.in");
});
