require("dotenv").config();

const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/", (req, res) => {
  res.send("Attendance bot running");
});

app.get("/run", async (req, res) => {

  let browser;

  try {

    console.log("EMAIL:", process.env.EMAIL);

    console.log(
      "PASSWORD EXISTS:",
      !!process.env.PASSWORD
    );

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();

    // Open login page
    await page.goto(
      "https://teamdesk.gmands.com/login",
      {
        waitUntil: "networkidle",
      }
    );

    console.log("Login page opened");

    // Fill login form
    await page.fill(
      'input[name="email"]',
      process.env.EMAIL || ""
    );

    await page.fill(
      'input[name="password"]',
      process.env.PASSWORD || ""
    );

    console.log("Credentials filled");

    // Click login button
    await page.click(
      'button[type="submit"]'
    );

    console.log("Login button clicked");

    // Wait after login
    await page.waitForLoadState(
      "networkidle"
    );

    await page.waitForTimeout(10000);

    console.log(
      "Current URL after login:",
      page.url()
    );

    console.log(
      "Page title after login:",
      await page.title()
    );

    // If login failed
    if (
      page.url().includes("/login")
    ) {

      const loginHtml =
        await page.content();

      console.log(
        "Still on login page"
      );

      console.log(loginHtml);

      throw new Error(
        "Login failed - redirected back to login page"
      );

    }

    console.log("Login successful");

    // Open profile page
    await page.goto(
      "https://teamdesk.gmands.com/profile",
      {
        waitUntil:
          "domcontentloaded",
      }
    );

    await page.waitForTimeout(
      10000
    );

    console.log(
      "Current profile URL:",
      page.url()
    );

    console.log(
      "Profile page title:",
      await page.title()
    );

    // Screenshot for debugging
    await page.screenshot({
      path: "/tmp/profile-page.png",
      fullPage: true,
    });

    // Check availability button
    const buttonCount =
      await page.locator(
        ".profile-toggle-btn"
      ).count();

    console.log(
      "Availability button count:",
      buttonCount
    );

    if (buttonCount === 0) {

      const profileHtml =
        await page.content();

      console.log(profileHtml);

      throw new Error(
        "Availability button not found"
      );

    }

    // Click availability button
    await page.locator(
      ".profile-toggle-btn"
    ).first().click();

    console.log(
      "Availability button clicked"
    );

    // Wait modal
    await page.waitForSelector(
      "#availabilityInput",
      {
        timeout: 30000,
      }
    );

    // Fill work text
    await page.fill(
      "#availabilityInput",
      "Started work"
    );

    console.log(
      "Work text filled"
    );

    // Confirm attendance
    await page.click(
      "#availabilityConfirmBtn"
    );

    console.log(
      "Attendance marked successfully"
    );

    await page.waitForTimeout(
      3000
    );

    await browser.close();

    res.send(
      "Attendance marked successfully"
    );

  } catch (err) {

    console.error(err);

    if (browser) {
      await browser.close();
    }

    res.status(500).send({
      error: err.message,
    });

  }

});

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});