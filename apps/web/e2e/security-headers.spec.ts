import { test, expect } from "@playwright/test";

test.describe("Security Headers & CSP", () => {
  const routes = ["/", "/games"];

  for (const route of routes) {
    test(`serves required security headers on ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response).not.toBeNull();
      expect(response?.status()).toBeLessThan(400);

      const headers = response!.headers();

      // Content-Security-Policy
      const csp = headers["content-security-policy"];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("connect-src");

      // X-Content-Type-Options
      expect(headers["x-content-type-options"]).toBe("nosniff");

      // X-Frame-Options
      expect(headers["x-frame-options"]).toBe("DENY");

      // Referrer-Policy
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

      // Permissions-Policy
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["permissions-policy"]).toContain("microphone=()");
      expect(headers["permissions-policy"]).toContain("geolocation=()");
    });
  }

  test("does not produce Content Security Policy violation errors in console", async ({ page }) => {
    const cspViolations: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("Content Security Policy") ||
        text.includes("violates the following Content Security Policy directive") ||
        text.includes("Refused to")
      ) {
        cspViolations.push(text);
      }
    });

    page.on("pageerror", (error) => {
      if (error.message.includes("Content Security Policy")) {
        cspViolations.push(error.message);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.goto("/games");
    await page.waitForLoadState("networkidle");

    expect(cspViolations).toEqual([]);
  });
});
