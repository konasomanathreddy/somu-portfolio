import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Github,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import {
  DEFAULT_PORTFOLIO,
  HERO_IMAGE_PATH,
  PROJECT_IMAGES,
} from './data/defaultPortfolio';
import type { PortfolioData, ProjectItem } from './types/portfolio';
import { ResilientImage } from './components/ResilientImage';
import { ProjectModal } from './components/ProjectModal';
import { EnquiryForm } from './components/EnquiryForm';

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Contact', href: '#contact' },
];

export default function App() {
  const [portfolio, setPortfolio] = useState<PortfolioData>(DEFAULT_PORTFOLIO);
  const [skillFilter, setSkillFilter] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/portfolio')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ok?: boolean; portfolio?: PortfolioData } | null) => {
        if (!cancelled && data?.ok && data.portfolio) {
          setPortfolio(data.portfolio);
        }
      })
      .catch(() => {
        // Fallback to static portfolio data seamlessly
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const skillCategories = useMemo(() => {
    const categories = Array.from(
      new Set(portfolio.skills.map((skill) => skill.category))
    );
    return ['All', ...categories];
  }, [portfolio.skills]);

  const filteredSkills = useMemo(() => {
    if (skillFilter === 'All') {
      return portfolio.skills;
    }
    return portfolio.skills.filter((skill) => skill.category === skillFilter);
  }, [portfolio.skills, skillFilter]);

  const scrollToEnquiry = () => {
    setMobileMenuOpen(false);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 350);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(portfolio.profile.email);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; mailto link remains active
    }
  };

  return (
    <div className="min-h-screen bg-[#090B10] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090B10]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-6">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            {portfolio.profile.brand}
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white hover:underline underline-offset-8 decoration-blue-500/70 whitespace-nowrap shrink-0"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={scrollToEnquiry}
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap shrink-0"
            >
              Send Enquiry
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 hover:bg-white/5"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0D1018] px-6 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-zinc-300 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={scrollToEnquiry}
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
            >
              Send Enquiry
            </button>
          </div>
        )}
      </header>

      <main id="top">
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 pt-14 pb-16 lg:pt-20 lg:pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-10 lg:gap-12">
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                <p className="text-xs sm:text-sm text-zinc-400 tracking-wide">
                  <span>{portfolio.profile.university}</span>
                  <span aria-hidden="true" className="mx-2 text-zinc-600">
                    ·
                  </span>
                  <span>{portfolio.profile.year} B.Tech CSE (AI &amp; ML)</span>
                </p>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-white [text-wrap:balance]">
                  {portfolio.profile.fullName}
                </h1>

                <p className="text-lg sm:text-xl font-medium text-zinc-200 leading-snug max-w-2xl [text-wrap:balance]">
                  {portfolio.profile.headline}
                </p>

                <p className="text-sm sm:text-base leading-relaxed text-zinc-400 max-w-2xl">
                  {portfolio.profile.summary}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={scrollToEnquiry}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap shrink-0"
                  >
                    <span>Get in Touch</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <a
                    href="#projects"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap shrink-0"
                  >
                    <span>Explore Work</span>
                  </a>

                  <a
                    href={portfolio.profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white whitespace-nowrap shrink-0"
                  >
                    <Github className="h-4 w-4" aria-hidden="true" />
                    <span>GitHub</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative h-full min-h-[300px] lg:min-h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#10131C]">
                  <ResilientImage
                    src={HERO_IMAGE_PATH}
                    alt="K. Somanath Reddy developer workstation"
                    fallbackTitle={portfolio.profile.fullName}
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090B10]/90 via-[#090B10]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <p className="text-xs text-zinc-300">
                      <span>Student Developer</span>
                      <span aria-hidden="true" className="mx-2 text-zinc-500">
                        ·
                      </span>
                      <span>{portfolio.profile.location}</span>
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {portfolio.profile.availability}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 rounded-2xl border border-white/10 bg-[#10131C] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              {portfolio.highlights.map((item) => (
                <div key={item.label} className="p-5 sm:p-6">
                  <div className="text-xs text-zinc-400">{item.label}</div>
                  <div className="mt-1.5 font-display text-xl font-semibold text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="border-b border-white/10 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium tracking-wide text-blue-400">
                01. About
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
                Building a solid foundation in software engineering
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Developing technical fluency through coursework, self-directed
                study, and practical web and Python projects.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfolio.about.map((entry) => (
                <article
                  key={entry.index}
                  className="rounded-2xl border border-white/10 bg-[#10131C] p-6 sm:p-8 space-y-3"
                >
                  <div className="font-mono text-xs text-zinc-500 tabular-nums">
                    {entry.index}
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {entry.title}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-zinc-300">
                    {entry.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="border-b border-white/10 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-xl space-y-3">
                <p className="text-xs font-medium tracking-wide text-blue-400">
                  02. Skills
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
                  Tools and core disciplines
                </h2>
              </div>

              <div
                role="tablist"
                aria-label="Filter skills by category"
                className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#10131C] p-1"
              >
                {skillCategories.map((category) => {
                  const active = skillFilter === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSkillFilter(category)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills.map((skill) => (
                <article
                  key={skill.name}
                  className="rounded-2xl border border-white/10 bg-[#10131C] p-6 space-y-3"
                >
                  <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
                    <span>{skill.category}</span>
                    <span className="text-blue-400 font-medium">
                      {skill.level}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {skill.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {skill.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="border-b border-white/10 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium tracking-wide text-blue-400">
                03. Projects
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
                Selected work
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Academic and practical Python website builds maintained in my
                GitHub repository. Select any project for architecture notes.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {portfolio.projects.map((project) => (
                <article
                  key={project.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#10131C] flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => setActiveProject(project)}
                    className="relative aspect-[4/3] w-full overflow-hidden border-b border-white/10 bg-[#090B10] text-left focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    <ResilientImage
                      src={PROJECT_IMAGES[project.imageKey]}
                      alt={project.title}
                      fallbackTitle={project.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </button>

                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-7 space-y-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span>{project.index}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.category}</span>
                      </div>

                      <h3 className="text-xl font-semibold text-white">
                        {project.title}
                      </h3>

                      <p className="text-sm leading-relaxed text-zinc-300">
                        {project.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        {project.stack.map((tech, idx) => (
                          <span
                            key={tech}
                            className="inline-flex items-center gap-2"
                          >
                            {idx > 0 && <span aria-hidden="true">·</span>}
                            <span>{tech}</span>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setActiveProject(project)}
                          className="text-xs font-medium text-zinc-200 underline decoration-white/20 underline-offset-4 hover:text-white whitespace-nowrap shrink-0"
                        >
                          Details
                        </button>
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap shrink-0"
                        >
                          <span>Repository</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="education" className="border-b border-white/10 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium tracking-wide text-blue-400">
                04. Education
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
                Academic journey
              </h2>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-[#10131C] p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-white/10">
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-semibold text-white">
                    {portfolio.education.degree}
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-300">
                    {portfolio.education.field}
                  </p>
                </div>
                <div className="text-sm text-zinc-400 md:text-right shrink-0">
                  <div className="font-medium text-white">
                    {portfolio.education.institution}
                  </div>
                  <div className="mt-0.5 text-xs text-blue-400">
                    {portfolio.education.status}
                  </div>
                </div>
              </div>

              <ul className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-zinc-300 leading-relaxed">
                {portfolio.education.highlights.map((item) => (
                  <li key={item} className="space-y-1">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-medium tracking-wide text-blue-400">
                    05. Contact
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
                    Let’s connect directly
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
                    I’m open to internships, collaborative student projects, and
                    software engineering conversations. Use the enquiry form to
                    send a detailed message directly to my backend.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#10131C] p-6 space-y-5">
                  <div>
                    <div className="text-xs text-zinc-500">Direct Email</div>
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <a
                        href={`mailto:${portfolio.profile.email}`}
                        className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
                      >
                        {portfolio.profile.email}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        aria-label="Copy email address"
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white whitespace-nowrap shrink-0"
                      >
                        {emailCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                    <a
                      href={portfolio.profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/5 hover:text-white whitespace-nowrap shrink-0"
                    >
                      <Github className="h-4 w-4" aria-hidden="true" />
                      <span>GitHub Profile</span>
                    </a>
                    <a
                      href={`mailto:${portfolio.profile.email}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/5 hover:text-white whitespace-nowrap shrink-0"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      <span>Email Client</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <EnquiryForm
                  recipientEmail={portfolio.profile.email}
                  nameInputRef={nameInputRef}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 {portfolio.profile.fullName} · Personal Portfolio</p>
          <div className="flex items-center gap-6">
            <a href="#about" className="hover:text-zinc-300 transition-colors">
              About
            </a>
            <a href="#projects" className="hover:text-zinc-300 transition-colors">
              Projects
            </a>
            <a href="#contact" className="hover:text-zinc-300 transition-colors">
              Enquiry
            </a>
            <a
              href={portfolio.profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <ProjectModal
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </div>
  );
}
