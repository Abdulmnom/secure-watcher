export interface AnalysisResult {
  verdict: "safe" | "suspicious";
  riskScore: number;
  reasons: string[];
}

const SUSPICIOUS_KEYWORDS = [
  "login",
  "verify",
  "update",
  "secure",
  "account",
  "bank",
  "free",
  "gift",
  "password",
  "confirm",
  "urgent",
  "click",
  "winner",
  "prize",
];

export function analyzeUrl(url: string): AnalysisResult {
  const reasons: string[] = [];
  let riskScore = 0;

  // Normalize URL for analysis
  const normalizedUrl = url.toLowerCase().trim();

  // Check for @ symbol (common in phishing)
  if (normalizedUrl.includes("@")) {
    reasons.push("Contains @ symbol (potential credential injection)");
    riskScore += 25;
  }

  // Check for many subdomains (more than 3 dots before path)
  try {
    const urlObj = new URL(normalizedUrl.startsWith("http") ? normalizedUrl : `http://${normalizedUrl}`);
    const hostParts = urlObj.hostname.split(".");
    if (hostParts.length > 4) {
      reasons.push(`Too many subdomains (${hostParts.length - 1} levels detected)`);
      riskScore += 20;
    }
  } catch {
    // If URL parsing fails, add as risk
    reasons.push("Malformed URL structure");
    riskScore += 15;
  }

  // Check for IP address instead of domain
  const ipPattern = /(\d{1,3}\.){3}\d{1,3}/;
  if (ipPattern.test(normalizedUrl)) {
    reasons.push("Uses IP address instead of domain name");
    riskScore += 30;
  }

  // Check for suspicious keywords
  const foundKeywords = SUSPICIOUS_KEYWORDS.filter((keyword) =>
    normalizedUrl.includes(keyword)
  );
  if (foundKeywords.length > 0) {
    reasons.push(`Contains suspicious keywords: ${foundKeywords.join(", ")}`);
    riskScore += Math.min(foundKeywords.length * 10, 25);
  }

  // Check for encoded characters
  const encodedCount = (normalizedUrl.match(/%[0-9A-Fa-f]{2}/g) || []).length;
  if (encodedCount > 3) {
    reasons.push(`Excessive URL encoding (${encodedCount} encoded characters)`);
    riskScore += 15;
  }

  // Check for multiple slashes
  const doubleSlashCount = (normalizedUrl.match(/\/\//g) || []).length;
  if (doubleSlashCount > 2) {
    reasons.push("Multiple double slashes detected");
    riskScore += 10;
  }

  // Check URL length
  if (normalizedUrl.length > 80) {
    reasons.push(`URL is unusually long (${normalizedUrl.length} characters)`);
    riskScore += 15;
  }

  // Check for suspicious TLDs
  const suspiciousTlds = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".work"];
  if (suspiciousTlds.some((tld) => normalizedUrl.includes(tld))) {
    reasons.push("Uses suspicious top-level domain");
    riskScore += 15;
  }

  // Check for homograph characters (common in phishing)
  const homographPattern = /[а-яА-Я]/; // Cyrillic characters
  if (homographPattern.test(url)) {
    reasons.push("Contains homograph characters (potential IDN attack)");
    riskScore += 30;
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  const verdict: "safe" | "suspicious" = riskScore >= 30 ? "suspicious" : "safe";

  if (reasons.length === 0) {
    reasons.push("No suspicious patterns detected");
  }

  return {
    verdict,
    riskScore,
    reasons,
  };
}