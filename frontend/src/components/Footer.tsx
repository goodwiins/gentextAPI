import React, { memo } from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail } from 'lucide-react';

// Memoized sub-components
const SocialButton = memo<{ href: string; icon: React.ReactNode; label: string }>(
  ({ href, icon, label }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-accent hover:text-foreground transition-colors"
    >
      {icon}
    </a>
  )
);
SocialButton.displayName = 'SocialButton';

const FooterLink = memo<{ href: string; label: string }>(
  ({ href, label }) => (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block"
    >
      {label}
    </Link>
  )
);
FooterLink.displayName = 'FooterLink';

const FooterSection = memo<{ title: string; children: React.ReactNode }>(
  ({ title, children }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
);
FooterSection.displayName = 'FooterSection';

const Footer = memo(() => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Resources */}
          <FooterSection title="Resources">
            <nav className="flex flex-col space-y-2.5">
              <FooterLink href="/documentation" label="Documentation" />
              <FooterLink href="/help" label="Help Center" />
              <FooterLink href="/blog" label="Blog" />
            </nav>
          </FooterSection>

          {/* Company */}
          <FooterSection title="Company">
            <nav className="flex flex-col space-y-2.5">
              <FooterLink href="/about" label="About" />
              <FooterLink href="/careers" label="Careers" />
              <FooterLink href="/contact" label="Contact" />
            </nav>
          </FooterSection>

          {/* Legal */}
          <FooterSection title="Legal">
            <nav className="flex flex-col space-y-2.5">
              <FooterLink href="/privacy" label="Privacy" />
              <FooterLink href="/terms" label="Terms" />
              <FooterLink href="/cookies" label="Cookies" />
            </nav>
          </FooterSection>

          {/* Social */}
          <FooterSection title="Social">
            <div className="flex space-x-2">
              <SocialButton
                href="https://github.com"
                icon={<Github className="h-4 w-4" />}
                label="GitHub"
              />
              <SocialButton
                href="https://twitter.com"
                icon={<Twitter className="h-4 w-4" />}
                label="Twitter"
              />
              <SocialButton
                href="mailto:contact@example.com"
                icon={<Mail className="h-4 w-4" />}
                label="Email"
              />
            </div>
          </FooterSection>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors">
              genText AI
            </Link>
            <span className="text-sm text-muted-foreground">
              © {currentYear}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Transform text into engaging quizzes with AI
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer; 