/* Progressive enhancement only: the static page and configured native form
   remain useful without this file. No framework or third-party script. */
(() => {
  "use strict";
  const config = window.SITE_CONFIG || {};
  const string = (value) => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  const placeholder = (value) => /YOUR_|_URL_HERE|PLACEHOLDER|^CUSTOM_DOMAIN$/i.test(value);
  function assetURL(value) {
    const candidate = string(value);
    if (!candidate || placeholder(candidate) || /^[?#]/.test(candidate) || /^\/\//.test(candidate) || /[\u0000-\u0020\u007f\\]/.test(candidate)) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(candidate) && !/^https:\/\//i.test(candidate)) return "";
    try {
      const url = new URL(candidate, "https://local.invalid/");
      return url.protocol === "https:" && !url.username && !url.password ? candidate : "";
    } catch { return ""; }
  }
  function domainURL(value) {
    const candidate = string(value);
    if (!candidate || placeholder(candidate) || /[\s\u0000-\u001f\u007f\\]/.test(candidate)) return "";
    try {
      const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
      const hostname = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
      return url.protocol === "https:" && hostname.test(url.hostname) && !url.username && !url.password && !url.port && url.pathname === "/" && !url.search && !url.hash ? url.href : "";
    } catch { return ""; }
  }
  function emailAddress(value) {
    const candidate = string(value);
    return !placeholder(candidate) && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(candidate) ? candidate : "";
  }

  document.querySelectorAll("[data-config]").forEach((element) => {
    const value = string(config[element.dataset.config]);
    if (value) element.textContent = value;
  });
  const paragraphs = document.getElementById("mission-paragraphs");
  if (paragraphs && Array.isArray(config.COMPANY_MISSION_TEXT) && config.COMPANY_MISSION_TEXT.length) {
    const content = document.createDocumentFragment();
    config.COMPANY_MISSION_TEXT.forEach((value) => {
      if (!string(value)) return;
      const paragraph = document.createElement("p");
      paragraph.textContent = string(value);
      content.append(paragraph);
    });
    if (content.childNodes.length) paragraphs.replaceChildren(content);
  }
  const companyEmail = emailAddress(config.COMPANY_EMAIL);
  document.querySelectorAll("[data-email]").forEach((element) => {
    if (!string(config.COMPANY_EMAIL)) return;
    if (companyEmail) {
      const link = document.createElement("a");
      link.className = "email-link";
      link.href = `mailto:${encodeURIComponent(companyEmail).replace(/%40/g, "@")}`;
      link.textContent = companyEmail;
      element.replaceChildren(link);
    } else element.textContent = string(config.COMPANY_EMAIL);
  });
  const year = document.getElementById("copyright-year");
  if (year) year.textContent = String(new Date().getFullYear());

  const logo = document.getElementById("company-logo");
  const logoURL = assetURL(config.LOGO_URL);
  if (logo) {
    logo.alt = string(config.COMPANY_NAME) || "Company logo";
    // The header contains only the configured image; never insert fallback branding.
    logo.addEventListener("error", () => { logo.hidden = true; });
    if (logoURL) {
      logo.addEventListener("load", () => { logo.hidden = false; });
      logo.src = logoURL;
      if (logo.complete && logo.naturalWidth > 0) logo.hidden = false;
    } else if (Object.prototype.hasOwnProperty.call(config, "LOGO_URL")) {
      logo.removeAttribute("src");
      logo.hidden = true;
    }
  }
  const hero = document.getElementById("hero-image");
  const heroURL = assetURL(config.BACKGROUND_IMAGE_URL);
  if (hero && heroURL) {
    const fallback = "assets/hero-preview.webp";
    hero.addEventListener("error", () => {
      hero.removeAttribute("srcset");
      hero.src = fallback;
      hero.srcset = "assets/hero-preview-small.webp 900w, assets/hero-preview.webp 1536w";
    }, { once: true });
    hero.removeAttribute("srcset");
    hero.src = heroURL;
  } else if (hero && Object.prototype.hasOwnProperty.call(config, "BACKGROUND_IMAGE_URL")) {
    hero.src = "assets/hero-preview.webp";
    hero.srcset = "assets/hero-preview-small.webp 900w, assets/hero-preview.webp 1536w";
  }
  const favicon = document.getElementById("site-favicon");
  const faviconURL = assetURL(config.FAVICON_URL);
  if (favicon && faviconURL) { favicon.href = faviconURL; favicon.removeAttribute("type"); }
  else if (favicon && Object.prototype.hasOwnProperty.call(config, "FAVICON_URL")) {
    favicon.href = "assets/favicon.svg";
    favicon.type = "image/svg+xml";
  }

  function setMeta(attribute, name, value) {
    if (!value) return;
    let element = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, name); document.head.append(element); }
    element.content = value;
  }
  // Preserve the dedicated privacy page's title, canonical URL and metadata.
  if (document.body.dataset.page !== "privacy") {
    const title = [string(config.COMPANY_NAME), string(config.COMPANY_TAGLINE)].filter(Boolean).join(" | ");
    if (title) { document.title = title; setMeta("property", "og:title", title); }
    const description = string(config.META_DESCRIPTION) || string(config.COMPANY_TAGLINE);
    setMeta("name", "description", description);
    setMeta("property", "og:description", description);
    setMeta("property", "og:site_name", string(config.COMPANY_NAME));
    const canonical = domainURL(config.CUSTOM_DOMAIN);
    const socialImage = assetURL(config.OG_IMAGE_URL);
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.append(link); }
      link.href = canonical;
      setMeta("property", "og:url", canonical);
      setMeta("property", "og:image", new URL(socialImage || "assets/social-preview.jpg", canonical).href);
    } else if (/^https:\/\//i.test(socialImage)) setMeta("property", "og:image", socialImage);
  }

  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-navigation");
  if (menuButton && navigation) {
    const mobile = window.matchMedia("(max-width: 600px)");
    function closeMenu(returnFocus = false) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
      if (returnFocus) menuButton.focus();
    }
    menuButton.hidden = false;
    document.documentElement.classList.add("has-mobile-menu");
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      navigation.classList.toggle("is-open", !expanded);
    });
    navigation.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      const href = event.target.closest("a").getAttribute("href");
      const target = href && href.startsWith("#") ? document.querySelector(href) : null;
      closeMenu();
      if (target && mobile.matches) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") closeMenu(true);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".header-inner")) closeMenu();
    });
    const resetMenu = () => closeMenu();
    if (mobile.addEventListener) mobile.addEventListener("change", resetMenu);
    else if (mobile.addListener) mobile.addListener(resetMenu);
  }

  // Animate only while entering the viewport; content is never hidden by default.
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("reveal-in"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".mission-content, .contact-intro, .contact-form").forEach((element) => observer.observe(element));
  }

  const form = document.getElementById("contact-form");
  const submit = document.getElementById("submit-button");
  const submitLabel = document.getElementById("submit-label");
  const status = document.getElementById("form-status");
  if (!form || !submit || !submitLabel || !status) return;
  // A synchronized static endpoint remains usable if config.js fails to load.
  // An explicit placeholder in configuration always overrides the snapshot.
  const staticFormID = /^https:\/\/formspree\.io\/f\/([a-zA-Z0-9]+)$/.exec(form.action)?.[1] || "";
  const formID = Object.prototype.hasOwnProperty.call(config, "FORMSPREE_FORM_ID")
    ? string(config.FORMSPREE_FORM_ID) : staticFormID;
  const configured = /^[a-zA-Z0-9]+$/.test(formID) && !placeholder(formID);
  if (configured) form.action = `https://formspree.io/f/${formID}`;
  form.noValidate = true;
  let pending = false;
  const fields = Array.from(form.querySelectorAll("input:not([type=hidden]), textarea"));
  function validate(field) {
    field.setCustomValidity("");
    let error = "";
    const value = field.value.trim();
    if (!value && field.required) error = "Please complete this field.";
    // The HTML pattern also protects native submission without JavaScript.
    // Uses browser email syntax plus a dotted domain, without a TLD allowlist.
    // ASCII mailboxes / punycode domains are supported; quoted local parts,
    // Unicode mailboxes and address literals depend on native type=email support.
    // The existing 254-character limit is the conventional mailbox limit.
    else if (field.type === "email" && (field.validity.typeMismatch || field.validity.patternMismatch || field.validity.tooLong)) error = "Please enter a valid email address, for example name@example.com.";
    else if (field.id === "phone") {
      const digits = value.replace(/\D/g, "").length;
      if (!/^\+[1-9][0-9 ()-]+$/.test(value) || digits < 7 || digits > 15) error = "Enter your country code and phone number, for example +44 20 1234 5678.";
    } else if (field.validity.tooLong) error = "Please shorten this entry.";
    field.setCustomValidity(error);
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) errorElement.textContent = error;
    if (error) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
    return !error;
  }
  fields.forEach((field) => {
    field.addEventListener("blur", () => { if (field.value || field.hasAttribute("aria-invalid")) validate(field); });
    field.addEventListener("input", () => { if (field.hasAttribute("aria-invalid")) validate(field); });
  });
  function announce(message, state, focus = false) {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = false;
    if (focus) status.focus({ preventScroll: true });
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;
    const invalid = fields.filter((field) => !validate(field));
    if (invalid.length) {
      announce("Please check the highlighted fields and try again.", "error");
      invalid[0].focus();
      return;
    }
    if (!configured) {
      announce("This enquiry form is not connected yet. Please use the companyвЂ™s published contact details to get in touch.", "error", true);
      return;
    }
    if (!("fetch" in window) || !("AbortController" in window)) {
      // Configured HTML form still works on browsers without the enhanced API.
      HTMLFormElement.prototype.submit.call(form);
      return;
    }
    pending = true;
    submit.disabled = true;
    submitLabel.textContent = "SendingвЂ¦";
    form.setAttribute("aria-busy", "true");
    announce("Sending your enquiryвЂ¦", "pending");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many enquiries have been sent recently. Please wait a little before trying again. Your message has been kept.");
        if (response.status >= 500) throw new Error("The enquiry service is temporarily unavailable. Your message has been kept. Please try again later or contact us by email.");
        throw new Error("Your enquiry could not be sent. Please check your details and try again, or contact us by email. Your message has been kept.");
      }
      announce("Thank you. Your enquiry has been sent. We look forward to speaking with you.", "success", true);
      form.reset();
      fields.forEach((field) => field.removeAttribute("aria-invalid"));
    } catch (error) {
      if (error.name === "AbortError") announce("The request timed out, so we could not confirm delivery. Your message has been kept. Please contact us by email before resending to avoid a duplicate enquiry.", "error", true);
      else if (error instanceof TypeError) announce("We could not confirm delivery. Please check your connection or contact us by email before resending. Your message has been kept.", "error", true);
      else announce(error.message || "We could not send your enquiry. Your message has been kept. Please try again later.", "error", true);
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      submit.disabled = false;
      submitLabel.textContent = "Send Message";
      form.removeAttribute("aria-busy");
    }
  });
  // Keep enhanced submission available after attaching the guarded listener.
  submit.disabled = false;
})();
