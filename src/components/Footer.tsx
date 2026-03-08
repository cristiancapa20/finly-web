import { Github, Linkedin, Instagram, Globe } from "lucide-react";

const links = [
  { href: "https://github.com/cristiancapa20",           icon: Github,    label: "GitHub" },
  { href: "https://www.linkedin.com/in/cristian-capa/", icon: Linkedin,  label: "LinkedIn" },
  { href: "https://www.instagram.com/capita_cr",        icon: Instagram, label: "Instagram" },
  { href: "https://portafolio-web-cr.vercel.app/",      icon: Globe,     label: "Portafolio" },
];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 py-6 px-4">
      <div className="flex flex-col items-center gap-3 text-sm text-gray-400">
        <div className="flex items-center gap-4">
          {links.map(({ href, icon: Icon, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-gray-900 hover:text-indigo-600 transition-colors"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
        <p>
          © {new Date().getFullYear()} — Hecho por{" "}
          <span className="font-medium text-gray-600">Cristian Capa</span>
        </p>
      </div>
    </footer>
  );
}
