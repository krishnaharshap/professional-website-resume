// Hydrates sections 2-6 from data/resume-data.json.
// DOM is built with createElement/textContent only; URLs pass a protocol
// allowlist. Sections are never added or removed, only filled, so the
// dot rail, hashes, and print layout stay stable on partial data.

const ALLOWED_PROTOCOLS = ["https:", "mailto:", "tel:"];

// Entries before this index render in #experience-body (software QA,
// 2023 - present: Walnut, upskilling, SGIC, AppLabb), the rest in
// #experience-early-body (regulated manufacturing QE, 2017 - 2021).
const EXPERIENCE_SPLIT_INDEX = 4;

function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function link(url, text, { external = true } = {}) {
  const href = safeUrl(url);
  if (!href) return el("span", null, text);
  const anchor = el("a", null, text);
  anchor.href = href;
  anchor.title = href.startsWith("mailto:") ? href.slice(7) : href;
  if (external && !href.startsWith("mailto:")) {
    anchor.target = "_blank";
    anchor.rel = "noopener";
  }
  return anchor;
}

function fill(id, ...children) {
  const host = document.getElementById(id);
  if (!host) return;
  host.querySelectorAll(".skeleton").forEach((skeleton) => skeleton.remove());
  host.append(...children);
}

function renderSkills(groups) {
  return groups.map((group) => {
    const wrap = el("div", "skill-group");
    wrap.dataset.weight = String(group.weight ?? 3);
    wrap.append(el("h3", null, group.category));
    const list = el("ul");
    (group.items || []).forEach((item) => list.append(el("li", null, item)));
    wrap.append(list);
    return wrap;
  });
}

function renderExperienceItem(job) {
  const item = el("article", "experience-item" + (job.type === "gap" ? " gap-entry" : ""));
  if (job.metric) item.append(el("p", "exp-metric mono", job.metric));
  const head = el("div", "exp-head");
  head.append(el("h3", null, job.position));
  head.append(el("span", "exp-duration mono", job.duration));
  item.append(head);
  const company = [job.company, job.clients ? "Clients: " + job.clients : null, job.location]
    .filter(Boolean)
    .join(" | ");
  item.append(el("p", "exp-company", company));
  const list = el("ul");
  (job.responsibilities || []).forEach((line) => list.append(el("li", null, line)));
  item.append(list);
  return item;
}

function renderProjects(projects) {
  return projects.map((project) => {
    const card = el("article", "project-card");
    if (project.outcome) card.append(el("p", "project-outcome mono", project.outcome));
    card.append(el("h3", null, project.name));
    card.append(el("p", null, project.description));
    if (project.technologies) card.append(el("p", "project-tech mono", project.technologies));
    const links = el("div", "project-links");
    if (project.link) links.append(link(project.link, "Repository"));
    if (project.liveReport) links.append(link(project.liveReport, "Live test report"));
    card.append(links);
    return card;
  });
}

function renderCaseStudy(caseStudy) {
  const box = el("section", "case-study");
  box.append(el("h3", null, caseStudy.title));
  box.append(el("p", null, caseStudy.intro));
  (caseStudy.rows || []).forEach((row) => {
    const line = el("div", "case-row");
    line.append(el("span", "risk", row.risk));
    line.append(el("span", "control", row.control));
    box.append(line);
  });
  if (caseStudy.links) {
    const footer = el("div", "case-links");
    if (caseStudy.links.tests) footer.append(link(caseStudy.links.tests, "See the tests"));
    if (caseStudy.links.workflow) footer.append(link(caseStudy.links.workflow, "See it run"));
    box.append(footer);
  }
  return box;
}

function renderCredential(entry) {
  const item = el("div", "credential-item");
  const head = el("div", "credential-head");
  head.append(el("h3", null, entry.degree || entry.name));
  head.append(el("span", "credential-duration mono", entry.year));
  item.append(head);
  item.append(el("p", null, entry.institution || entry.issuer));
  return item;
}

/**
 * Phone stays out of the initial DOM entirely so a plain fetch of this page's
 * HTML never sees it - only a real click does. This defends against casual
 * scraping of rendered page text; it does not and cannot defend against
 * someone fetching data/resume-data.json directly, since that file has to
 * stay publicly fetchable for the rest of the site to hydrate at all.
 */
function renderPhoneReveal(phone) {
  const button = el("button", "phone-reveal mono", "Show phone number");
  button.type = "button";
  button.addEventListener(
    "click",
    () => {
      const digits = phone.replace(/\D/g, "");
      const tel = digits.length === 10 ? "1" + digits : digits;
      const anchor = link("tel:+" + tel, phone, { external: false });
      button.replaceWith(anchor);
      // Focus follows the removed button to the thing that replaced it -
      // this is the reveal announcement, so no separate aria-live region:
      // a screen reader already announces the newly focused link's name.
      anchor.focus();
    },
    { once: true }
  );
  return button;
}

export async function hydrate() {
  const version = document.documentElement.getAttribute("data-content-version") || "0";
  try {
    const response = await fetch("data/resume-data.json?v=" + encodeURIComponent(version));
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();

    if (Array.isArray(data.skills)) fill("skills-body", ...renderSkills(data.skills));

    if (Array.isArray(data.experience)) {
      const recent = data.experience.slice(0, EXPERIENCE_SPLIT_INDEX);
      const earlier = data.experience.slice(EXPERIENCE_SPLIT_INDEX);
      fill("experience-body", ...recent.map(renderExperienceItem));
      fill("experience-early-body", ...earlier.map(renderExperienceItem));
    }

    if (Array.isArray(data.projects)) fill("projects-body", ...renderProjects(data.projects));
    if (data.caseStudy) fill("case-study", renderCaseStudy(data.caseStudy));
    if (Array.isArray(data.education)) fill("education-body", ...data.education.map(renderCredential));
    if (Array.isArray(data.certifications)) {
      fill("certifications-body", ...data.certifications.map(renderCredential));
    }

    if (data.contact) {
      const host = document.getElementById("contact-body");
      if (host) {
        const primary = el("div", "contact-primary");
        primary.append(
          link("mailto:" + data.contact.email, data.contact.email, { external: false }),
          renderPhoneReveal(data.contact.phone)
        );
        const secondary = el("div", "contact-secondary");
        secondary.append(
          el("span", "mono", data.contact.location),
          link(data.contact.github, "GitHub"),
          link(data.contact.linkedin, "LinkedIn")
        );
        host.replaceChildren(primary, secondary);
      }

      const printPhone = document.getElementById("print-contact-phone");
      if (printPhone) printPhone.textContent = data.contact.phone + " ·";
    }

    const updated = document.getElementById("last-updated");
    if (updated) updated.textContent = "content v" + version;

    document.dispatchEvent(new CustomEvent("resume:hydrated"));
  } catch (error) {
    console.warn("Resume data failed to hydrate:", error);
    document.querySelectorAll(".skeleton").forEach((skeleton) => skeleton.remove());
    const note = document.getElementById("data-error");
    if (note) note.hidden = false;
  }
}
